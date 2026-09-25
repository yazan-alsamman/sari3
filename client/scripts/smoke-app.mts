/**
 * Smoke checks for critical flows (parse + price + maps helpers).
 * Run: npx tsx scripts/smoke-app.mts
 */
import { parseVoiceOrderTranscript } from "../src/lib/parse-voice-order";
import { calculateDemoPrice } from "../src/lib/demo-pricing";
import { createDemoDriverOffer } from "../src/lib/demo-driver-offers";
import { mapsNavUrlForArea, PACKAGE_SIZES, PACKAGE_TYPES } from "../src/lib/notify";

let failed = 0;
function ok(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`PASS  ${name}`);
  else {
    failed += 1;
    console.log(`FAIL  ${name} ${detail}`);
  }
}

const voice = parseVoiceOrderTranscript(
  "من طعمة حوش بلاس لعند سبانو منطقة صناعية",
);
ok("voice pickup shop", voice.pickup.shopName.includes("طعم"));
ok("voice pickup area", voice.pickup.area.includes("حوش"));
ok("voice delivery shop", voice.delivery.shopName.includes("سبانو"));
ok("voice delivery area", Boolean(voice.delivery.area));
ok("voice complete", voice.isComplete);

const withStop = parseVoiceOrderTranscript(
  "من طعمة القدم لسبانو المزة وعلى طريقك خود من محل عابدين بالبرامكة",
);
ok("voice stop parsed", withStop.intermediateStops.length >= 1);

const price = calculateDemoPrice({
  pickupArea: "حوش بلاس",
  deliveryArea: "المزة",
  mode: "vip",
  intermediateStopCount: 1,
});
ok("demo price positive", price.total > 0);
ok("demo price isDemo", price.isDemo === true);

const offer = createDemoDriverOffer(false);
ok("driver offer id", Boolean(offer.id));
ok("driver offer 15s", offer.expiresInSec === 15);
ok("maps url", mapsNavUrlForArea("حوش بلاس", "محل طعمة").includes("google.com/maps"));
ok("package catalogs", PACKAGE_TYPES.length > 0 && PACKAGE_SIZES.length === 2);

if (failed > 0) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nAll smoke checks passed.");
