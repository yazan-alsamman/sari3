import type { BasketSize, PackageWeightClass } from "./demo-capacity";

export type DriverAvailability = "offline" | "available";

export interface DriverVehicle {
  motorcycleModel: string;
  /** Free-text note (legacy) — prefer basketSize */
  basketInfo: string;
  /** Required on new registrations */
  basketSize: BasketSize;
  /** Capacity the driver can carry (required text / kg note) */
  capacityNote: string;
  plateNumber: string;
}

export type DriverApprovalStatus =
  | "pending"
  | "approved"
  | "suspended"
  | "rejected";

export interface DriverAccount {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  /** Demo local data URL — not production media (ADR-015) */
  idPhotoDataUrl?: string;
  phone: string;
  /** Demo only — never store plaintext passwords in production */
  password: string;
  vehicle: DriverVehicle;
  createdAt: string;
  /**
   * New registrations start as pending until admin approves.
   * Legacy accounts without the field are treated as approved on load.
   */
  approvalStatus?: DriverApprovalStatus;
}

export interface DriverSettings {
  /** Demo radius in km — not authoritative dispatch radius */
  radiusKm: number;
}

export interface DriverOfferStop {
  shopName: string;
  area: string;
}

export interface DriverOffer {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  mode: "standard" | "vip";
  pickup: DriverOfferStop;
  delivery: DriverOfferStop;
  stops: DriverOfferStop[];
  /** Demo earnings shown to driver */
  earningsLabel: string;
  earningsAmount: number;
  distanceKm: number;
  /** Offer window in seconds (product request: 15) */
  expiresInSec: number;
  createdAt: string;
  packageType?: string;
  packageSizeLabel?: string;
  packageWeightClass?: PackageWeightClass;
  pickupPhotoDataUrl?: string;
  deliveryPhotoDataUrl?: string;
  /** When set, this offer came from the customer demo bus */
  linkedOrderId?: string;
}

export interface DriverCompletedTrip {
  id: string;
  orderNumber: string;
  customerName: string;
  pickupArea: string;
  deliveryArea: string;
  mode: "standard" | "vip";
  earningsAmount: number;
  acceptedAt: string;
  completedAt: string;
}

export const DEFAULT_DRIVER_SETTINGS: DriverSettings = {
  radiusKm: 3,
};

export const DEMO_RADIUS_NOTE =
  "قطر الطلبات إعداد تجريبي للواجهة — قواعد الإرسال الحقيقية TBD (ADR-007)";
