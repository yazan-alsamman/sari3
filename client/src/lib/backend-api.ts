"use client";

import { getApiBaseUrl } from "./api-base";

const TOKEN_KEY = "sareee-api-session-v1";
export const API_SESSION_EVENT = "sareee-api-session";

function notifyApiSession() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(API_SESSION_EVENT));
}

export type ApiRole = "customer" | "driver" | "admin";

export type ApiSession = {
  accessToken: string;
  refreshToken: string;
  role: ApiRole;
  userId: string;
  phone: string;
};

export type ApiUser = {
  id: string;
  phone: string;
  role: ApiRole;
  phoneVerified: boolean;
  driverApprovalStatus?: "pending" | "approved" | "rejected" | "suspended";
};

type AuthResponse = {
  user: ApiUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: "Bearer";
  };
};

export function loadApiSession(): ApiSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApiSession;
  } catch {
    return null;
  }
}

export function saveApiSession(session: ApiSession) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
  notifyApiSession();
}

export function clearApiSession() {
  localStorage.removeItem(TOKEN_KEY);
  notifyApiSession();
}

function apiMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const rec = body as { message?: unknown; code?: string };
  if (typeof rec.message === "string") return rec.message;
  if (Array.isArray(rec.message)) return rec.message.map(String).join(" · ");
  return fallback;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init.auth !== false) {
    const session = loadApiSession();
    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    }
  }
  const res = await fetch(`${getApiBaseUrl()}/api/v1${path}`, {
    ...init,
    headers,
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(apiMessage(body, `HTTP ${res.status}`));
  }
  return body as T;
}

function persistAuth(data: AuthResponse): ApiUser {
  saveApiSession({
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
    role: data.user.role,
    userId: data.user.id,
    phone: data.user.phone,
  });
  return data.user;
}

export async function apiRegister(body: Record<string, unknown>): Promise<ApiUser> {
  const data = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
  return persistAuth(data);
}

export async function apiLogin(phone: string, password: string): Promise<ApiUser> {
  const data = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
    auth: false,
  });
  return persistAuth(data);
}

export async function apiMe(): Promise<ApiUser> {
  return apiRequest<ApiUser>("/auth/me");
}

export async function apiUploadDriverId(file: File): Promise<string> {
  const form = new FormData();
  form.set("purpose", "driver_id");
  form.set("file", file);
  const res = await fetch(`${getApiBaseUrl()}/api/v1/media/upload-public`, {
    method: "POST",
    body: form,
  });
  const body = await parseJson(res);
  if (!res.ok) throw new Error(apiMessage(body, "فشل رفع الهوية"));
  const id = (body as { id?: string }).id;
  if (!id) throw new Error("الرفع ما رجّع معرّف صورة");
  return id;
}

export type ServiceZone = { id: string; code: string; nameAr: string };

export async function apiListZones(): Promise<ServiceZone[]> {
  return apiRequest<ServiceZone[]>("/service-zones", { auth: false });
}

export type PricePreview = {
  currencyLabel: string;
  currencyFull: string;
  baseAmount: number;
  modeSurcharge: number;
  stopsSurcharge: number;
  heavySurcharge: number;
  totalAmount: number;
  pickupZoneName: string;
  deliveryZoneName: string;
};

export async function apiPreviewPrice(input: {
  pickupZoneId: string;
  deliveryZoneId: string;
  mode: "standard" | "vip";
  weightClass: "light" | "heavy";
  intermediateStopCount: number;
}): Promise<PricePreview> {
  return apiRequest<PricePreview>("/pricing/preview", {
    method: "POST",
    body: JSON.stringify(input),
    auth: false,
  });
}

export type PendingDriver = {
  id: string;
  firstName: string;
  lastName: string;
  user: { phone: string };
  vehicleDescription: string;
  basketSize: string;
  idPhoto?: { id: string; confirmedAt: string | null } | null;
};

export async function apiMediaDownloadUrl(
  mediaId: string,
): Promise<{ url: string; expiresIn: number }> {
  return apiRequest<{ url: string; expiresIn: number }>(`/media/${mediaId}/url`);
}

export type ServerDriver = PendingDriver & {
  approvalStatus: string;
  capacityNote?: string | null;
  tripBonusAmount?: number;
};

export async function apiListDrivers(): Promise<ServerDriver[]> {
  return apiRequest<ServerDriver[]>("/admin/drivers");
}

export async function apiSuspendDriver(driverProfileId: string, reason: string): Promise<void> {
  await apiRequest(`/admin/drivers/${driverProfileId}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function apiReactivateDriver(driverProfileId: string, reason: string): Promise<void> {
  await apiRequest(`/admin/drivers/${driverProfileId}/reactivate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function apiUpdateDriverCapacity(
  driverProfileId: string,
  basketSize: "small" | "large",
): Promise<void> {
  await apiRequest(`/admin/drivers/${driverProfileId}/capacity`, {
    method: "PATCH",
    body: JSON.stringify({ basketSize }),
  });
}

export type ServerLiveSnapshot = {
  generatedAt: string;
  drivers: Array<{
    driverProfileId: string;
    userId: string;
    name: string;
    phone: string;
    basketSize: string;
    online: boolean;
    freshness: string;
    point: {
      latitude: number;
      longitude: number;
      accuracyMeters: number;
      capturedAt: string;
    } | null;
  }>;
  orders: Array<{ id: string; orderNumber: string; status: string }>;
  offers: Array<{ id: string; orderId: string }>;
};

export type ServerLedgerEntry = {
  id: string;
  orderId: string | null;
  kind: string;
  amount: number;
  currencyCode: string;
  createdAt: string;
};

export type ServerEarnings = {
  currencyCode: string;
  balance: number;
  todayEarning: number;
};

export async function apiDriverLedger(): Promise<ServerLedgerEntry[]> {
  return apiRequest<ServerLedgerEntry[]>("/drivers/me/ledger");
}

export async function apiDriverEarnings(): Promise<ServerEarnings> {
  return apiRequest<ServerEarnings>("/drivers/me/earnings");
}

export async function apiAdminLive(): Promise<ServerLiveSnapshot> {
  return apiRequest<ServerLiveSnapshot>("/admin/live");
}

export async function apiPendingDrivers(): Promise<PendingDriver[]> {
  return apiRequest<PendingDriver[]>("/admin/drivers/pending");
}

export async function apiApproveDriver(driverProfileId: string): Promise<void> {
  await apiRequest(`/admin/drivers/${driverProfileId}/approve`, {
    method: "POST",
    body: JSON.stringify({ reason: "approved from admin ui" }),
  });
}

export async function apiRejectDriver(driverProfileId: string): Promise<void> {
  await apiRequest(`/admin/drivers/${driverProfileId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: "rejected from admin ui" }),
  });
}

export type ServerOrder = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  mode?: "standard" | "vip";
  weightClass?: "light" | "heavy";
  specialHandlingNotes?: string;
  cancelReason?: string | null;
  pickup?: { shopName: string; zoneName: string; landmark: string };
  delivery?: { shopName: string; zoneName: string; landmark: string };
  price: {
    currencyLabel: string;
    baseAmount: number;
    modeSurcharge: number;
    stopsSurcharge: number;
    heavySurcharge: number;
    totalAmount: number;
  };
};

export type ServerRating = {
  id: string;
  orderId: string;
  customerUserId: string;
  driverUserId: string | null;
  stars: number;
  notes: string | null;
  createdAt: string;
};

export async function apiListAdminRatings(): Promise<ServerRating[]> {
  return apiRequest<ServerRating[]>("/admin/ratings");
}

export async function apiListAdminOrders(): Promise<ServerOrder[]> {
  return apiRequest<ServerOrder[]>("/admin/orders");
}

export async function apiListMyOrders(): Promise<ServerOrder[]> {
  return apiRequest<ServerOrder[]>("/orders");
}

export type ServerTracking = {
  orderId: string;
  freshness: string;
  point: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    capturedAt: string;
  } | null;
};

/** REST authority for the latest assigned-driver point (ADR-010 / ADR-011). */
export async function apiGetOrderTracking(orderId: string): Promise<ServerTracking> {
  return apiRequest<ServerTracking>(`/orders/${orderId}/tracking`);
}

export async function apiSetTripBonus(
  driverProfileId: string,
  amount: number,
): Promise<{ tripBonusAmount: number }> {
  return apiRequest(`/admin/drivers/${driverProfileId}/trip-bonus`, {
    method: "PATCH",
    body: JSON.stringify({ amount }),
  });
}

export async function apiCreateOrder(
  body: {
    pickupZoneId: string;
    deliveryZoneId: string;
    pickupShopName: string;
    deliveryShopName: string;
    pickupLandmark: string;
    deliveryLandmark: string;
    specialHandlingNotes: string;
    mode: "standard" | "vip";
    weightClass: "light" | "heavy";
    intermediateStopCount: number;
  },
  idempotencyKey: string,
): Promise<ServerOrder> {
  return apiRequest<ServerOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export type ServerDispatchOffer = {
  id: string;
  expiresAt: string;
  expiresInSec: number;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    mode: "standard" | "vip";
    weightClass: "light" | "heavy";
    pickup: { shopName: string; area: string };
    delivery: { shopName: string; area: string };
    price: { totalAmount: number; currencyLabel: string };
  };
  earnings?: {
    driverEarning: number;
    platformShare: number;
    bonus: number;
    currencyLabel: string;
  };
};

export async function apiSetDriverAvailability(online: boolean): Promise<{ online: boolean }> {
  return apiRequest("/drivers/me/availability", {
    method: "POST",
    body: JSON.stringify({ online }),
  });
}

export async function apiPostDriverLocation(input: {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
}): Promise<{ stored: boolean; freshness: string }> {
  return apiRequest("/drivers/me/location", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiListDriverOffers(): Promise<ServerDispatchOffer[]> {
  return apiRequest<ServerDispatchOffer[]>("/drivers/me/offers");
}

export async function apiAcceptDispatchOffer(offerId: string, idempotencyKey: string) {
  return apiRequest<{ orderId: string; status: string; offerId: string }>(
    `/dispatch/offers/${offerId}/accept`,
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: "{}",
    },
  );
}

export async function apiDriverTrip(
  orderId: string,
  action: "start-to-pickup" | "pickup" | "in-transit" | "deliver" | "complete",
): Promise<{ status: string }> {
  return apiRequest(`/orders/${orderId}/${action}`, {
    method: "POST",
    body: "{}",
  });
}

export async function apiRejectDispatchOffer(offerId: string, idempotencyKey: string) {
  return apiRequest<{ offerId: string; status: string }>(
    `/dispatch/offers/${offerId}/reject`,
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: "{}",
    },
  );
}

export async function apiSubmitRating(orderId: string, stars: number, notes: string) {
  return apiRequest(`/orders/${orderId}/rating`, {
    method: "POST",
    body: JSON.stringify({ stars, notes: notes || undefined }),
  });
}

export async function apiCreateComplaint(orderId: string, body: string) {
  return apiRequest<{ id: string }>(`/orders/${orderId}/complaints`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function apiCancelOrder(
  orderId: string,
  reason: string,
): Promise<ServerOrder> {
  return apiRequest<ServerOrder>(`/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export type ServerFinanceReport = {
  period: string;
  from: string;
  to: string;
  currencyCode: string;
  orderCount: number;
  totalCharge: number;
  driverEarning: number;
  platformShare: number;
  bonus: number;
  penalty: number;
  adjustment: number;
};

export async function apiFinanceReport(
  period: "daily" | "weekly" | "monthly" | "yearly",
): Promise<ServerFinanceReport> {
  return apiRequest<ServerFinanceReport>(`/admin/finance/reports/${period}`);
}

export async function apiPublishPricing(config: {
  zoneBases: Record<string, number>;
  crossZoneMultiplier: number;
  vipSurchargeRate: number;
  perStop: number;
  heavySurcharge: number;
  routeOverrides: Record<string, number>;
}): Promise<void> {
  await apiRequest("/admin/pricing-rules", {
    method: "POST",
    body: JSON.stringify({ config, notes: "admin ui" }),
  });
}
