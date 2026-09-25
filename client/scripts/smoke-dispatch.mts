/**
 * Extra smoke: customer→driver demo dispatch + trip phases.
 * Run: npx tsx scripts/smoke-dispatch.mts
 */
import {
  acceptDemoOffer,
  advanceDemoTrip,
  listOpenDemoOffers,
  phaseToCustomerStatus,
  publishCustomerOrderAsOffer,
  tripPhaseLabel,
} from "../src/lib/demo-dispatch-bus";
import type { ActiveOrder } from "../src/lib/types";

// localStorage polyfill for Node
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => void mem.set(k, String(v)),
  removeItem: (k) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
} as Storage;

let failed = 0;
function ok(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failed += 1;
    console.log(`FAIL  ${name} ${detail}`);
  }
}

const order = {
  id: "ord-test123",
  draft: {
    pickup: { id: "p", shopName: "محل طعمة", area: "حوش بلاس" },
    delivery: { id: "d", shopName: "محل سبانو", area: "المزة" },
    intermediateStops: [],
    mode: "vip" as const,
    specialNotes: "",
    packageType: "بطارية",
    packageSize: "medium" as const,
  },
  price: {
    currencyLabel: "ل.س",
    baseAmount: 20000,
    modeSurcharge: 5000,
    stopsSurcharge: 0,
    total: 25000,
    isDemo: true as const,
    disclaimer: "demo",
  },
  status: "searching" as const,
  createdAt: new Date().toISOString(),
} satisfies ActiveOrder;

const job = publishCustomerOrderAsOffer({
  order,
  customerName: "أبو محمد",
  customerPhone: "0944123456",
});

ok("published offered", job.phase === "offered");
ok("open offers has job", listOpenDemoOffers().some((j) => j.orderId === order.id));
ok("offer linked", job.offer.linkedOrderId === order.id);
ok("searching status", phaseToCustomerStatus("offered") === "searching");

const accepted = acceptDemoOffer({
  orderId: order.id,
  driverId: "drv-test",
  driverName: "أحمد",
  driverPhone: "0999",
  driverPlate: "د 1",
});
ok("accepted heading_pickup", accepted?.phase === "heading_pickup");
ok("assigned status", phaseToCustomerStatus("heading_pickup") === "assigned");
ok("driver id stored", accepted?.driverId === "drv-test");
ok(
  "earnings 75%",
  job.offer.earningsAmount === Math.round(25000 * 0.75),
  String(job.offer.earningsAmount),
);

const atPickup = advanceDemoTrip(order.id);
ok("at_pickup", atPickup?.phase === "at_pickup");
ok("still assigned at pickup", phaseToCustomerStatus("at_pickup") === "assigned");

const transit = advanceDemoTrip(order.id);
ok("in_transit", transit?.phase === "in_transit");
ok("in_transit status", phaseToCustomerStatus("in_transit") === "in_transit");

const done = advanceDemoTrip(order.id);
ok("delivered", done?.phase === "delivered");
ok("delivered status", phaseToCustomerStatus("delivered") === "delivered");
ok("labels arabic", tripPhaseLabel("in_transit").length > 3);

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nDispatch smoke passed.");
