export type DeliveryMode = "standard" | "vip";

export type OrderStatus =
  | "draft"
  | "searching"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "rated"
  | "cancelled";

export interface ClientProfile {
  /** Demo account id — set after register */
  id?: string;
  fullName: string;
  phone: string;
  personalInfo: string;
  shopName: string;
  industrialArea: string;
  /**
   * Demo only — plaintext for localStorage prototype (same pattern as driver).
   * Never ship plaintext passwords in production (ADR-002).
   */
  password: string;
  createdAt?: string;
}

export interface StopPoint {
  id: string;
  shopName: string;
  area: string;
  note?: string;
  photoDataUrl?: string;
}

export interface OrderDraft {
  pickup: StopPoint;
  delivery: StopPoint;
  intermediateStops: StopPoint[];
  mode: DeliveryMode;
  specialNotes: string;
  /** Optional part category — product requirement */
  packageType: string;
  /** light | heavy — basket matching (demo ADR-008) */
  packageSize: "" | "light" | "heavy" | "small" | "medium" | "large";
}

export interface DemoPriceBreakdown {
  currencyLabel: string;
  baseAmount: number;
  modeSurcharge: number;
  stopsSurcharge: number;
  total: number;
  isDemo: boolean;
  disclaimer: string;
}

export interface DriverInfo {
  name: string;
  phone: string;
  plate: string;
  etaMinutes: number;
}

export interface ActiveOrder {
  id: string;
  /** Server order id when the order was created via POST /orders. */
  serverOrderId?: string;
  orderNumber?: string;
  draft: OrderDraft;
  price: DemoPriceBreakdown;
  status: OrderStatus;
  driver?: DriverInfo;
  /** Latest assigned-driver point from the tracking event. Absent before assignment. */
  driverPoint?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    capturedAt: string;
    freshness: string;
  };
  /** Server order has reached COMPLETED (ADR-012). */
  ratingEligible?: boolean;
  createdAt: string;
  cancelReason?: string;
  cancelledAt?: string;
}

export interface RatingSubmission {
  orderId: string;
  stars: number;
  notes: string;
  submittedAt: string;
}

export const CANCEL_REASONS = [
  "طلبت بالخطأ",
  "تأخر السائق كثيراً",
  "تغيّر مكان الاستلام أو التسليم",
  "وجدت قطعة من مصدر آخر",
  "السعر غير مناسب",
  "سبب آخر",
] as const;
