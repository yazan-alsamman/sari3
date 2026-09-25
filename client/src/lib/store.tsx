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
import { calculateDemoPrice, DEMO_DRIVER } from "./demo-pricing";
import {
  cancelDemoJob,
  phaseToCustomerStatus,
  publishCustomerOrderAsOffer,
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
  registerCustomer: (profile: Omit<ClientProfile, "id" | "createdAt">) =>
    | { ok: true }
    | { ok: false; error: string };
  loginCustomer: (input: {
    fullName: string;
    password: string;
  }) => { ok: true } | { ok: false; error: string };
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
  submitOrder: () => void;
  /** Future Driver app only — not used in customer UI. */
  markDeliveredByDriver: () => void;
  submitRating: (stars: number, notes: string) => void;
  closeRatingModal: () => void;
  openRatingModal: () => void;
  openCancelModal: () => void;
  closeCancelModal: () => void;
  cancelOrder: (reason: string) => void;
  startNewOrder: () => void;
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
    setProfile(next);
    applyProfileToDraft(setDraft, next);
    setStep("order");
  }, []);

  const registerCustomer = useCallback(
    (input: Omit<ClientProfile, "id" | "createdAt">) => {
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
      if (password.length < 4) {
        return { ok: false as const, error: "كلمة المرور قصيرة (4 أحرف على الأقل)" };
      }
      if (!shopName) {
        return { ok: false as const, error: "اسم المحل الدائم مطلوب" };
      }
      if (!industrialArea) {
        return { ok: false as const, error: "المنطقة الصناعية مطلوبة" };
      }

      const accounts = readCustomerAccounts();
      const nameTaken = accounts.some(
        (a) => a.fullName.trim().toLowerCase() === fullName.toLowerCase(),
      );
      if (nameTaken) {
        return {
          ok: false as const,
          error: "الاسم مسجّل مسبقاً — اعملوا دخول بالاسم وكلمة المرور",
        };
      }

      const account: ClientProfile = {
        id: `cus-${Date.now().toString(36)}`,
        fullName,
        phone,
        password,
        shopName,
        industrialArea,
        personalInfo,
        createdAt: new Date().toISOString(),
      };
      writeCustomerAccounts([...accounts, account]);
      localStorage.setItem(CUSTOMER_SESSION_KEY, account.id!);
      enterAsCustomer(account);
      return { ok: true as const };
    },
    [enterAsCustomer],
  );

  const loginCustomer = useCallback(
    (input: { fullName: string; password: string }) => {
      const name = input.fullName.trim();
      const accounts = readCustomerAccounts();
      const found = accounts.find(
        (a) => a.fullName.trim().toLowerCase() === name.toLowerCase(),
      );
      if (!found || found.password !== input.password) {
        return { ok: false as const, error: "الاسم أو كلمة المرور غلط" };
      }
      if (found.id) localStorage.setItem(CUSTOMER_SESSION_KEY, found.id);
      enterAsCustomer(found);
      return { ok: true as const };
    },
    [enterAsCustomer],
  );

  const logoutCustomer = useCallback(() => {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
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
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
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
      if (!next.password) {
        enterAsCustomer({ ...next, password: next.password || "" });
        return;
      }
      const result = registerCustomer(next);
      if (!result.ok) {
        enterAsCustomer(next);
      }
    },
    [enterAsCustomer, registerCustomer],
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

  const submitOrder = useCallback(() => {
    clearOrderTimers();
    const price = calculateDemoPrice({
      pickupArea: draft.pickup.area,
      deliveryArea: draft.delivery.area,
      mode: draft.mode,
      intermediateStopCount: draft.intermediateStops.length,
    });

    const order: ActiveOrder = {
      id: uid("ord"),
      draft: structuredClone(draft),
      price,
      status: "searching",
      createdAt: new Date().toISOString(),
    };

    setActiveOrder(order);
    setStep("tracking");
    setShowRatingModal(false);
    setShowCancelModal(false);
    setLastRating(null);

    publishCustomerOrderAsOffer({
      order,
      customerName: profile?.fullName || profile?.shopName || "عميل",
      customerPhone: profile?.phone || "0900000000",
    });

    void pushNotify(
      "تم إرسال الطلب",
      "الطلب وصل لواجهة السائق — افتحوا «ابدأ كسائق» واقبلوه",
      "success",
    );
    playTone("normal");

    // Soft fallback only if no driver accepts within ~45s (same-device demo)
    const fallback = window.setTimeout(() => {
      setActiveOrder((current) => {
        if (!current || current.id !== order.id || current.status !== "searching") {
          return current;
        }
        return {
          ...current,
          status: "assigned",
          driver: { ...DEMO_DRIVER },
        };
      });
      void pushNotify(
        "سائق تجريبي",
        "ما في سائق قبل بالوقت — تم تعيين سائق محاكاة",
        "warn",
      );
    }, 45000);
    timersRef.current = [fallback];
  }, [draft, profile, clearOrderTimers]);

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

        if (nextStatus === "delivered") {
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
    (stars: number, notes: string) => {
      if (!activeOrder) return;
      const submission: RatingSubmission = {
        orderId: activeOrder.id,
        stars,
        notes,
        submittedAt: new Date().toISOString(),
      };
      setLastRating(submission);
      setActiveOrder((current) =>
        current ? { ...current, status: "rated" } : current,
      );
      setShowRatingModal(false);
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
    },
    [activeOrder, profile],
  );

  const closeRatingModal = useCallback(() => {
    setShowRatingModal(false);
  }, []);

  const openRatingModal = useCallback(() => {
    if (activeOrder?.status === "delivered" || activeOrder?.status === "rated") {
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
      clearOrderTimers();
      setActiveOrder((current) => {
        if (current) cancelDemoJob(current.id);
        return current
          ? {
              ...current,
              status: "cancelled",
              cancelReason: reason.trim(),
              cancelledAt: new Date().toISOString(),
            }
          : current;
      });
      setShowCancelModal(false);
      setShowRatingModal(false);
    },
    [clearOrderTimers],
  );

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
