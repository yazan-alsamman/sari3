/**
 * Smoke test: demo dispatch bus — finish must not re-open same offer.
 * Run: npx tsx scripts/smoke-dispatch.ts
 */
import assert from "node:assert/strict";
import {
  acceptDemoOffer,
  closeDemoJob,
  listOpenDemoOffers,
  publishCustomerOrderAsOffer,
  getDemoJob,
} from "../src/lib/demo-dispatch-bus";
import type { ActiveOrder } from "../src/lib/types";

function fakeOrder(id: string): ActiveOrder {
  return {
    id,
    createdAt: new Date().toISOString(),
    status: "searching",
    draft: {
      pickup: { id: "p1", shopName: "محل طعمة", area: "حوش بلاس" },
      delivery: { id: "d1", shopName: "محل سبانو", area: "المزة" },
      intermediateStops: [],
      mode: "standard",
      specialNotes: "",
      packageType: "",
      packageSize: "",
    },
    price: {
      currencyLabel: "ل.س.ج",
      baseAmount: 17500,
      modeSurcharge: 0,
      stopsSurcharge: 0,
      total: 17500,
      isDemo: true,
      disclaimer: "test",
    },
  };
}

function main() {
  const order = fakeOrder("ord-smoke-1");
  publishCustomerOrderAsOffer({
    order,
    customerName: "محمد تجريبي",
    customerPhone: "0911111111",
  });
  assert.equal(listOpenDemoOffers().length, 1, "should have 1 open offer");

  const accepted = acceptDemoOffer({
    orderId: order.id,
    driverId: "drv-1",
    driverName: "سائق",
    driverPhone: "0922222222",
    driverPlate: "د 1",
  });
  assert.ok(accepted);
  assert.equal(accepted!.phase, "heading_pickup");
  assert.equal(listOpenDemoOffers().length, 0, "accepted must leave open list");

  closeDemoJob(order.id);
  const closed = getDemoJob(order.id);
  assert.equal(closed?.phase, "delivered");
  assert.equal(
    listOpenDemoOffers().length,
    0,
    "delivered must never appear as open offer",
  );

  // Second close is idempotent
  closeDemoJob(order.id);
  assert.equal(listOpenDemoOffers().length, 0);

  // New customer order is the only way to get a new open offer
  const order2 = fakeOrder("ord-smoke-2");
  publishCustomerOrderAsOffer({
    order: order2,
    customerName: "زبون جديد",
    customerPhone: "0933333333",
  });
  assert.equal(listOpenDemoOffers().length, 1);
  assert.equal(listOpenDemoOffers()[0]?.orderId, "ord-smoke-2");
  assert.notEqual(listOpenDemoOffers()[0]?.customerName, "محمد تجريبي");

  console.log("OK — dispatch smoke passed (no re-offer after close)");
}

main();
