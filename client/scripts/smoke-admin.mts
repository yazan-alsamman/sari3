/**
 * Admin demo ops smoke: approval, ledger 80/20, bad rating ≤2, search.
 * Run: npx tsx scripts/smoke-admin.mts
 */
import {
  DEMO_ADMIN_PASSWORD,
  DEMO_ADMIN_USERNAME,
  DEMO_DRIVER_SHARE_RATE,
  DEMO_PLATFORM_SHARE_RATE,
  isDemoBadRating,
  splitDemoDeliveryCharge,
} from "../src/lib/demo-admin-config";
import {
  endOfDayInventory,
  filterLedgerByPeriod,
  listPendingDriverJoins,
  getAdminOpsSnapshot,
  getDriverApproval,
  recordAdminRating,
  recordDeliveryLedger,
  registerDriverJoinRequest,
  searchAdminOrders,
  setDriverApproval,
  summarizeLedger,
  upsertAdminOrder,
} from "../src/lib/demo-admin-ops";

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

ok("admin username set", DEMO_ADMIN_USERNAME === "admin");
ok("admin password set", DEMO_ADMIN_PASSWORD.length >= 8);
ok("share rates", DEMO_DRIVER_SHARE_RATE === 0.75 && DEMO_PLATFORM_SHARE_RATE === 0.25);

const split = splitDemoDeliveryCharge(25000);
ok("driver 75%", split.driverEarning === 18750, String(split.driverEarning));
ok("platform 25%", split.platformShare === 6250, String(split.platformShare));
ok("bad rating 2", isDemoBadRating(2));
ok("not bad rating 3", !isDemoBadRating(3));

registerDriverJoinRequest({
  driverId: "drv-new",
  displayName: "سائق جديد",
  phone: "0944000000",
});
ok("pending join", getDriverApproval("drv-new") === "pending");
ok(
  "join alert",
  getAdminOpsSnapshot().alerts.some(
    (a) => a.kind === "driver_join" && !a.acknowledged,
  ),
);

setDriverApproval("drv-new", "approved");
ok("approved", getDriverApproval("drv-new") === "approved");
ok(
  "pending cleared after approve",
  listPendingDriverJoins().every((j) => j.driverId !== "drv-new"),
);

upsertAdminOrder({
  id: "ord-a1",
  orderNumber: "S-A1",
  status: "delivered",
  customerName: "عميل",
  customerPhone: "1",
  pickupShop: "محل طعمة",
  pickupArea: "حوش بلاس",
  deliveryShop: "محل سبانو",
  deliveryArea: "المزة",
  mode: "standard",
  totalCharge: 25000,
  currencyLabel: "ل.س",
  driverId: "drv-new",
  driverName: "سائق جديد",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
});

recordDeliveryLedger({
  orderId: "ord-a1",
  orderNumber: "S-A1",
  driverId: "drv-new",
  driverName: "سائق جديد",
  totalCharge: 25000,
  mode: "standard",
  pickupShop: "محل طعمة",
  deliveryShop: "محل سبانو",
});

const day = summarizeLedger(filterLedgerByPeriod(getAdminOpsSnapshot().ledger, "day"));
ok("day ledger count", day.orderCount === 1);
ok("day platform", day.platformShare === 6250);

recordAdminRating({
  orderId: "ord-a1",
  orderNumber: "S-A1",
  stars: 1,
  notes: "سيء",
  driverId: "drv-new",
  driverName: "سائق جديد",
  customerPhone: "0944111222",
  deliveryShop: "محل سبانو",
  customerName: "عميل",
});
ok(
  "bad rating alert",
  getAdminOpsSnapshot().alerts.some((a) => a.kind === "bad_rating" && !a.acknowledged),
);
ok(
  "bad rating has shop phone",
  getAdminOpsSnapshot().ratings.some(
    (r) => r.isBad && r.customerPhone === "0944111222",
  ),
);

const foundShop = searchAdminOrders(getAdminOpsSnapshot().orders, "طعمة");
ok("search shop", foundShop.length === 1);
const foundDriver = searchAdminOrders(getAdminOpsSnapshot().orders, "سائق جديد");
ok("search driver", foundDriver.length === 1);
const foundNum = searchAdminOrders(getAdminOpsSnapshot().orders, "S-A1");
ok("search order number", foundNum.length === 1);

ok("eod inventory", endOfDayInventory(getAdminOpsSnapshot().orders).length === 1);

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nAll admin smoke checks passed.");
