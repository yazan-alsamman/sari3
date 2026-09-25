import { parseVoiceOrderTranscript } from "../src/lib/parse-voice-order";

const samples = [
  "من طعمة حوش بلاس لعند سبانو منطقة صناعية",
  "بدي من محل طعمة بالقدم لسبانو بحوش بلاس",
  "من سبانو المزة إلى طعمة الزاهرة مستعجل",
  "يا اخي خذ من الفرامل القدم ومر على الزيوت الزاهرة لعند سبانو حوش بلاس",
  "حوش بلاس طعمة الى القدم سبانو",
  "والله بدي توصيل من طعمة لسبانو",
  "من محل طعمة في القدم الصناعية إلى محل سبانو في حوش بلاس",
  // On-route stops
  "من طعمة القدم لسبانو المزة وعلى طريقك بدي تاخود قطعة من محل عابدين بالبرامكة و تكمل",
  "من سبانو المزة إلى طعمة الزاهرة وانت طالع خود القطعة كذا من محل بوني زينز بحوش بلاس",
  "من الفرامل القدم لسبانو المزة بس توصل عالحوش بدي تاخود قطعة تانية من هنيك",
  "وعلى طريقك بدي تاخود قطعة من محل عابدين بالبرامكة و تكمل",
];

for (const s of samples) {
  const r = parseVoiceOrderTranscript(s);
  console.log("\n>>", s);
  console.log(
    JSON.stringify(
      {
        pickup: r.pickup,
        delivery: r.delivery,
        stops: r.intermediateStops,
        mode: r.mode,
        missing: r.missing.map((m) => m.label),
        ok: r.isComplete,
      },
      null,
      2,
    ),
  );
}
