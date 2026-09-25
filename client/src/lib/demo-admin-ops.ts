/**
 * Demo admin operations bus — localStorage + events.
 * Bridges customer / driver demo data for the /admin UI.
 * Not production admin APIs (ADR-002/003/012/013 still PROPOSED).
 */

import {
  DEMO_BAD_RATING_MAX_STARS,
  isDemoBadRating,
  splitDemoDeliveryCharge,
} from "./demo-admin-config";
import type { DeliveryMode, OrderStatus } from "./types";

export type DriverApprovalStatus = "pending" | "approved" | "suspended" | "rejected";

export type AdminAlertKind =
  | "driver_join"
  | "bad_rating"
  | "order_created";

export interface AdminAlert {
  id: string;
  kind: AdminAlertKind;
  title: string;
  body: string;
  createdAt: string;
  acknowledged: boolean;
  driverId?: string;
  orderId?: string;
  ratingId?: string;
  /** Shop / customer phone for bad-rating follow-up */
  customerPhone?: string;
  customerName?: string;
  shopName?: string;
}

export interface AdminOrderRecord {
  id: string;
  orderNumber: string;
  status: OrderStatus | "offered" | "heading_pickup" | "at_pickup" | string;
  phase?: string;
  customerName: string;
  customerPhone: string;
  pickupShop: string;
  pickupArea: string;
  deliveryShop: string;
  deliveryArea: string;
  mode: DeliveryMode;
  totalCharge: number;
  currencyLabel: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AdminLedgerEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  driverId: string;
  driverName: string;
  totalCharge: number;
  driverEarning: number;
  platformShare: number;
  mode: DeliveryMode;
  completedAt: string;
  pickupShop: string;
  deliveryShop: string;
}

export interface AdminRatingRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  stars: number;
  notes: string;
  submittedAt: string;
  driverId?: string;
  driverName?: string;
  customerName?: string;
  /** Contact phone for the rating shop/customer */
  customerPhone?: string;
  pickupShop?: string;
  deliveryShop?: string;
  isBad: boolean;
}

export interface DriverPresence {
  driverId: string;
  displayName: string;
  phone: string;
  lat: number;
  lng: number;
  availability: "offline" | "available" | "busy";
  approvalStatus: DriverApprovalStatus;
  updatedAt: string;
  activeOrderNumber?: string;
}

export interface AdminOpsSnapshot {
  alerts: AdminAlert[];
  orders: AdminOrderRecord[];
  ledger: AdminLedgerEntry[];
  ratings: AdminRatingRecord[];
  presence: DriverPresence[];
  /** driverId → approval override (also mirrored on DriverAccount) */
  approvals: Record<string, DriverApprovalStatus>;
}

const KEY = "sareee-demo-admin-ops-v1";
const EVENT = "sareee-demo-admin-ops";

const memoryStore = new Map<string, string>();

function lsGet(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage.getItem(key);
  } catch {
    /* ignore */
  }
  return memoryStore.get(key) ?? null;
}

function lsSet(key: string, value: string) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }
  } catch {
    /* ignore */
  }
  memoryStore.set(key, value);
}

function emptySnapshot(): AdminOpsSnapshot {
  return {
    alerts: [],
    orders: [],
    ledger: [],
    ratings: [],
    presence: [],
    approvals: {},
  };
}

function readSnapshot(): AdminOpsSnapshot {
  try {
    const raw = lsGet(KEY);
    if (!raw) return emptySnapshot();
    const parsed = JSON.parse(raw) as Partial<AdminOpsSnapshot>;
    return {
      ...emptySnapshot(),
      ...parsed,
      alerts: parsed.alerts ?? [],
      orders: parsed.orders ?? [],
      ledger: parsed.ledger ?? [],
      ratings: parsed.ratings ?? [],
      presence: parsed.presence ?? [],
      approvals: parsed.approvals ?? {},
    };
  } catch {
    return emptySnapshot();
  }
}

function writeSnapshot(next: AdminOpsSnapshot) {
  lsSet(KEY, JSON.stringify(next));
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
    try {
      const bc = new BroadcastChannel("sareee-demo-admin-ops");
      bc.postMessage({ type: "ops", at: Date.now() });
      bc.close();
    } catch {
      /* ignore */
    }
  }
}

function mutate(fn: (s: AdminOpsSnapshot) => void): AdminOpsSnapshot {
  const s = readSnapshot();
  fn(s);
  writeSnapshot(s);
  return s;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getAdminOpsSnapshot(): AdminOpsSnapshot {
  return readSnapshot();
}

export function subscribeAdminOps(listener: (s: AdminOpsSnapshot) => void): () => void {
  const onCustom = () => listener(readSnapshot());
  const onStorage = (e: StorageEvent) => {
    if (
      e.key === KEY ||
      e.key === "sareee-driver-accounts-v1" ||
      e.key === null
    ) {
      listener(readSnapshot());
    }
  };
  let bc: BroadcastChannel | null = null;
  const onBc = () => listener(readSnapshot());
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  try {
    bc = new BroadcastChannel("sareee-demo-admin-ops");
    bc.addEventListener("message", onBc);
  } catch {
    bc = null;
  }
  return () => {
    window.removeEventListener(EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
    if (bc) {
      bc.removeEventListener("message", onBc);
      bc.close();
    }
  };
}

export function getDriverApproval(driverId: string): DriverApprovalStatus | null {
  const s = readSnapshot();
  return s.approvals[driverId] ?? null;
}

function readDriverAccountsRaw(): Array<{
  id: string;
  displayName: string;
  phone: string;
  approvalStatus?: DriverApprovalStatus;
  createdAt?: string;
  vehicle?: {
    plateNumber?: string;
    motorcycleModel?: string;
    basketSize?: string;
    capacityNote?: string;
    basketInfo?: string;
  };
  [key: string]: unknown;
}> {
  try {
    const raw =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("sareee-driver-accounts-v1")
        : memoryStore.get("sareee-driver-accounts-v1") ?? null;
    if (!raw) return [];
    return JSON.parse(raw) as Array<{
      id: string;
      displayName: string;
      phone: string;
      approvalStatus?: DriverApprovalStatus;
      createdAt?: string;
      vehicle?: { plateNumber?: string; motorcycleModel?: string };
    }>;
  } catch {
    return [];
  }
}

function writeDriverAccountsRaw(accounts: unknown[]) {
  const json = JSON.stringify(accounts);
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sareee-driver-accounts-v1", json);
    }
  } catch {
    /* ignore */
  }
  memoryStore.set("sareee-driver-accounts-v1", json);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
    try {
      const bc = new BroadcastChannel("sareee-demo-admin-ops");
      bc.postMessage({ type: "accounts", at: Date.now() });
      bc.close();
    } catch {
      /* ignore */
    }
  }
}

function resolveDriverId(
  driverId: string,
  meta?: { displayName?: string; phone?: string },
): { realId: string; displayName?: string; phone?: string } {
  const accounts = readDriverAccountsRaw();
  const byId = accounts.find((a) => a.id === driverId);
  if (byId) {
    return {
      realId: byId.id,
      displayName: byId.displayName,
      phone: byId.phone,
    };
  }
  if (meta?.displayName?.trim()) {
    const byName = accounts.find(
      (a) => a.displayName.trim() === meta.displayName!.trim(),
    );
    if (byName) {
      return {
        realId: byName.id,
        displayName: byName.displayName,
        phone: byName.phone,
      };
    }
  }
  if (meta?.phone?.trim()) {
    const byPhone = accounts.find((a) => a.phone.trim() === meta.phone!.trim());
    if (byPhone) {
      return {
        realId: byPhone.id,
        displayName: byPhone.displayName,
        phone: byPhone.phone,
      };
    }
  }
  return {
    realId: driverId,
    displayName: meta?.displayName,
    phone: meta?.phone,
  };
}

export function setDriverApproval(
  driverId: string,
  status: DriverApprovalStatus,
  meta?: { displayName?: string; phone?: string },
): { ok: true; driverId: string } | { ok: false; error: string } {
  if (!driverId || !String(driverId).trim()) {
    return { ok: false, error: "معرّف السائق ناقص" };
  }

  const resolved = resolveDriverId(driverId, meta);
  const realId = resolved.realId;
  const displayName = resolved.displayName ?? meta?.displayName;

  mutate((s) => {
    s.approvals[realId] = status;
    if (driverId !== realId) {
      s.approvals[driverId] = status;
    }
    s.presence = s.presence.map((p) =>
      p.driverId === realId || p.driverId === driverId
        ? { ...p, approvalStatus: status }
        : p,
    );
    if (status === "approved" || status === "rejected" || status === "suspended") {
      s.alerts = s.alerts.map((a) => {
        if (a.kind !== "driver_join") return a;
        const sameId = a.driverId === realId || a.driverId === driverId;
        const sameName =
          !!displayName && a.body.startsWith(`${displayName} ·`);
        if (sameId || sameName) return { ...a, acknowledged: true };
        return a;
      });
    }
  });

  const accounts = readDriverAccountsRaw();
  const next = accounts.map((a) =>
    a.id === realId || a.id === driverId || (displayName && a.displayName === displayName)
      ? { ...a, approvalStatus: status }
      : a,
  );
  writeDriverAccountsRaw(next);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
    try {
      const bc = new BroadcastChannel("sareee-demo-admin-ops");
      bc.postMessage({
        type: "approval",
        driverId: realId,
        status,
        at: Date.now(),
      });
      bc.close();
    } catch {
      /* ignore */
    }
  }

  const verify = getDriverApproval(realId);
  if (verify !== status) {
    return { ok: false, error: "ما انحفظت الموافقة — حاولوا مرة تانية" };
  }
  return { ok: true, driverId: realId };
}

export function registerDriverJoinRequest(input: {
  driverId: string;
  displayName: string;
  phone: string;
  motorcycleModel?: string;
  plateNumber?: string;
  basketSize?: string;
  capacityNote?: string;
}): void {
  const vehicleBits = [
    input.motorcycleModel,
    input.plateNumber,
    input.basketSize === "large"
      ? "سلة كبيرة"
      : input.basketSize === "small"
        ? "سلة صغيرة"
        : undefined,
    input.capacityNote,
  ]
    .filter(Boolean)
    .join(" · ");
  mutate((s) => {
    s.approvals[input.driverId] = "pending";
    // Drop older unacked join alerts for same driver to avoid duplicates
    s.alerts = s.alerts.filter(
      (a) => !(a.kind === "driver_join" && a.driverId === input.driverId && !a.acknowledged),
    );
    s.alerts.unshift({
      id: uid("alert"),
      kind: "driver_join",
      title: "طلب انضمام إلى الفريق",
      body: `${input.displayName} · ${input.phone}${
        vehicleBits ? ` · ${vehicleBits}` : ""
      } — بانتظار الموافقة قبل بدء العمل`,
      createdAt: new Date().toISOString(),
      acknowledged: false,
      driverId: input.driverId,
    });
  });
}

/** Pending drivers for admin UI — merges accounts, approvals, and join alerts. */
export function listPendingDriverJoins(): Array<{
  driverId: string;
  displayName: string;
  phone: string;
  plateNumber?: string;
  motorcycleModel?: string;
  basketSize?: string;
  capacityNote?: string;
  createdAt?: string;
}> {
  const s = readSnapshot();
  const accounts = readDriverAccountsRaw();

  const byId = new Map<
    string,
    {
      driverId: string;
      displayName: string;
      phone: string;
      plateNumber?: string;
      motorcycleModel?: string;
      basketSize?: string;
      capacityNote?: string;
      createdAt?: string;
    }
  >();

  for (const a of accounts) {
    // Ops map is authoritative when present
    const st = s.approvals[a.id] ?? a.approvalStatus ?? "approved";
    if (st === "pending") {
      byId.set(a.id, {
        driverId: a.id,
        displayName: a.displayName,
        phone: a.phone,
        plateNumber: a.vehicle?.plateNumber,
        motorcycleModel: a.vehicle?.motorcycleModel,
        basketSize: a.vehicle?.basketSize,
        capacityNote: a.vehicle?.capacityNote,
        createdAt: a.createdAt,
      });
    }
  }

  for (const [id, st] of Object.entries(s.approvals)) {
    if (st !== "pending" || byId.has(id)) continue;
    const alert = s.alerts.find((x) => x.kind === "driver_join" && x.driverId === id);
    const acct = accounts.find((a) => a.id === id);
    byId.set(id, {
      driverId: id,
      displayName: acct?.displayName ?? alert?.body?.split(" · ")[0] ?? id,
      phone: acct?.phone ?? "",
      plateNumber: acct?.vehicle?.plateNumber,
      motorcycleModel: acct?.vehicle?.motorcycleModel,
      basketSize: acct?.vehicle?.basketSize,
      capacityNote: acct?.vehicle?.capacityNote,
      createdAt: acct?.createdAt ?? alert?.createdAt,
    });
  }

  for (const alert of s.alerts) {
    if (alert.kind !== "driver_join" || alert.acknowledged || !alert.driverId) continue;
    if (byId.has(alert.driverId)) continue;
    const st = s.approvals[alert.driverId];
    if (st && st !== "pending") continue;
    const acct = accounts.find((a) => a.id === alert.driverId);
    byId.set(alert.driverId, {
      driverId: alert.driverId,
      displayName: acct?.displayName ?? alert.body.split(" · ")[0] ?? "سائق",
      phone: acct?.phone ?? "",
      plateNumber: acct?.vehicle?.plateNumber,
      motorcycleModel: acct?.vehicle?.motorcycleModel,
      basketSize: acct?.vehicle?.basketSize,
      capacityNote: acct?.vehicle?.capacityNote,
      createdAt: acct?.createdAt ?? alert.createdAt,
    });
  }

  return Array.from(byId.values());
}

export function publishDriverPresence(input: {
  driverId: string;
  displayName: string;
  phone: string;
  lat: number;
  lng: number;
  availability: "offline" | "available" | "busy";
  approvalStatus: DriverApprovalStatus;
  activeOrderNumber?: string;
}): void {
  mutate((s) => {
    const approval = s.approvals[input.driverId] ?? input.approvalStatus;
    const row: DriverPresence = {
      ...input,
      approvalStatus: approval,
      updatedAt: new Date().toISOString(),
    };
    const idx = s.presence.findIndex((p) => p.driverId === input.driverId);
    if (idx >= 0) s.presence[idx] = row;
    else s.presence.push(row);
  });
}

export function upsertAdminOrder(record: AdminOrderRecord): void {
  mutate((s) => {
    const idx = s.orders.findIndex((o) => o.id === record.id);
    if (idx >= 0) s.orders[idx] = { ...s.orders[idx]!, ...record };
    else s.orders.unshift(record);
  });
}

export function notifyAdminNewOrder(input: {
  orderId: string;
  orderNumber: string;
  customerName: string;
}): void {
  mutate((s) => {
    s.alerts.unshift({
      id: uid("alert"),
      kind: "order_created",
      title: "طلب جديد",
      body: `رقم الطلب ${input.orderNumber} من ${input.customerName}`,
      createdAt: new Date().toISOString(),
      acknowledged: false,
      orderId: input.orderId,
    });
  });
}

export function recordDeliveryLedger(input: {
  orderId: string;
  orderNumber: string;
  driverId: string;
  driverName: string;
  totalCharge: number;
  mode: DeliveryMode;
  pickupShop: string;
  deliveryShop: string;
  completedAt?: string;
}): AdminLedgerEntry {
  const { driverEarning, platformShare } = splitDemoDeliveryCharge(
    input.totalCharge,
    input.driverId,
  );
  const entry: AdminLedgerEntry = {
    id: uid("led"),
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    driverId: input.driverId,
    driverName: input.driverName,
    totalCharge: input.totalCharge,
    driverEarning,
    platformShare,
    mode: input.mode,
    completedAt: input.completedAt ?? new Date().toISOString(),
    pickupShop: input.pickupShop,
    deliveryShop: input.deliveryShop,
  };
  mutate((s) => {
    if (!s.ledger.some((e) => e.orderId === input.orderId)) {
      s.ledger.unshift(entry);
    }
    const o = s.orders.find((x) => x.id === input.orderId);
    if (o) {
      o.status = "delivered";
      o.completedAt = entry.completedAt;
      o.driverId = input.driverId;
      o.driverName = input.driverName;
      o.updatedAt = entry.completedAt;
    }
  });
  return entry;
}

export function recordAdminRating(input: {
  orderId: string;
  orderNumber: string;
  stars: number;
  notes: string;
  driverId?: string;
  driverName?: string;
  customerName?: string;
  customerPhone?: string;
  pickupShop?: string;
  deliveryShop?: string;
}): AdminRatingRecord {
  const snap = readSnapshot();
  const order = snap.orders.find((x) => x.id === input.orderId);
  const customerPhone =
    input.customerPhone?.trim() || order?.customerPhone || "";
  const customerName =
    input.customerName?.trim() || order?.customerName || "";
  const pickupShop = input.pickupShop || order?.pickupShop || "";
  const deliveryShop = input.deliveryShop || order?.deliveryShop || "";
  const shopLabel = deliveryShop || pickupShop || customerName || "محل";

  const record: AdminRatingRecord = {
    id: uid("rat"),
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    stars: input.stars,
    notes: input.notes,
    submittedAt: new Date().toISOString(),
    driverId: input.driverId,
    driverName: input.driverName || order?.driverName,
    customerName,
    customerPhone,
    pickupShop,
    deliveryShop,
    isBad: isDemoBadRating(input.stars),
  };
  mutate((s) => {
    s.ratings.unshift(record);
    const o = s.orders.find((x) => x.id === input.orderId);
    if (o) {
      o.status = "rated";
      o.updatedAt = record.submittedAt;
    }
    if (record.isBad) {
      s.alerts.unshift({
        id: uid("alert"),
        kind: "bad_rating",
        title: "تقييم سيء — إنذار",
        body: `${input.stars} نجوم · طلب ${input.orderNumber} · محل ${shopLabel}${
          customerPhone ? ` · هاتف ${customerPhone}` : ""
        }${input.driverName || order?.driverName ? ` · سائق ${input.driverName || order?.driverName}` : ""}${
          input.notes ? ` — «${input.notes}»` : " — بدون رسالة"
        }`,
        createdAt: record.submittedAt,
        acknowledged: false,
        orderId: input.orderId,
        driverId: input.driverId,
        ratingId: record.id,
        customerPhone: customerPhone || undefined,
        customerName: customerName || undefined,
        shopName: shopLabel,
      });
    }
  });
  return record;
}

export function acknowledgeAlert(alertId: string): void {
  mutate((s) => {
    s.alerts = s.alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true } : a,
    );
  });
}

export function acknowledgeAllAlerts(): void {
  mutate((s) => {
    s.alerts = s.alerts.map((a) => ({ ...a, acknowledged: true }));
  });
}

export type FinancePeriod = "day" | "week" | "month" | "year";

export function periodStart(period: FinancePeriod, now = new Date()): Date {
  const d = new Date(now);
  if (period === "day") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "week") {
    const day = d.getDay(); // 0 Sun
    const diff = (day + 6) % 7; // Monday start
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function filterLedgerByPeriod(
  ledger: AdminLedgerEntry[],
  period: FinancePeriod,
  now = new Date(),
): AdminLedgerEntry[] {
  const start = periodStart(period, now).getTime();
  return ledger.filter((e) => new Date(e.completedAt).getTime() >= start);
}

export function summarizeLedger(entries: AdminLedgerEntry[]) {
  return entries.reduce(
    (acc, e) => {
      acc.orderCount += 1;
      acc.totalCharge += e.totalCharge;
      acc.driverEarning += e.driverEarning;
      acc.platformShare += e.platformShare;
      return acc;
    },
    { orderCount: 0, totalCharge: 0, driverEarning: 0, platformShare: 0 },
  );
}

export function endOfDayInventory(
  orders: AdminOrderRecord[],
  now = new Date(),
): AdminOrderRecord[] {
  const start = periodStart("day", now).getTime();
  return orders.filter((o) => new Date(o.createdAt).getTime() >= start);
}

export function searchAdminOrders(
  orders: AdminOrderRecord[],
  query: string,
): AdminOrderRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return orders;
  return orders.filter((o) => {
    const hay = [
      o.orderNumber,
      o.id,
      o.driverName,
      o.driverPhone,
      o.pickupShop,
      o.deliveryShop,
      o.customerName,
      o.customerPhone,
      o.pickupArea,
      o.deliveryArea,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export { DEMO_BAD_RATING_MAX_STARS };
