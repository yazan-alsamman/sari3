"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  acceptDemoOffer,
  closeDemoJob,
  getDemoJob,
  listOpenDemoOffers,
  setDemoTripPhase,
  subscribeDemoDispatch,
  type DemoTripPhase,
} from "./demo-dispatch-bus";
import {
  getDriverApproval,
  publishDriverPresence,
  recordDeliveryLedger,
  registerDriverJoinRequest,
  subscribeAdminOps,
  type DriverApprovalStatus,
} from "./demo-admin-ops";
import { splitDemoDeliveryCharge } from "./demo-admin-config";
import {
  basketSizeLabel,
  driverCanTakePackage,
  type PackageWeightClass,
} from "./demo-capacity";
import {
  DEFAULT_DRIVER_SETTINGS,
  type DriverAccount,
  type DriverAvailability,
  type DriverCompletedTrip,
  type DriverOffer,
  type DriverSettings,
  type DriverVehicle,
} from "./driver-types";
import { playTone, pushNotify, showInAppToast, vibratePattern } from "./notify";

const ACCOUNTS_KEY = "sareee-driver-accounts-v1";
const SESSION_KEY = "sareee-driver-session-v1";
const SETTINGS_KEY = "sareee-driver-settings-v1";
const DAY_TRIPS_KEY = "sareee-driver-day-trips-v1";
const OFFER_WINDOW_SEC = 15;

type DriverStep = "auth" | "home" | "active" | "day_end";

function normalizeAccount(a: DriverAccount): DriverAccount {
  const basketSize =
    a.vehicle?.basketSize ??
    (a.vehicle?.basketInfo?.includes("كبير") ? "large" : "small");
  return {
    ...a,
    approvalStatus: a.approvalStatus ?? "approved",
    vehicle: {
      motorcycleModel: a.vehicle?.motorcycleModel ?? "",
      plateNumber: a.vehicle?.plateNumber ?? "",
      basketInfo:
        a.vehicle?.basketInfo?.trim() ||
        basketSizeLabel(basketSize) ||
        "سلة صغيرة",
      basketSize,
      capacityNote: a.vehicle?.capacityNote?.trim() || a.vehicle?.basketInfo || "",
    },
  };
}

function offerWeightClass(o: DriverOffer): PackageWeightClass {
  if (o.packageWeightClass === "heavy" || o.packageWeightClass === "light") {
    return o.packageWeightClass;
  }
  const label = o.packageSizeLabel ?? "";
  if (label.includes("ثقيل") || label.includes("كبيرة")) return "heavy";
  return "light";
}

function resolveApproval(account: DriverAccount): DriverApprovalStatus {
  const fromOps = getDriverApproval(account.id);
  if (fromOps) return fromOps;
  // Re-read account row from storage (admin may have mirrored approval there)
  try {
    const accounts = readJson<DriverAccount[]>(ACCOUNTS_KEY, []);
    const row = accounts.find((a) => a.id === account.id);
    if (row?.approvalStatus) return row.approvalStatus;
  } catch {
    /* ignore */
  }
  return account.approvalStatus ?? "approved";
}

interface DriverContextValue {
  step: DriverStep;
  setStep: (s: DriverStep) => void;
  account: DriverAccount | null;
  approvalStatus: DriverApprovalStatus;
  availability: DriverAvailability;
  settings: DriverSettings;
  offer: DriverOffer | null;
  offerSecondsLeft: number;
  activeOffer: DriverOffer | null;
  /** Accepted second order waiting until first trip finishes */
  queuedOffer: DriverOffer | null;
  tripPhase: DemoTripPhase | null;
  dayTrips: DriverCompletedTrip[];
  position: { lat: number; lng: number } | null;
  locationError: string | null;
  locationSharing: boolean;
  nearDelivery: boolean;
  register: (input: {
    firstName: string;
    lastName: string;
    birthDate: string;
    idPhotoDataUrl: string;
    phone: string;
    password: string;
    vehicle: DriverVehicle;
  }) => { ok: true } | { ok: false; error: string };
  login: (input: {
    displayName: string;
    password: string;
  }) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  setAvailability: (a: DriverAvailability) => { ok: true } | { ok: false; error: string };
  updateSettings: (patch: Partial<DriverSettings>) => void;
  acceptOffer: () => void;
  rejectOffer: () => void;
  /** Driver only confirms cash collected — GPS auto-advances earlier phases */
  completeDeliveryWithPayment: () => void;
  endDay: () => void;
  clearDayAndContinue: () => void;
  simulateOfferNow: () => void;
  /** Always show login/register when entering the driver role from welcome */
  requireLoginScreen: () => void;
}

const DriverContext = createContext<DriverContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  if (key === ACCOUNTS_KEY && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sareee-demo-admin-ops"));
    try {
      const bc = new BroadcastChannel("sareee-demo-admin-ops");
      bc.postMessage({ type: "accounts", at: Date.now() });
      bc.close();
    } catch {
      /* ignore */
    }
  }
}

function alertIncomingOffer(offer: DriverOffer) {
  const vip = offer.mode === "vip";
  playTone(vip ? "vip" : "normal");
  vibratePattern(vip ? "vip" : "normal");
  void pushNotify(
    vip ? "طلب VIP عاجل — 15 ثانية" : "طلب جديد — 15 ثانية للقبول",
    `${offer.customerName}: ${offer.pickup.area} → ${offer.delivery.area} · ${offer.earningsAmount.toLocaleString("ar-SY")}`,
    vip ? "vip" : "offer",
  );
}

export function DriverProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<DriverStep>("auth");
  const [account, setAccount] = useState<DriverAccount | null>(null);
  const [approvalStatus, setApprovalStatus] =
    useState<DriverApprovalStatus>("pending");
  const [availability, setAvailabilityState] = useState<DriverAvailability>("offline");
  const [settings, setSettings] = useState<DriverSettings>(DEFAULT_DRIVER_SETTINGS);
  const [offer, setOffer] = useState<DriverOffer | null>(null);
  const [offerSecondsLeft, setOfferSecondsLeft] = useState(0);
  const [activeOffer, setActiveOffer] = useState<DriverOffer | null>(null);
  const [queuedOffer, setQueuedOffer] = useState<DriverOffer | null>(null);
  const [tripPhase, setTripPhase] = useState<DemoTripPhase | null>(null);
  const [nearDelivery, setNearDelivery] = useState(false);
  const [dayTrips, setDayTrips] = useState<DriverCompletedTrip[]>([]);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSharing, setLocationSharing] = useState(false);
  const phaseEnteredAtRef = useRef<number>(Date.now());
  const lastAutoPhaseRef = useRef<DemoTripPhase | null>(null);
  /** Order IDs this driver already finished / rejected / timed out — never re-offer */
  const skippedOrderIdsRef = useRef<Set<string>>(new Set());

  function skipOrder(orderId: string | undefined | null) {
    if (!orderId) return;
    skippedOrderIdsRef.current.add(orderId);
  }

  function isSkipped(orderId: string | undefined | null): boolean {
    if (!orderId) return false;
    return skippedOrderIdsRef.current.has(orderId);
  }

  useEffect(() => {
    // Load saved settings/trips only — do NOT auto-enter home from a prior session.
    // Do not rewrite all driver accounts here (would race with admin approval writes).
    setSettings(readJson(SETTINGS_KEY, DEFAULT_DRIVER_SETTINGS));
    setDayTrips(readJson(DAY_TRIPS_KEY, []));
  }, []);

  // Sync approval from admin ops (events + poll — admin may approve in another tab)
  useEffect(() => {
    if (!account) return;
    const driverId = account.id;

    const apply = () => {
      const resolved = resolveApproval({ ...account, id: driverId });
      setApprovalStatus((prev) => {
        if (prev !== resolved && resolved === "approved") {
          void pushNotify(
            "تمت الموافقة",
            "الأدمن وافق — تقدروا تشغّلوا العمل هلق",
          );
          playTone("normal");
        }
        return resolved;
      });
      setAccount((a) => (a && a.id === driverId ? { ...a, approvalStatus: resolved } : a));
      if (resolved !== "approved") {
        setAvailabilityState((av) => (av === "available" ? "offline" : av));
        setOffer(null);
      }
    };

    apply();
    const unsub = subscribeAdminOps(apply);
    const poll = window.setInterval(apply, 1000);
    const onFocus = () => apply();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      unsub();
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
    // Only re-subscribe when the logged-in driver id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  useEffect(() => {
    if (!account || step === "auth") {
      setLocationSharing(false);
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("الجهاز ما بيدعم تحديد الموقع");
      setPosition({ lat: 33.487, lng: 36.301 }); // دمشق تقريبي للعرض
      return;
    }

    setLocationSharing(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? "اذنوا بالموقع لعرض مكانكم على الخريطة"
            : "تعذّر قراءة الموقع — عرض نقطة تقريبية",
        );
        setPosition((p) => p ?? { lat: 33.487, lng: 36.301 });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setLocationSharing(false);
    };
  }, [account, step]);

  // Publish live presence for admin map (even when offline / standing still)
  useEffect(() => {
    if (!account || step === "auth" || !position) return;
    const busy = Boolean(activeOffer);
    publishDriverPresence({
      driverId: account.id,
      displayName: account.displayName,
      phone: account.phone,
      lat: position.lat,
      lng: position.lng,
      availability: busy ? "busy" : availability,
      approvalStatus,
      activeOrderNumber: activeOffer?.orderNumber,
    });
    const t = window.setInterval(() => {
      publishDriverPresence({
        driverId: account.id,
        displayName: account.displayName,
        phone: account.phone,
        lat: position.lat,
        lng: position.lng,
        availability: busy ? "busy" : availability,
        approvalStatus,
        activeOrderNumber: activeOffer?.orderNumber,
      });
    }, 4000);
    return () => window.clearInterval(t);
  }, [account, position, availability, approvalStatus, activeOffer, step]);

  // Demo trip progress: advance a stage every few seconds for testing.
  // (Later: GPS proximity to map points — for now timed so QA works without driving.)
  useEffect(() => {
    if (!activeOffer || !tripPhase || step !== "active") return;
    if (tripPhase === "delivered") return;

    const DEMO_PHASE_MS = 8000;

    const t = window.setTimeout(() => {
      let next: DemoTripPhase | null = null;
      if (tripPhase === "heading_pickup") next = "at_pickup";
      else if (tripPhase === "at_pickup") next = "in_transit";
      else if (tripPhase === "in_transit") {
        setNearDelivery(true);
        void pushNotify(
          "قرب التسليم (≤ ٥ دقائق)",
          "تقدروا تستلموا طلب ثاني هلق، أو خلّصوا التسليم الأول",
          "offer",
        );
        return;
      }

      if (!next) return;
      phaseEnteredAtRef.current = Date.now();
      lastAutoPhaseRef.current = next;
      setTripPhase(next);
      setNearDelivery(false);
      if (activeOffer.linkedOrderId) {
        setDemoTripPhase(activeOffer.linkedOrderId, next);
      }
      void pushNotify(
        "تحديث الرحلة",
        next === "at_pickup"
          ? "عند نقطة الاستلام (تجريبي · كل 8 ثوانٍ)"
          : "بالطريق للتسليم (تجريبي · كل 8 ثوانٍ)",
      );
    }, DEMO_PHASE_MS);

    return () => window.clearTimeout(t);
  }, [activeOffer, tripPhase, step]);

  // Real customer offers — basket filter; second offer when near delivery or after finish
  const presentOffer = useCallback(
    (incoming?: DriverOffer) => {
      const basket = account?.vehicle.basketSize;
      const matches = (o: DriverOffer) =>
        !isSkipped(o.linkedOrderId) &&
        !isSkipped(o.id) &&
        driverCanTakePackage(basket, offerWeightClass(o));

      let next = incoming;
      if (!next) {
        const open = listOpenDemoOffers().filter(
          (j) =>
            !isSkipped(j.orderId) &&
            matches(j.offer),
        );
        next = open[0]?.offer;
      } else if (!matches(next)) {
        const open = listOpenDemoOffers().find(
          (j) => !isSkipped(j.orderId) && matches(j.offer),
        );
        next = open?.offer;
      }
      if (!next || isSkipped(next.linkedOrderId)) {
        setOffer(null);
        setOfferSecondsLeft(0);
        return false;
      }
      const job = next.linkedOrderId ? getDemoJob(next.linkedOrderId) : undefined;
      if (job && job.phase !== "offered") {
        setOffer(null);
        setOfferSecondsLeft(0);
        return false;
      }
      const charge = job?.totalCharge ?? next.earningsAmount;
      const { driverEarning } = splitDemoDeliveryCharge(charge, account?.id);
      const timed: DriverOffer = {
        ...next,
        packageWeightClass: offerWeightClass(next),
        earningsAmount: Math.max(1000, driverEarning),
        expiresInSec: OFFER_WINDOW_SEC,
      };
      setOffer(timed);
      setOfferSecondsLeft(OFFER_WINDOW_SEC);
      alertIncomingOffer(timed);
      return true;
    },
    [account?.id, account?.vehicle.basketSize],
  );

  // Pull offers: idle on home, OR near first delivery (≤5 min), OR after finish (no active)
  useEffect(() => {
    if (availability !== "available" && !(activeOffer && nearDelivery)) {
      return;
    }
    if (approvalStatus !== "approved" || !account) return;
    if (offer || queuedOffer) return;
    // Already have active trip and not yet near delivery → no second offer
    if (activeOffer && !nearDelivery) return;
    // Max 2: if queued already full
    if (activeOffer && queuedOffer) return;
    if (step !== "home" && !(step === "active" && nearDelivery)) return;

    const tryPull = () => {
      presentOffer();
    };

    tryPull();
    const unsub = subscribeDemoDispatch(() => tryPull());
    const poll = window.setInterval(tryPull, 2000);
    return () => {
      unsub();
      window.clearInterval(poll);
    };
  }, [
    availability,
    approvalStatus,
    account,
    offer,
    activeOffer,
    queuedOffer,
    nearDelivery,
    step,
    presentOffer,
  ]);

  // 15s countdown on the current offer (home or near-delivery on active trip)
  useEffect(() => {
    if (!offer) return;
    if (step !== "home" && step !== "active") return;
    let left = offer.expiresInSec || OFFER_WINDOW_SEC;
    setOfferSecondsLeft(left);
    const tick = window.setInterval(() => {
      left -= 1;
      setOfferSecondsLeft(left);
      if (left === 5 || left === 3) {
        playTone("normal");
        vibratePattern("normal");
      }
      if (left === 1) {
        vibratePattern("vip");
      }
      if (left <= 0) {
        window.clearInterval(tick);
        skipOrder(offer.linkedOrderId ?? offer.id);
        setOffer(null);
      }
    }, 1000);
    return () => window.clearInterval(tick);
    // intentionally keyed by offer id only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer?.id, step, offer?.expiresInSec]);

  const register = useCallback(
    (input: {
      firstName: string;
      lastName: string;
      birthDate: string;
      idPhotoDataUrl: string;
      phone: string;
      password: string;
      vehicle: DriverVehicle;
    }) => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const name = `${firstName} ${lastName}`.trim();
      const phone = input.phone.trim();
      const password = input.password;
      if (firstName.length < 2) return { ok: false as const, error: "اكتبوا الاسم" };
      if (lastName.length < 2) return { ok: false as const, error: "اكتبوا الكنية" };
      if (!input.birthDate) return { ok: false as const, error: "اختاروا تاريخ الميلاد" };
      if (!input.idPhotoDataUrl) {
        return { ok: false as const, error: "ارفعوا صورة الهوية" };
      }
      if (phone.length < 8) return { ok: false as const, error: "رقم الهاتف ناقص" };
      if (password.length < 4) return { ok: false as const, error: "كلمة المرور قصيرة" };
      if (!input.vehicle.motorcycleModel.trim() || !input.vehicle.plateNumber.trim()) {
        return { ok: false as const, error: "عبّوا معلومات الموتور والنمرة" };
      }
      if (!input.vehicle.basketSize) {
        return { ok: false as const, error: "اختاروا حجم السلة (صغيرة أو كبيرة)" };
      }
      if (!input.vehicle.capacityNote.trim()) {
        return { ok: false as const, error: "اكتبوا السعة القادرين تتحملوها" };
      }

      const accounts = readJson<DriverAccount[]>(ACCOUNTS_KEY, []).map(normalizeAccount);
      if (accounts.some((a) => a.displayName === name)) {
        return { ok: false as const, error: "الاسم مسجّل مسبقاً — اعملوا دخول" };
      }

      const basketLabel = basketSizeLabel(input.vehicle.basketSize);
      const accountNew: DriverAccount = {
        id: `drv-${Date.now().toString(36)}`,
        displayName: name,
        firstName,
        lastName,
        birthDate: input.birthDate,
        idPhotoDataUrl: input.idPhotoDataUrl,
        phone,
        password,
        vehicle: {
          motorcycleModel: input.vehicle.motorcycleModel.trim(),
          basketSize: input.vehicle.basketSize,
          capacityNote: input.vehicle.capacityNote.trim(),
          basketInfo: `${basketLabel} · ${input.vehicle.capacityNote.trim()}`,
          plateNumber: input.vehicle.plateNumber.trim(),
        },
        createdAt: new Date().toISOString(),
        approvalStatus: "pending",
      };
      writeJson(ACCOUNTS_KEY, [...accounts, accountNew]);
      registerDriverJoinRequest({
        driverId: accountNew.id,
        displayName: name,
        phone,
        motorcycleModel: accountNew.vehicle.motorcycleModel,
        plateNumber: accountNew.vehicle.plateNumber,
        basketSize: accountNew.vehicle.basketSize,
        capacityNote: accountNew.vehicle.capacityNote,
      });
      void pushNotify(
        "طلب انضمام مُرسل",
        "حسابكم بانتظار موافقة الأدمن قبل بدء العمل",
      );
      localStorage.setItem(SESSION_KEY, accountNew.id);
      setAccount(accountNew);
      setApprovalStatus("pending");
      setStep("home");
      setAvailabilityState("offline");
      return { ok: true as const };
    },
    [],
  );

  const login = useCallback((input: { displayName: string; password: string }) => {
    const name = input.displayName.trim();
    const accounts = readJson<DriverAccount[]>(ACCOUNTS_KEY, []).map(normalizeAccount);
    const found = accounts.find((a) => a.displayName === name);
    if (!found || found.password !== input.password) {
      return { ok: false as const, error: "الاسم أو كلمة المرور غلط" };
    }
    const status = resolveApproval(found);
    localStorage.setItem(SESSION_KEY, found.id);
    setAccount({ ...found, approvalStatus: status });
    setApprovalStatus(status);
    setStep("home");
    setAvailabilityState("offline");
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setAccount(null);
    setAvailabilityState("offline");
    setOffer(null);
    setActiveOffer(null);
    setQueuedOffer(null);
    setTripPhase(null);
    setStep("auth");
  }, []);

  const requireLoginScreen = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setAccount(null);
    setApprovalStatus("pending");
    setAvailabilityState("offline");
    setOffer(null);
    setOfferSecondsLeft(0);
    setActiveOffer(null);
    setQueuedOffer(null);
    setTripPhase(null);
    setLocationSharing(false);
    setStep("auth");
  }, []);

  const setAvailability = useCallback(
    (a: DriverAvailability) => {
      if (a === "available" && approvalStatus !== "approved") {
        return {
          ok: false as const,
          error:
            approvalStatus === "pending"
              ? "حسابكم بانتظار موافقة الأدمن — ما فيكم تشتغلوا لسا"
              : approvalStatus === "suspended"
                ? "الحساب معلّق من الأدمن"
                : "تم رفض طلب الانضمام — تواصلوا مع الإدارة",
        };
      }
      setAvailabilityState(a);
      if (a === "offline") {
        setOffer(null);
        setOfferSecondsLeft(0);
      }
      return { ok: true as const };
    },
    [approvalStatus],
  );

  const updateSettings = useCallback((patch: Partial<DriverSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJson(SETTINGS_KEY, next);
      return next;
    });
  }, []);

  const acceptOffer = useCallback(() => {
    if (!offer || !account || approvalStatus !== "approved") return;

    // Second order while finishing first (≤5 min): queue it
    if (activeOffer && nearDelivery && !queuedOffer) {
      if (offer.linkedOrderId) {
        acceptDemoOffer({
          orderId: offer.linkedOrderId,
          driverId: account.id,
          driverName: account.displayName,
          driverPhone: account.phone,
          driverPlate: account.vehicle.plateNumber,
        });
      }
      setQueuedOffer(offer);
      setOffer(null);
      setOfferSecondsLeft(0);
      void pushNotify(
        "تم قبول الطلب الثاني",
        "بعد تسليم الطلب الأول رح تروحوا تجيبوا الطلب الجديد · الزبون بيشوف إنكم بالطريق",
        "success",
      );
      return;
    }

    if (activeOffer) return;

    if (offer.linkedOrderId) {
      acceptDemoOffer({
        orderId: offer.linkedOrderId,
        driverId: account.id,
        driverName: account.displayName,
        driverPhone: account.phone,
        driverPlate: account.vehicle.plateNumber,
      });
    }
    setActiveOffer(offer);
    setTripPhase("heading_pickup");
    setNearDelivery(false);
    phaseEnteredAtRef.current = Date.now();
    lastAutoPhaseRef.current = "heading_pickup";
    setOffer(null);
    setOfferSecondsLeft(0);
    setAvailabilityState("offline");
    setStep("active");
  }, [offer, account, approvalStatus, activeOffer, nearDelivery, queuedOffer]);

  const rejectOffer = useCallback(() => {
    if (offer) {
      skipOrder(offer.linkedOrderId ?? offer.id);
    }
    setOffer(null);
    setOfferSecondsLeft(0);
  }, [offer]);

  const finishTripLocal = useCallback(
    (tripOffer: DriverOffer, chargeTotal?: number) => {
      if (!account) return;
      const orderId = tripOffer.linkedOrderId ?? tripOffer.id;
      if (tripOffer.linkedOrderId) {
        setDemoTripPhase(tripOffer.linkedOrderId, "delivered");
        closeDemoJob(tripOffer.linkedOrderId);
      }
      skipOrder(orderId);

      const job = tripOffer.linkedOrderId
        ? getDemoJob(tripOffer.linkedOrderId)
        : undefined;
      const charge =
        chargeTotal ??
        job?.totalCharge ??
        tripOffer.earningsAmount;
      const { driverEarning } = splitDemoDeliveryCharge(charge, account.id);

      const trip: DriverCompletedTrip = {
        id: `trip-${Date.now().toString(36)}`,
        orderNumber: tripOffer.orderNumber,
        customerName: tripOffer.customerName,
        pickupArea: tripOffer.pickup.area,
        deliveryArea: tripOffer.delivery.area,
        mode: tripOffer.mode,
        earningsAmount: driverEarning,
        acceptedAt: tripOffer.createdAt,
        completedAt: new Date().toISOString(),
      };
      setDayTrips((prev) => {
        const next = [...prev, trip];
        writeJson(DAY_TRIPS_KEY, next);
        return next;
      });
      recordDeliveryLedger({
        orderId,
        orderNumber: tripOffer.orderNumber,
        driverId: account.id,
        driverName: account.displayName,
        totalCharge: charge,
        mode: tripOffer.mode,
        pickupShop: tripOffer.pickup.shopName,
        deliveryShop: tripOffer.delivery.shopName,
        completedAt: trip.completedAt,
      });

      const nextQueued = queuedOffer;
      setActiveOffer(null);
      setTripPhase(null);
      setNearDelivery(false);
      setOffer(null);
      setOfferSecondsLeft(0);

      if (nextQueued) {
        setQueuedOffer(null);
        setActiveOffer(nextQueued);
        setTripPhase("heading_pickup");
        phaseEnteredAtRef.current = Date.now();
        lastAutoPhaseRef.current = "heading_pickup";
        setAvailabilityState("offline");
        setStep("active");
        void pushNotify(
          "الطلب التالي جاهز",
          `خلّصتم الأول · هلق طلب ${nextQueued.orderNumber}`,
          "offer",
        );
        return;
      }

      setAvailabilityState("available");
      setStep("home");
      void pushNotify(
        "تم إنهاء الطلب",
        `حصتكم ${driverEarning.toLocaleString("ar-SY")} · بانتظار طلب عميل جديد`,
        "success",
      );
    },
    [account, queuedOffer],
  );

  /** Only manual action: cash collected → close order */
  const completeDeliveryWithPayment = useCallback(() => {
    if (!activeOffer) return;
    if (tripPhase !== "in_transit") return;
    if (!nearDelivery) return;
    finishTripLocal(activeOffer);
  }, [activeOffer, tripPhase, nearDelivery, finishTripLocal]);

  const endDay = useCallback(() => {
    setAvailabilityState("offline");
    setOffer(null);
    setStep("day_end");
  }, []);

  const clearDayAndContinue = useCallback(() => {
    writeJson(DAY_TRIPS_KEY, []);
    setDayTrips([]);
    setStep("home");
  }, []);

  const simulateOfferNow = useCallback(() => {
    const canSecond = Boolean(activeOffer && nearDelivery && !queuedOffer);
    if (
      approvalStatus !== "approved" ||
      (!canSecond && (availability !== "available" || activeOffer))
    ) {
      return;
    }
    const ok = presentOffer();
    if (!ok) {
      showInAppToast(
        "ما في طلبات مناسبة",
        canSecond
          ? "ما في طلب ثاني متوافق مع حجم سلتكم هلق"
          : "اطلبوا من واجهة العميل (نفس المتصفح) — الطلبات الثقيلة ما بتطلع لسلة صغيرة",
        "warn",
      );
    }
  }, [
    availability,
    approvalStatus,
    activeOffer,
    nearDelivery,
    queuedOffer,
    presentOffer,
  ]);

  const value = useMemo<DriverContextValue>(
    () => ({
      step,
      setStep,
      account,
      approvalStatus,
      availability,
      settings,
      offer,
      offerSecondsLeft,
      activeOffer,
      queuedOffer,
      tripPhase,
      nearDelivery,
      dayTrips,
      position,
      locationError,
      locationSharing,
      register,
      login,
      logout,
      setAvailability,
      updateSettings,
      acceptOffer,
      rejectOffer,
      completeDeliveryWithPayment,
      endDay,
      clearDayAndContinue,
      simulateOfferNow,
      requireLoginScreen,
    }),
    [
      step,
      account,
      approvalStatus,
      availability,
      settings,
      offer,
      offerSecondsLeft,
      activeOffer,
      queuedOffer,
      tripPhase,
      nearDelivery,
      dayTrips,
      position,
      locationError,
      locationSharing,
      register,
      login,
      logout,
      setAvailability,
      updateSettings,
      acceptOffer,
      rejectOffer,
      completeDeliveryWithPayment,
      endDay,
      clearDayAndContinue,
      simulateOfferNow,
      requireLoginScreen,
    ],
  );

  return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver() {
  const ctx = useContext(DriverContext);
  if (!ctx) throw new Error("useDriver must be used within DriverProvider");
  return ctx;
}
