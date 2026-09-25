/**
 * Demo-only bridge: customer order ↔ driver offer/trip.
 * Not real dispatch (ADR-007 still PROPOSED). Uses localStorage + events
 * so both role UIs stay in sync on the same device.
 */

import type { ActiveOrder, OrderStatus } from "./types";
import type { DriverOffer } from "./driver-types";
import { PACKAGE_SIZES } from "./notify";
import { splitDemoDeliveryCharge } from "./demo-admin-config";
import {
  notifyAdminNewOrder,
  upsertAdminOrder,
} from "./demo-admin-ops";

export type DemoTripPhase =
  | "offered"
  | "heading_pickup"
  | "at_pickup"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface DemoDispatchJob {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  offer: DriverOffer;
  phase: DemoTripPhase;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  totalCharge?: number;
  updatedAt: string;
}

const KEY = "sareee-demo-dispatch-v1";
const EVENT = "sareee-demo-dispatch";

/** Browser localStorage, with in-memory fallback for Node smoke tests. */
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

function readAll(): DemoDispatchJob[] {
  try {
    const raw = lsGet(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DemoDispatchJob[];
  } catch {
    return [];
  }
}

function writeAll(jobs: DemoDispatchJob[]) {
  lsSet(KEY, JSON.stringify(jobs));
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: jobs }));
  }
}

export function subscribeDemoDispatch(
  listener: (jobs: DemoDispatchJob[]) => void,
): () => void {
  const onCustom = () => listener(readAll());
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener(readAll());
  };
  window.addEventListener(EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function listDemoDispatchJobs(): DemoDispatchJob[] {
  return readAll();
}

export function getDemoJob(orderId: string): DemoDispatchJob | undefined {
  return readAll().find((j) => j.orderId === orderId);
}

export function listOpenDemoOffers(): DemoDispatchJob[] {
  return readAll().filter((j) => j.phase === "offered");
}

/** Force-close a job so it never reappears as an open offer. */
export function closeDemoJob(orderId: string): DemoDispatchJob | null {
  const jobs = readAll();
  const idx = jobs.findIndex((j) => j.orderId === orderId);
  if (idx < 0) return null;
  const cur = jobs[idx]!;
  if (cur.phase === "delivered" || cur.phase === "cancelled") return cur;

  const next: DemoDispatchJob = {
    ...cur,
    phase: "delivered",
    updatedAt: new Date().toISOString(),
  };
  jobs[idx] = next;
  writeAll(jobs);
  upsertAdminOrder({
    id: next.orderId,
    orderNumber: next.orderNumber,
    status: "delivered",
    phase: "delivered",
    customerName: next.customerName,
    customerPhone: next.customerPhone,
    pickupShop: next.offer.pickup.shopName,
    pickupArea: next.offer.pickup.area,
    deliveryShop: next.offer.delivery.shopName,
    deliveryArea: next.offer.delivery.area,
    mode: next.offer.mode,
    totalCharge: next.totalCharge ?? next.offer.earningsAmount,
    currencyLabel: next.offer.earningsLabel,
    driverId: next.driverId,
    driverName: next.driverName,
    driverPhone: next.driverPhone,
    createdAt: next.offer.createdAt,
    updatedAt: next.updatedAt,
    completedAt: next.updatedAt,
  });
  return next;
}

export function publishCustomerOrderAsOffer(input: {
  order: ActiveOrder;
  customerName: string;
  customerPhone: string;
}): DemoDispatchJob {
  const { order, customerName, customerPhone } = input;
  const d = order.draft;
  const sizeLabel =
    PACKAGE_SIZES.find((s) => s.id === d.packageSize)?.label ??
    (d.packageSize === "heavy"
      ? "أوزان ثقيلة"
      : d.packageSize === "light"
        ? "أوزان خفيفة"
        : undefined);
  const weightClass =
    d.packageSize === "heavy" || d.packageSize === "large"
      ? ("heavy" as const)
      : ("light" as const);

  const { driverEarning } = splitDemoDeliveryCharge(order.price.total);
  const offer: DriverOffer = {
    id: `offer-${order.id}`,
    orderNumber: order.id.replace("ord-", "S-").slice(0, 12).toUpperCase(),
    customerName,
    customerPhone,
    mode: d.mode,
    pickup: { shopName: d.pickup.shopName, area: d.pickup.area },
    delivery: { shopName: d.delivery.shopName, area: d.delivery.area },
    stops: d.intermediateStops.map((s) => ({
      shopName: s.shopName,
      area: s.area,
    })),
    earningsLabel: order.price.currencyLabel,
    earningsAmount: Math.max(5000, driverEarning),
    distanceKm: 2.5,
    expiresInSec: 15,
    createdAt: new Date().toISOString(),
    packageType: d.packageType || undefined,
    packageSizeLabel: sizeLabel,
    packageWeightClass: weightClass,
    pickupPhotoDataUrl: d.pickup.photoDataUrl,
    deliveryPhotoDataUrl: d.delivery.photoDataUrl,
    linkedOrderId: order.id,
  };

  const job: DemoDispatchJob = {
    orderId: order.id,
    orderNumber: offer.orderNumber,
    customerName,
    customerPhone,
    offer,
    phase: "offered",
    totalCharge: order.price.total,
    updatedAt: new Date().toISOString(),
  };

  const rest = readAll().filter((j) => j.orderId !== order.id);
  writeAll([job, ...rest]);

  upsertAdminOrder({
    id: order.id,
    orderNumber: offer.orderNumber,
    status: "searching",
    phase: "offered",
    customerName,
    customerPhone,
    pickupShop: d.pickup.shopName,
    pickupArea: d.pickup.area,
    deliveryShop: d.delivery.shopName,
    deliveryArea: d.delivery.area,
    mode: d.mode,
    totalCharge: order.price.total,
    currencyLabel: order.price.currencyLabel,
    createdAt: order.createdAt,
    updatedAt: job.updatedAt,
  });
  notifyAdminNewOrder({
    orderId: order.id,
    orderNumber: offer.orderNumber,
    customerName,
  });

  return job;
}

export function acceptDemoOffer(input: {
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverPlate: string;
}): DemoDispatchJob | null {
  const jobs = readAll();
  const idx = jobs.findIndex((j) => j.orderId === input.orderId && j.phase === "offered");
  if (idx < 0) return null;
  const cur = jobs[idx]!;
  const next: DemoDispatchJob = {
    ...cur,
    phase: "heading_pickup",
    driverId: input.driverId,
    driverName: input.driverName,
    driverPhone: input.driverPhone,
    driverPlate: input.driverPlate,
    updatedAt: new Date().toISOString(),
  };
  jobs[idx] = next;
  writeAll(jobs);
  upsertAdminOrder({
    id: cur.orderId,
    orderNumber: cur.orderNumber,
    status: "assigned",
    phase: "heading_pickup",
    customerName: cur.customerName,
    customerPhone: cur.customerPhone,
    pickupShop: cur.offer.pickup.shopName,
    pickupArea: cur.offer.pickup.area,
    deliveryShop: cur.offer.delivery.shopName,
    deliveryArea: cur.offer.delivery.area,
    mode: cur.offer.mode,
    totalCharge: cur.totalCharge ?? cur.offer.earningsAmount,
    currencyLabel: cur.offer.earningsLabel,
    driverId: input.driverId,
    driverName: input.driverName,
    driverPhone: input.driverPhone,
    createdAt: cur.offer.createdAt,
    updatedAt: next.updatedAt,
  });
  return next;
}

export function advanceDemoTrip(orderId: string): DemoDispatchJob | null {
  const jobs = readAll();
  const idx = jobs.findIndex((j) => j.orderId === orderId);
  if (idx < 0) return null;
  const cur = jobs[idx]!;
  const chain: DemoTripPhase[] = [
    "heading_pickup",
    "at_pickup",
    "in_transit",
    "delivered",
  ];
  const i = chain.indexOf(cur.phase as (typeof chain)[number]);
  if (i < 0 || i >= chain.length - 1) return cur;
  return setDemoTripPhase(orderId, chain[i + 1]!);
}

/** Set trip phase explicitly (for GPS auto-progress). Will not skip backwards. */
export function setDemoTripPhase(
  orderId: string,
  phase: DemoTripPhase,
): DemoDispatchJob | null {
  const jobs = readAll();
  const idx = jobs.findIndex((j) => j.orderId === orderId);
  if (idx < 0) return null;
  const cur = jobs[idx]!;
  const chain: DemoTripPhase[] = [
    "heading_pickup",
    "at_pickup",
    "in_transit",
    "delivered",
  ];
  const curI = chain.indexOf(cur.phase as (typeof chain)[number]);
  const nextI = chain.indexOf(phase as (typeof chain)[number]);
  if (nextI < 0) return cur;
  if (curI >= 0 && nextI < curI) return cur;
  if (cur.phase === phase) return cur;

  const next: DemoDispatchJob = {
    ...cur,
    phase,
    updatedAt: new Date().toISOString(),
  };
  jobs[idx] = next;
  writeAll(jobs);
  upsertAdminOrder({
    id: next.orderId,
    orderNumber: next.orderNumber,
    status: phaseToCustomerStatus(next.phase) ?? next.phase,
    phase: next.phase,
    customerName: next.customerName,
    customerPhone: next.customerPhone,
    pickupShop: next.offer.pickup.shopName,
    pickupArea: next.offer.pickup.area,
    deliveryShop: next.offer.delivery.shopName,
    deliveryArea: next.offer.delivery.area,
    mode: next.offer.mode,
    totalCharge: next.totalCharge ?? next.offer.earningsAmount,
    currencyLabel: next.offer.earningsLabel,
    driverId: next.driverId,
    driverName: next.driverName,
    driverPhone: next.driverPhone,
    createdAt: next.offer.createdAt,
    updatedAt: next.updatedAt,
    completedAt: next.phase === "delivered" ? next.updatedAt : undefined,
  });
  return next;
}

export function cancelDemoJob(orderId: string) {
  const jobs = readAll().map((j) =>
    j.orderId === orderId
      ? { ...j, phase: "cancelled" as const, updatedAt: new Date().toISOString() }
      : j,
  );
  writeAll(jobs);
  const hit = jobs.find((j) => j.orderId === orderId);
  if (hit) {
    upsertAdminOrder({
      id: hit.orderId,
      orderNumber: hit.orderNumber,
      status: "cancelled",
      phase: "cancelled",
      customerName: hit.customerName,
      customerPhone: hit.customerPhone,
      pickupShop: hit.offer.pickup.shopName,
      pickupArea: hit.offer.pickup.area,
      deliveryShop: hit.offer.delivery.shopName,
      deliveryArea: hit.offer.delivery.area,
      mode: hit.offer.mode,
      totalCharge: hit.totalCharge ?? hit.offer.earningsAmount,
      currencyLabel: hit.offer.earningsLabel,
      driverId: hit.driverId,
      driverName: hit.driverName,
      driverPhone: hit.driverPhone,
      createdAt: hit.offer.createdAt,
      updatedAt: hit.updatedAt,
    });
  }
}

export function removeDemoOffer(orderId: string) {
  writeAll(readAll().filter((j) => j.orderId !== orderId || j.phase !== "offered"));
}

export function phaseToCustomerStatus(phase: DemoTripPhase): OrderStatus | null {
  switch (phase) {
    case "offered":
      return "searching";
    case "heading_pickup":
    case "at_pickup":
      return "assigned";
    case "in_transit":
      return "in_transit";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    default:
      return null;
  }
}

export function tripPhaseLabel(phase: DemoTripPhase): string {
  switch (phase) {
    case "offered":
      return "بانتظار قبول سائق";
    case "heading_pickup":
      return "بالطريق لنقطة الاستلام";
    case "at_pickup":
      return "وصل لنقطة الاستلام";
    case "in_transit":
      return "استلم — بالطريق للتسليم";
    case "delivered":
      return "تم التسليم";
    case "cancelled":
      return "ملغى";
    default:
      return phase;
  }
}
