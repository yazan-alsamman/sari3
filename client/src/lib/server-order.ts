import type { ServerOrder } from "./backend-api";
import type { ActiveOrder, OrderStatus } from "./types";

const OPEN_SERVER_STATUSES = new Set([
  "SEARCHING_DRIVER",
  "DRIVER_OFFERED",
  "DRIVER_ACCEPTED",
  "DRIVER_TO_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "DELIVERED",
]);

export function isOpenServerOrder(status: string): boolean {
  return OPEN_SERVER_STATUSES.has(status);
}

export function mapServerOrderStatus(status: string): OrderStatus | null {
  switch (status) {
    case "SEARCHING_DRIVER":
    case "DRIVER_OFFERED":
      return "searching";
    case "DRIVER_ACCEPTED":
    case "DRIVER_TO_PICKUP":
      return "assigned";
    case "PICKED_UP":
    case "IN_TRANSIT":
      return "in_transit";
    case "DELIVERED":
    case "COMPLETED":
      return "delivered";
    case "CANCELLED":
    case "EXPIRED":
    case "FAILED":
    case "UNFULFILLED":
      return "cancelled";
    default:
      return null;
  }
}

export function priceFromServer(row: ServerOrder): ActiveOrder["price"] {
  return {
    currencyLabel: row.price.currencyLabel,
    baseAmount: row.price.baseAmount,
    modeSurcharge: row.price.modeSurcharge,
    stopsSurcharge: row.price.stopsSurcharge + row.price.heavySurcharge,
    total: row.price.totalAmount,
    isDemo: false,
    disclaimer: "حسب تسعير المناطق الحالي",
  };
}
