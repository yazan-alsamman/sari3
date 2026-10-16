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
import { DEMO_DRIVER } from "./demo-pricing";
import {
  apiCancelOrder,
  apiCreateOrder,
  apiGetOrderTracking,
  apiListMyOrders,
  apiLogin,
  apiRegister,
  apiSubmitRating,
  clearApiSession,
  type ServerOrder,
} from "./backend-api";
import {
  isOpenServerOrder,
  mapServerOrderStatus,
  priceFromServer,
} from "./server-order";
import { zoneIdForName } from "./live-pricing";
import {
  cancelDemoJob,
  phaseToCustomerStatus,
  subscribeDemoDispatch,
} from "./demo-dispatch-bus";
import { recordAdminRating } from "./demo-admin-ops";
import { playTone, pushNotify, vibratePattern } from "./notify";
import type {
  ActiveOrder,
  ClientProfile,
  DeliveryMode,
  OrderDraft,
  RatingSubmission,
  StopPoint,
} from "./types";

export type AppStep = "welcome" | "auth" | "order" | "tracking";

interface AppState {
  step: AppStep;
  profile: ClientProfile | null;
  draft: OrderDraft;
  activeOrder: ActiveOrder | null;
  lastRating: RatingSubmission | null;
  showRatingModal: boolean;
  showCancelModal: boolean;
  setStep: (step: AppStep) => void;
  goBack: () => void;
  /** @deprecated Prefer registerCustomer / loginCustomer — kept for compatibility */
  saveProfile: (profile: ClientProfile) => void;
  registerCustomer: (profile: Omit<ClientProfile, "id" | "createdAt">) => Promise<
    { ok: true } | { ok: false; error: string }
  >;
  loginCustomer: (input: {
    phone: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logoutCustomer: () => void;
  /** Clear session and force auth screen when entering customer role */
  requireCustomerLoginScreen: () => void;
  updateDraft: (patch: Partial<OrderDraft>) => void;
  setPickup: (pickup: Partial<StopPoint>) => void;
  setDelivery: (delivery: Partial<StopPoint>) => void;
  addStop: () => void;
  updateStop: (id: string, patch: Partial<StopPoint>) => void;
  removeStop: (id: string) => void;
  setMode: (mode: DeliveryMode) => void;
  submitOrder: () => Promise<boolean>;
  /** Future Driver app only — not used in customer UI. */
  markDeliveredByDriver: () => void;
  submitRating: (stars: number, notes: string) => Promise<boolean>;
  closeRatingModal: () => void;
  openRatingModal: () => void;
  openCancelModal: () => void;
  closeCancelModal: () => void;
  cancelOrder: (reason: string) => void;
  startNewOrder: () => void;
  reconcileActiveOrder: () => Promise<void>;
  applyDriverPoint: (input: {
    orderId: string;
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    capturedAt: string;
    freshness: string;
  }) => void;
  applyParsedOrder: (parsed: {
    pickup: { shopName: string; area: string };
    delivery: { shopName: string; area: string };
    intermediateStops: { shopName: string; area: string }[];
    mode: DeliveryMode;
    specialNotes: string;
  }) => void;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyStop(kind: string): StopPoint {
  return { id: uid(kind), shopName: "", area: "", note: "" };
}

function orderFromServer(row: ServerOrder, prev: ActiveOrder | null): ActiveOrder | null {
  const status = mapServerOrderStatus(row.status);
  if (!status || !row.pickup || !row.delivery) return null;
  const price = priceFromServer(row);
  if (prev && (prev.serverOrderId === row.id || prev.id === row.id)) {
    return {
      ...prev,
      status,
      orderNumber: row.orderNumber,
      price,
      driverPoint: status === "searching" ? undefined : prev.driverPoint,
      ratingEligible: row.status === "COMPLETED",
      cancelReason: row.cancelReason ?? prev.cancelReason,
    };
  }
  return {
    id: row.id,
    serverOrderId: row.id,
    orderNumber: row.orderNumber,
    status,
    createdAt: row.createdAt,
    price,
    cancelReason: row.cancelReason ?? undefined,
    ratingEligible: row.status === "COMPLETED",
    draft: {
      pickup: {
        id: uid("pickup"),
        shopName: row.pickup.shopName,
        area: row.pickup.zoneName,
        note: row.pickup.landmark,
      },
      delivery: {
        id: uid("delivery"),
        shopName: row.delivery.shopName,
        area: row.delivery.zoneName,
        note: row.delivery.landmark,
      },
      intermediateStops: [],
      mode: row.mode ?? "standard",
      specialNotes: row.specialHandlingNotes ?? "",
      packageType: "",
      packageSize: row.weightClass === "heavy" ? "heavy" : "light",
    },
  };
}

function createEmptyDraft(): OrderDraft {
  return {
    pickup: emptyStop("pickup"),
    delivery: emptyStop("delivery"),
    intermediateStops: [],
    mode: "standard",
    specialNotes: "",
    packageType: "",
    packageSize: "",
  };
}

const AppContext = createContext<AppState | null>(null);

const CUSTOMER_ACCOUNTS_KEY = "sareee-customer-accounts-v1";
const CUSTOMER_SESSION_KEY = "sareee-customer-session-v1";

function readCustomerAccounts(): ClientProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOMER_ACCOUNTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ClientProfile[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeCustomerAccounts(list: ClientProfile[]) {
  localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify(list));
}

function applyProfileToDraft(
  setDraft: (updater: (d: OrderDraft) => OrderDraft) => void,
  next: ClientProfile,
) {
  setDraft((d) => ({
    ...d,
    delivery: {
      ...d.delivery,
      shopName: d.delivery.shopName || next.shopName,
      area: d.delivery.area || next.industrialArea,
    },
  }));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<AppStep>("welcome");
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [draft, setDraft] = useState<OrderDraft>(createEmptyDraft);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [lastRating, setLastRating] = useState<RatingSubmission | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const timersRef = useRef<number[]>([]);
  const submitKeyRef = useRef("");
  const reconcileRef = useRef<() => Promise<void>>(async () => {});
  const profileRef = useRef<ClientProfile | null>(null);
  const activeOrderRef = useRef<ActiveOrder | null>(null);
  const reconcileGen = useRef(0);
  profileRef.current = profile;
  activeOrderRef.current = activeOrder;

  const clearOrderTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const goBack = useCallback(() => {
    setStep((current) => {
      if (current === "auth") return "welcome";
      if (current === "order") return "auth";
      if (current === "tracking") return "order";
      return current;
    });
  }, []);

  const enterAsCustomer = useCallback((next: ClientProfile) => {
    profileRef.current = next;
    setProfile(next);
    applyProfileToDraft(setDraft, next);
    setStep("order");
    void reconcileRef.current();
  }, []);

  const registerCustomer = useCallback(
    async (input: Omit<ClientProfile, "id" | "createdAt">) => {
      const fullName = input.fullName.trim();
      const phone = input.phone.trim();
      const password = input.password;
      const shopName = input.shopName.trim();
      const industrialArea = input.industrialArea.trim();
      const personalInfo = input.personalInfo.trim();

      if (fullName.length < 2) {
        return { ok: false as const, error: "الاسم الكامل مطلوب" };
      }
      if (!/^09\d{8}$/.test(phone)) {
        return {
          ok: false as const,
          error: "أدخل رقم موبايل سوري صالح (09xxxxxxxx)",
        };
      }
      if (password.length < 8) {
        return { ok: false as const, error: "كلمة المرور 8 أحرف على الأقل" };
      }
      if (!shopName) {
        return { ok: false as const, error: "اسم المحل الدائم مطلوب" };
      }
      if (!industrialArea) {
        return { ok: false as const, error: "المنطقة الصناعية مطلوبة" };
      }

      try {
        const user = await apiRegister({
          phone,
          password,
          role: "customer",
          displayName: fullName,
        });
        const account: ClientProfile = {
          id: user.id,
          fullName,
          phone: user.phone,
          password: "",
          shopName,
          industrialArea,
          personalInfo,
          createdAt: new Date().toISOString(),
        };
        const accounts = readCustomerAccounts().filter((a) => a.phone !== user.phone);
        writeCustomerAccounts([...accounts, account]);
        localStorage.setItem(CUSTOMER_SESSION_KEY, account.id!);
        enterAsCustomer(account);
        return { ok: true as const };
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : "فشل إنشاء الحساب",
        };
      }
    },
    [enterAsCustomer],
  );

  const loginCustomer = useCallback(
    async (input: { phone: string; password: string }) => {
      const phone = input.phone.trim();
      if (!phone || input.password.length < 8) {
        return { ok: false as const, error: "رقم الموبايل أو كلمة المرور ناقصة" };
      }
      try {
        const user = await apiLogin(phone, input.password);
        if (user.role !== "customer") {
          return { ok: false as const, error: "هذا الحساب ليس حساب عميل" };
        }
        const cached = readCustomerAccounts().find((a) => a.phone === user.phone);
        const account: ClientProfile = {
          id: user.id,
          fullName: cached?.fullName || "عميل",
          phone: user.phone,
          password: "",
          shopName: cached?.shopName || "",
          industrialArea: cached?.industrialArea || "",
          personalInfo: cached?.personalInfo || "",
          createdAt: cached?.createdAt,
        };
        localStorage.setItem(CUSTOMER_SESSION_KEY, user.id);
        enterAsCustomer(account);
        return { ok: true as const };
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : "فشل الدخول",
        };
      }
    },
    [enterAsCustomer],
  );

  const logoutCustomer = useCallback(() => {
    reconcileGen.current += 1;
    clearApiSession();
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    profileRef.current = null;
    setProfile(null);
    setDraft(createEmptyDraft());
    clearOrderTimers();
    setActiveOrder(null);
    setLastRating(null);
    setShowRatingModal(false);
    setShowCancelModal(false);
    setStep("auth");
  }, [clearOrderTimers]);

  const requireCustomerLoginScreen = useCallback(() => {
    reconcileGen.current += 1;
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    profileRef.current = null;
    setProfile(null);
    clearOrderTimers();
    setActiveOrder(null);
    setShowRatingModal(false);
    setShowCancelModal(false);
    setStep("auth");
  }, [clearOrderTimers]);

  /** Legacy helper — registers if new, otherwise updates session profile only */
  const saveProfile = useCallback(
    (next: ClientProfile) => {
      enterAsCustomer({ ...next, password: next.password || "" });
    },
    [enterAsCustomer],
  );

  const updateDraft = useCallback((patch: Partial<OrderDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const setPickup = useCallback((patch: Partial<StopPoint>) => {
    setDraft((d) => ({ ...d, pickup: { ...d.pickup, ...patch } }));
  }, []);

  const setDelivery = useCallback((patch: Partial<StopPoint>) => {
    setDraft((d) => ({ ...d, delivery: { ...d.delivery, ...patch } }));
  }, []);

  const addStop = useCallback(() => {
    setDraft((d) => ({
      ...d,
      intermediateStops: [...d.intermediateStops, emptyStop("stop")],
    }));
  }, []);

  const updateStop = useCallback((id: string, patch: Partial<StopPoint>) => {
    setDraft((d) => ({
      ...d,
      intermediateStops: d.intermediateStops.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    }));
  }, []);

  const removeStop = useCallback((id: string) => {
    setDraft((d) => ({
      ...d,
      intermediateStops: d.intermediateStops.filter((s) => s.id !== id),
    }));
  }, []);

  const setMode = useCallback((mode: DeliveryMode) => {
    setDraft((d) => ({ ...d, mode }));
  }, []);

  const applyParsedOrder = useCallback(
    (parsed: {
      pickup: { shopName: string; area: string };
      delivery: { shopName: string; area: string };
      intermediateStops: { shopName: string; area: string }[];
      mode: DeliveryMode;
      specialNotes: string;
    }) => {
      setDraft({
        pickup: {
          ...emptyStop("pickup"),
          shopName: parsed.pickup.shopName,
          area: parsed.pickup.area,
        },
        delivery: {
          ...emptyStop("delivery"),
          shopName: parsed.delivery.shopName,
          area: parsed.delivery.area,
        },
        intermediateStops: parsed.intermediateStops.map((s) => ({
          ...emptyStop("stop"),
          shopName: s.shopName,
          area: s.area,
        })),
        mode: parsed.mode,
        specialNotes: parsed.specialNotes,
        packageType: "",
        packageSize: "",
      });
    },
    [],
  );

  const submitOrder = useCallback(async () => {
    clearOrderTimers();
    const weightClass = draft.packageSize === "heavy" ? "heavy" : "light";
    const pickupZoneId = await zoneIdForName(draft.pickup.area);
    const deliveryZoneId = await zoneIdForName(draft.delivery.area);
    if (!pickupZoneId || !deliveryZoneId) {
      void pushNotify(
        "ما انسجل الطلب",
        "المنطقة مش ضمن مناطق الخدمة الحالية",
        "warn",
      );
      return false;
    }

    const notes =
      draft.specialNotes.trim() ||
      draft.packageType.trim() ||
      (weightClass === "heavy" ? "أوزان ثقيلة" : "أوزان خفيفة");
    if (!submitKeyRef.current) {
      submitKeyRef.current = crypto.randomUUID();
    }

    try {
      const created = await apiCreateOrder(
        {
          pickupZoneId,
          deliveryZoneId,
          pickupShopName: draft.pickup.shopName.trim(),
          deliveryShopName: draft.delivery.shopName.trim(),
          pickupLandmark: draft.pickup.note?.trim() || draft.pickup.area.trim(),
          deliveryLandmark:
            draft.delivery.note?.trim() || draft.delivery.area.trim(),
          specialHandlingNotes: notes,
          mode: draft.mode,
          weightClass,
          intermediateStopCount: draft.intermediateStops.length,
        },
        submitKeyRef.current,
      );
      submitKeyRef.current = "";
      const price = {
        currencyLabel: created.price.currencyLabel,
        baseAmount: created.price.baseAmount,
        modeSurcharge: created.price.modeSurcharge,
        stopsSurcharge:
          created.price.stopsSurcharge + created.price.heavySurcharge,
        total: created.price.totalAmount,
        isDemo: false,
        disclaimer: "حسب تسعير المناطق الحالي",
      };
      const order: ActiveOrder = {
        id: created.id,
        serverOrderId: created.id,
        orderNumber: created.orderNumber,
        draft: structuredClone(draft),
        price,
        status: "searching",
        createdAt: created.createdAt,
      };
      setActiveOrder(order);
      setStep("tracking");
      setShowRatingModal(false);
      setShowCancelModal(false);
      setLastRating(null);
      void pushNotify(
        "تم تسجيل الطلب",
        `${created.orderNumber} — الخدمة تبحث عن سائق`,
        "success",
      );
      playTone("normal");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "فشل تسجيل الطلب";
      if (/idempotency/i.test(message)) submitKeyRef.current = "";
      void pushNotify("ما انسجل الطلب", message, "warn");
      return false;
    }
  }, [draft, clearOrderTimers]);

  // Sync status from driver trip steps (demo bus)
  useEffect(() => {
    return subscribeDemoDispatch((jobs) => {
      setActiveOrder((current) => {
        if (!current || current.status === "rated" || current.status === "cancelled") {
          return current;
        }
        const job = jobs.find((j) => j.orderId === current.id);
        if (!job) return current;
        const nextStatus = phaseToCustomerStatus(job.phase);
        if (!nextStatus || nextStatus === current.status) {
          // still update driver info when accepted
          if (
            (job.phase === "heading_pickup" || job.phase === "at_pickup") &&
            job.driverName &&
            !current.driver
          ) {
            clearOrderTimers();
            return {
              ...current,
              status: "assigned",
              driver: {
                name: job.driverName,
                phone: job.driverPhone || DEMO_DRIVER.phone,
                plate: job.driverPlate || DEMO_DRIVER.plate,
                etaMinutes: DEMO_DRIVER.etaMinutes,
              },
            };
          }
          return current;
        }

        clearOrderTimers();
        const withDriver =
          job.driverName
            ? {
                name: job.driverName,
                phone: job.driverPhone || DEMO_DRIVER.phone,
                plate: job.driverPlate || DEMO_DRIVER.plate,
                etaMinutes: DEMO_DRIVER.etaMinutes,
              }
            : current.driver;

        if (nextStatus === "delivered" && !current.serverOrderId) {
          window.setTimeout(() => setShowRatingModal(true), 300);
          void pushNotify(
            "تم التسليم",
            "السائق أكّد التسليم — قيّموا الخدمة",
            "success",
          );
          playTone("normal");
        } else if (nextStatus === "assigned") {
          void pushNotify(
            "تم تعيين سائق",
            `${withDriver?.name ?? "سائق"} بالطريق للاستلام`,
            "success",
          );
          playTone("normal");
          vibratePattern("normal");
        } else if (nextStatus === "in_transit") {
          void pushNotify(
            "السائق بالطريق",
            "القطعة انطلبت — عم تتوجه لإلكم",
            "info",
          );
          playTone("normal");
        }

        return {
          ...current,
          status: nextStatus,
          driver: withDriver,
        };
      });
    });
  }, [clearOrderTimers]);

  /** Reserved for future Driver app — customer UI must not call this. */
  const markDeliveredByDriver = useCallback(() => {
    clearOrderTimers();
    setActiveOrder((current) =>
      current && current.status !== "cancelled"
        ? { ...current, status: "delivered" }
        : current,
    );
    setShowRatingModal(true);
  }, [clearOrderTimers]);

  const submitRating = useCallback(
    async (stars: number, notes: string) => {
      if (!activeOrder) return false;
      if (activeOrder.serverOrderId) {
        try {
          await apiSubmitRating(activeOrder.serverOrderId, stars, notes);
        } catch {
          return false;
        }
      }
      const submission: RatingSubmission = {
        orderId: activeOrder.id,
        stars,
        notes,
        submittedAt: new Date().toISOString(),
      };
      setLastRating(submission);
      setActiveOrder((current) =>
        current ? { ...current, status: "rated", ratingEligible: false } : current,
      );
      setShowRatingModal(false);
      if (!activeOrder.serverOrderId) {
        const orderNumber = activeOrder.id.replace("ord-", "S-").slice(0, 12).toUpperCase();
        recordAdminRating({
          orderId: activeOrder.id,
          orderNumber,
          stars,
          notes,
          driverName: activeOrder.driver?.name,
          customerName: profile?.fullName,
          customerPhone: profile?.phone,
          pickupShop: activeOrder.draft.pickup.shopName,
          deliveryShop: activeOrder.draft.delivery.shopName,
        });
      }
      return true;
    },
    [activeOrder, profile],
  );

  const closeRatingModal = useCallback(() => {
    setShowRatingModal(false);
  }, []);

  const openRatingModal = useCallback(() => {
    if (
      activeOrder?.ratingEligible ||
      activeOrder?.status === "delivered" ||
      activeOrder?.status === "rated"
    ) {
      setShowRatingModal(true);
    }
  }, [activeOrder]);

  const openCancelModal = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const closeCancelModal = useCallback(() => {
    setShowCancelModal(false);
  }, []);

  const cancelOrder = useCallback(
    (reason: string) => {
      const current = activeOrder;
      if (!current) return;
      const trimmed = reason.trim();
      void (async () => {
        if (current.serverOrderId) {
          try {
            await apiCancelOrder(current.serverOrderId, trimmed);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "ما قدرنا نلغي الطلب";
            void pushNotify("ما انلغى الطلب", message, "warn");
            return;
          }
        } else {
          cancelDemoJob(current.id);
        }
        clearOrderTimers();
        setActiveOrder({
          ...current,
          status: "cancelled",
          cancelReason: trimmed,
          cancelledAt: new Date().toISOString(),
        });
        setShowCancelModal(false);
        setShowRatingModal(false);
      })();
    },
    [activeOrder, clearOrderTimers],
  );

  const reconcileActiveOrder = useCallback(async () => {
    if (!profileRef.current) return;
    const gen = reconcileGen.current;
    let rows: ServerOrder[];
    try {
      rows = await apiListMyOrders();
    } catch {
      return;
    }
    if (gen !== reconcileGen.current || !profileRef.current) return;
    const open = rows.find((row) => isOpenServerOrder(row.status));
    const current = activeOrderRef.current;
    const target =
      open ??
      (current?.serverOrderId
        ? rows.find((row) => row.id === current.serverOrderId)
        : undefined);
    if (!target) return;
    let next = orderFromServer(target, current);
    if (!next) return;
    if (
      next.serverOrderId &&
      next.status !== "searching" &&
      next.status !== "cancelled"
    ) {
      try {
        const track = await apiGetOrderTracking(next.serverOrderId);
        if (gen !== reconcileGen.current || !profileRef.current) return;
        if (track.point) {
          next = {
            ...next,
            driverPoint: {
              latitude: track.point.latitude,
              longitude: track.point.longitude,
              accuracyMeters: track.point.accuracyMeters,
              capturedAt: track.point.capturedAt,
              freshness: track.freshness,
            },
          };
        }
      } catch {
        /* keep prior point; REST miss must not block status reconcile */
      }
    }
    if (gen !== reconcileGen.current || !profileRef.current) return;
    setActiveOrder(next);
    if (open && next.serverOrderId === open.id) setStep("tracking");
  }, []);
  const applyDriverPoint = useCallback(
    (input: {
      orderId: string;
      latitude: number;
      longitude: number;
      accuracyMeters: number;
      capturedAt: string;
      freshness: string;
    }) => {
      setActiveOrder((current) => {
        if (!current || current.serverOrderId !== input.orderId) return current;
        if (current.status === "searching" || current.status === "cancelled") return current;
        return {
          ...current,
          driverPoint: {
            latitude: input.latitude,
            longitude: input.longitude,
            accuracyMeters: input.accuracyMeters,
            capturedAt: input.capturedAt,
            freshness: input.freshness,
          },
        };
      });
    },
    [],
  );

  reconcileRef.current = reconcileActiveOrder;

  const startNewOrder = useCallback(() => {
    clearOrderTimers();
    setDraft(createEmptyDraft());
    setActiveOrder(null);
    setShowRatingModal(false);
    setShowCancelModal(false);
    setLastRating(null);
    setStep("order");
  }, [clearOrderTimers]);

  const value = useMemo<AppState>(
    () => ({
      step,
      profile,
      draft,
      activeOrder,
      lastRating,
      showRatingModal,
      showCancelModal,
      setStep,
      goBack,
      saveProfile,
      registerCustomer,
      loginCustomer,
      logoutCustomer,
      requireCustomerLoginScreen,
      updateDraft,
      setPickup,
      setDelivery,
      addStop,
      updateStop,
      removeStop,
      setMode,
      submitOrder,
      markDeliveredByDriver,
      submitRating,
      closeRatingModal,
      openRatingModal,
      openCancelModal,
      closeCancelModal,
      cancelOrder,
      startNewOrder,
      reconcileActiveOrder,
      applyDriverPoint,
      applyParsedOrder,
    }),
    [
      step,
      profile,
      draft,
      activeOrder,
      lastRating,
      showRatingModal,
      showCancelModal,
      goBack,
      saveProfile,
      registerCustomer,
      loginCustomer,
      logoutCustomer,
      requireCustomerLoginScreen,
      updateDraft,
      setPickup,
      setDelivery,
      addStop,
      updateStop,
      removeStop,
      setMode,
      submitOrder,
      markDeliveredByDriver,
      submitRating,
      closeRatingModal,
      openRatingModal,
      openCancelModal,
      closeCancelModal,
      cancelOrder,
      startNewOrder,
      reconcileActiveOrder,
      applyDriverPoint,
      applyParsedOrder,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
