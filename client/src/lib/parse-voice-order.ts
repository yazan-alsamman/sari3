import type { DeliveryMode } from "./types";

export interface ParsedVoiceStop {
  shopName: string;
  area: string;
}

export type MissingFieldId =
  | "pickupShop"
  | "pickupArea"
  | "deliveryShop"
  | "deliveryArea"
  | "stopIncomplete";

export interface MissingField {
  id: MissingFieldId;
  label: string;
  hint: string;
}

export interface ParsedVoiceOrder {
  transcript: string;
  pickup: ParsedVoiceStop;
  delivery: ParsedVoiceStop;
  intermediateStops: ParsedVoiceStop[];
  mode: DeliveryMode;
  specialNotes: string;
  missing: MissingField[];
  extractedSummary: string[];
  isComplete: boolean;
}

type AreaKey = "HOSH" | "QADAM" | "ZAHIRA" | "MEZZEH" | "BARAMKEH";

const AREA_NAME: Record<AreaKey, string> = {
  HOSH: "حوش بلاس",
  QADAM: "القدم الصناعية",
  ZAHIRA: "الزاهرة",
  MEZZEH: "المزة",
  BARAMKEH: "البرامكة",
};

const AREA_TOKENS: Array<[string, string]> = [
  ["#HOSH#", AREA_NAME.HOSH],
  ["#QADAM#", AREA_NAME.QADAM],
  ["#ZAHIRA#", AREA_NAME.ZAHIRA],
  ["#MEZZEH#", AREA_NAME.MEZZEH],
  ["#BARAMKEH#", AREA_NAME.BARAMKEH],
];

const CHAT_PREFIX =
  /^(يعني|هلق|هلا|طيب|اوكي|اوك|يلا|شوف|اسمع|بدي|بدنا|بيدي|رجاء|لو\s*سمحت|من\s*فضلك|يا\s*اخي|ياخي|يا\s*حبيبي|والله|واللهي|خلص|مرحبا|اهلا|اهلين|خذ|خد|خودي|توصيل)\s+/iu;

const STOP_FILLER =
  /(?:^|\s)(?:ال)?(قطعه?\s*تانيه?|قطعه?|غيار|تاخود|تاخذ|تاخد|خود|خد|خودي|بدي|بدنا|علي\s*طريقك|طريقك|وانت|انت|طالع|رايح|ماشي|توصل|تكمل|كمل|كمان|تانيه?|كذا|هيك|هنيك|هناك|هون|هونيك|وعلي|علي)(?=\s|$)/giu;

function normChars(s: string): string {
  return s
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lock area phrases into tokens so later rules can't break names. */
function lockAreas(input: string): string {
  let t = input;
  const ar = "\\u0600-\\u06FF";

  // Spoken shortcuts for حوش بلاس (after norm: على→علي)
  t = t
    .replace(
      /(?:^|\s)(?:عال|علي\s*ال|علي|ل|ب)(?:ال)?حوش(?:\s*بلاس)?(?=\s|$)/g,
      " #HOSH# ",
    )
    .replace(/(?:^|\s)الحوش(?:\s*بلاس)?(?=\s|$)/g, " #HOSH# ");

  t = t
    .replace(/(?:^|\s)ب(?:ال)?(حوش\s*بلاس|حوشبلاس)/g, " $1 ")
    .replace(new RegExp(`(?:^|\\s)ب(?:ال)?(القدم(?:\\s*الصناعي[${ar}]*)?)`, "g"), " $1 ")
    .replace(new RegExp(`(?:^|\\s)ب(?:ال)?(الزاهر[${ar}]*)`, "g"), " $1 ")
    .replace(new RegExp(`(?:^|\\s)ب(?:ال)?(المز[${ar}]*)`, "g"), " $1 ")
    .replace(new RegExp(`(?:^|\\s)ب(?:ال)?(البرامك[${ar}]*)`, "g"), " $1 ")
    .replace(/(?:^|\s)في\s+/g, " ");

  // JS \w / \b do not work for Arabic
  t = t
    .replace(/حوش\s*بلاس|حوشبلاس|حوش\s*بلاص|حوش\s*بلاش/g, " #HOSH# ")
    .replace(
      new RegExp(
        `القدم(?:\\s*الصناعي[${ar}]*)?|المنطقه?\\s*الصناعي[${ar}]*|منطقه?\\s*صناعي[${ar}]*`,
        "g",
      ),
      " #QADAM# ",
    )
    .replace(/الزاهره|الزاهرة/g, " #ZAHIRA# ")
    .replace(/المزه|المزة/g, " #MEZZEH# ")
    .replace(/البرامكه|البرامكة|برامكه|برامكة/g, " #BARAMKEH# ")
    .replace(/(?:من\s*)?(?:هنيك|هناك|هونيك|من\s*هون)/g, " #THERE# ");

  return t.replace(/\s+/g, " ").trim();
}

function detectArea(chunk: string): string {
  for (const [tok, name] of AREA_TOKENS) {
    if (chunk.includes(tok) || chunk.includes(name)) return name;
  }
  return "";
}

function areasOrdered(text: string): string[] {
  const hits: Array<{ name: string; i: number }> = [];
  for (const [tok, name] of AREA_TOKENS) {
    let idx = text.indexOf(tok);
    while (idx >= 0) {
      hits.push({ name, i: idx });
      idx = text.indexOf(tok, idx + 1);
    }
  }
  hits.sort((a, b) => a.i - b.i);
  const out: string[] = [];
  for (const h of hits) {
    if (out[out.length - 1] !== h.name) out.push(h.name);
  }
  return out;
}

function lastAreaBefore(text: string, atIndex: number): string {
  let best = "";
  let bestI = -1;
  for (const [tok, name] of AREA_TOKENS) {
    const idx = text.lastIndexOf(tok, Math.max(0, atIndex - 1));
    if (idx > bestI) {
      bestI = idx;
      best = name;
    }
  }
  return best;
}

function shopOnly(chunk: string): string {
  let s = chunk
    .replace(/#HOSH#|#QADAM#|#ZAHIRA#|#MEZZEH#|#BARAMKEH#|#THERE#/g, " ")
    .replace(
      /حوش\s*بلاس|حوشبلاس|القدم(?:\s*الصناعي[\u0600-\u06FF]*)?|الزاهره|الزاهرة|المزه|المزة|البرامكه|البرامكة|صناعي[\u0600-\u06FF]*|منطقه|منطقة/g,
      " ",
    )
    .replace(/\|FROM\||\|TO\||\|VIA\|/g, " ")
    .replace(/\bvip\b/gi, " ")
    .replace(STOP_FILLER, " ")
    .replace(
      /(?:^|\s)(في|ب|بال|من|عند|محل|ورشه|ورشة|كراج|الي|الى)(?=\s|$)/giu,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  for (let i = 0; i < 6; i++) s = s.replace(CHAT_PREFIX, "").trim();
  s = s.replace(/^(محل|ورشه|ورشة|كراج|توصيل|طلب)\s+/giu, "").trim();
  if (!s || s.length < 2) return "";
  if (/^(vip|طلب|توصيل|سرعه?|قطعه?|غيار|كذا|هيك)$/i.test(s)) return "";
  return s;
}

function parseChunk(chunk: string, inheritArea = ""): ParsedVoiceStop {
  let area = detectArea(chunk);
  if (!area && (chunk.includes("#THERE#") || /هنيك|هناك|هونيك/.test(chunk))) {
    area = inheritArea;
  }
  const shop = shopOnly(chunk);
  return {
    shopName: shop ? `محل ${shop}` : "",
    area,
  };
}

/**
 * Normalize + mark journey structure.
 * |FROM| origin · |TO| destination · |VIA| on-route stop (before or after destination)
 */
export function normalizeArabicSpeech(raw: string): string {
  let t = normChars(raw);
  t = t
    .replace(/فاي\s*بي|في\s*اي\s*بي|فيآيبي/gi, " vip ")
    .replace(/مستعجل(?:ه|ين)?|مستعيله|عاجل|بسرعه|سرعه\s*كتير/g, " vip ");

  t = lockAreas(t);

  // On-route stop intros (Levantine) — على becomes علي after normChars
  t = t
    .replace(
      /(?:^|\s)(?:و\s*)?(?:علي\s*)?طريقك\s*(?:بدي\s*)?(?:تاخود|تاخذ|تاخد|خود|خذ|خد)?\s*(?:(?:ال)?قطعه?\s*(?:تانيه?|كذا|هيك)?\s*)?(?:من\s*)?/g,
      " |VIA| ",
    )
    .replace(
      /(?:^|\s)(?:و\s*)?انت\s*(?:طالع|رايح|ماشي)\s*(?:بدي\s*)?(?:تاخود|تاخذ|تاخد|خود|خذ|خد)?\s*(?:(?:ال)?قطعه?\s*(?:تانيه?|كذا|هيك)?\s*)?(?:من\s*)?/g,
      " |VIA| ",
    )
    .replace(
      /(?:^|\s)(?:بس|لما|اول\s*ما)\s*توصل(?:ي|وا)?\s*(?:بدي\s*)?(?:تاخود|تاخذ|تاخد|خود|خذ|خد)?\s*(?:(?:ال)?قطعه?\s*(?:تانيه?|كذا|هيك)?\s*)?(?:من\s*)?/g,
      " |VIA| ",
    )
    .replace(
      /(?:^|\s)(?:و\s*)?(?:كمان|بعدين)\s*(?:بدي\s*)?(?:تاخود|تاخذ|خود|خذ|خد)?\s*(?:(?:ال)?قطعه?\s*تانيه?\s*)?(?:من\s*)?/g,
      " |VIA| ",
    )
    .replace(
      /(?:^|\s)(?:و\s*)?(?:مر(?:ر|ّ)?\s*(?:علي|على)|توقف(?:\s*عند)?|خذ\s*من|خد\s*من|خود\s*من)\s+/g,
      " |VIA| ",
    )
    .replace(/(?:^|\s)(?:و\s*)?تكمل(?:ي|وا|ون)?(?=\s|$)/g, " ");

  // Destination / origin — do NOT treat bare "توصيل من" as destination
  t = t
    .replace(/\s+(?:الي|الى|إلي|إلى|لعند|لعنا|لعندو|لعنها|لحتى)\s+/g, " |TO| ")
    .replace(
      /\s+(?:يوصل(?:ه|ها|ون)?|اوصله?|اوصلها)\s*(?:ل|علي|على|عند)?\s*/g,
      " |TO| ",
    )
    .replace(
      /\s+توصيل(?:ه|ها)?\s*(?:ل|الي|الى|علي|على|عند)\s*/g,
      " |TO| ",
    )
    .replace(
      /\s+(?:ودي|ودوا|وديه|سلمي|سلموا|سلمه)\s*(?:ل|علي|على|عند)?\s*/g,
      " |TO| ",
    )
    .replace(/(?:^|\s)ل(?!عند|عنا|حتى|VIA)([\u0600-\u06FF]{2,})/g, " |TO| $1 ")
    .replace(/(?:^|\s)من\s+/g, " |FROM| ");

  return t.replace(/\s+/g, " ").trim();
}

function cleanSeg(seg: string): string {
  return seg
    .replace(/\|FROM\||\|TO\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitJourney(text: string): {
  pickup: string;
  delivery: string;
  mids: string[];
} | null {
  let work = text;
  for (let i = 0; i < 6; i++) work = work.replace(CHAT_PREFIX, "").trim();

  const recv = work.match(
    /استلام(?:\s+من)?\s+(.+?)\s+(?:تسليم|توصيل)\s+(.+)$/u,
  );
  if (recv) return peelSides(recv[1], recv[2]);

  if (work.includes("|TO|")) {
    const i = work.indexOf("|TO|");
    const left = work.slice(0, i).trim();
    const right = work.slice(i + 4).trim();
    return peelSides(left, right);
  }

  // Stop-only utterance: "وعلى طريقك من محل عابدين…"
  if (work.includes("|VIA|")) {
    const segs = work
      .split("|VIA|")
      .map(cleanSeg)
      .filter(Boolean);
    if (segs.length >= 1) {
      // No clear pickup/delivery — expose stops only
      return { pickup: "", delivery: "", mids: segs };
    }
  }

  return null;
}

/**
 * VIA may sit on the pickup side (before destination) or after delivery
 * ("على طريقك…" / "بس توصل…" spoken after the main drop-off).
 */
function peelSides(
  pickupSide: string,
  deliverySide: string,
): { pickup: string; delivery: string; mids: string[] } {
  const leftParts = pickupSide
    .split("|VIA|")
    .map(cleanSeg)
    .filter(Boolean);
  const rightParts = deliverySide
    .split("|VIA|")
    .map(cleanSeg)
    .filter(Boolean);

  const pickup = leftParts[0] || "";
  const midsBefore = leftParts.slice(1);
  const delivery = rightParts[0] || "";
  const midsAfter = rightParts.slice(1);

  return {
    pickup,
    delivery,
    mids: [...midsBefore, ...midsAfter],
  };
}

function fallbackTwo(text: string): {
  pickup: ParsedVoiceStop;
  delivery: ParsedVoiceStop;
} | null {
  const areas = areasOrdered(text);
  const flat = text.replace(/\|FROM\||\|TO\||\|VIA\|/g, " ");
  const named = [
    ...flat.matchAll(/(?:محل|ورشه|ورشة|كراج)\s+([\u0600-\u06FF]{2,30})/gu),
  ]
    .map((m) => shopOnly(m[1]))
    .filter(Boolean);

  if (named.length >= 2) {
    return {
      pickup: { shopName: `محل ${named[0]}`, area: areas[0] || "" },
      delivery: {
        shopName: `محل ${named[named.length - 1]}`,
        area: areas[areas.length - 1] || "",
      },
    };
  }

  const words = shopOnly(flat).split(/\s+/).filter((w) => w.length >= 2);
  if (words.length >= 2) {
    const a = words[0];
    const b = words[words.length - 1];
    if (a && b && a !== b) {
      return {
        pickup: { shopName: `محل ${a}`, area: areas[0] || "" },
        delivery: {
          shopName: `محل ${b}`,
          area: areas[areas.length - 1] || "",
        },
      };
    }
  }
  return null;
}

function collectMissing(
  pickup: ParsedVoiceStop,
  delivery: ParsedVoiceStop,
  stops: ParsedVoiceStop[],
): MissingField[] {
  const missing: MissingField[] = [];
  if (!pickup.shopName) {
    missing.push({ id: "pickupShop", label: "محل الاستلام ناقص", hint: "مثل: طعمة" });
  }
  if (!pickup.area) {
    missing.push({
      id: "pickupArea",
      label: "منطقة الاستلام ناقصة",
      hint: "حوش بلاس / القدم / الزاهرة / المزة",
    });
  }
  if (!delivery.shopName) {
    missing.push({ id: "deliveryShop", label: "محل الوجهة ناقص", hint: "مثل: سبانو" });
  }
  if (!delivery.area) {
    missing.push({
      id: "deliveryArea",
      label: "منطقة الوجهة ناقصة",
      hint: "وين التسليم؟",
    });
  }
  stops.forEach((s, i) => {
    if (!s.shopName || !s.area) {
      missing.push({
        id: "stopIncomplete",
        label: `توقف ${i + 1} غير مكتمل`,
        hint: "محل + منطقة (مثل: عابدين بالبرامكة)",
      });
    }
  });
  return missing;
}

/**
 * Flexible Levantine voice → order fields.
 * Handles on-route stops: على طريقك / وانت طالع / بس توصل / ومر على…
 */
export function parseVoiceOrderTranscript(transcript: string): ParsedVoiceOrder {
  const original = transcript.replace(/\s+/g, " ").trim();
  const text = normalizeArabicSpeech(original);
  const mode: DeliveryMode = /\bvip\b/i.test(text) ? "vip" : "standard";

  let pickup: ParsedVoiceStop = { shopName: "", area: "" };
  let delivery: ParsedVoiceStop = { shopName: "", area: "" };
  let intermediateStops: ParsedVoiceStop[] = [];

  const journey = splitJourney(text);
  if (journey) {
    pickup = parseChunk(journey.pickup);
    delivery = parseChunk(journey.delivery);

    intermediateStops = journey.mids
      .map((mid) => {
        const midAt = text.indexOf(mid);
        const inherit =
          detectArea(mid) ||
          lastAreaBefore(text, midAt >= 0 ? midAt : text.length) ||
          delivery.area ||
          pickup.area;
        return parseChunk(mid, inherit);
      })
      .filter((s) => s.shopName || s.area);
  } else {
    const fb = fallbackTwo(text);
    if (fb) {
      pickup = fb.pickup;
      delivery = fb.delivery;
    } else {
      pickup = parseChunk(text);
    }
  }

  const ordered = areasOrdered(text);
  const hasMainLegs = Boolean(pickup.shopName || delivery.shopName);
  if (ordered.length >= 2 && hasMainLegs) {
    if (!pickup.area) pickup.area = ordered[0];
    if (!delivery.area) delivery.area = ordered[ordered.length - 1];
  } else if (ordered.length === 1 && hasMainLegs) {
    if (!pickup.area && !delivery.area) pickup.area = ordered[0];
  }

  // Notes: prefer explicit ملاحظة; avoid treating stop "قطعة من…" as the whole note
  let specialNotes = "";
  const noteMatch = original.match(/(?:ملاحظه|ملاحظة)\s*[:：]?\s*(.+)$/u);
  if (noteMatch) specialNotes = noteMatch[1].slice(0, 120);

  const missing = collectMissing(pickup, delivery, intermediateStops);
  const extractedSummary: string[] = [];
  if (pickup.shopName) extractedSummary.push(`من: ${pickup.shopName}`);
  if (pickup.area) extractedSummary.push(`(${pickup.area})`);
  intermediateStops.forEach((s, i) => {
    extractedSummary.push(`توقف ${i + 1}: ${s.shopName || "؟"} ${s.area || ""}`);
  });
  if (delivery.shopName) extractedSummary.push(`إلى: ${delivery.shopName}`);
  if (delivery.area) extractedSummary.push(`(${delivery.area})`);
  if (mode === "vip") extractedSummary.push("VIP");

  return {
    transcript: original,
    pickup,
    delivery,
    intermediateStops,
    mode,
    specialNotes,
    missing,
    extractedSummary,
    isComplete: missing.length === 0,
  };
}

export const VOICE_ORDER_EXAMPLES = [
  "من طعمة حوش بلاس لعند سبانو منطقة صناعية",
  "من طعمة القدم لسبانو المزة وعلى طريقك خود من محل عابدين بالبرامكة",
  "من سبانو المزة إلى طعمة الزاهرة وانت طالع خود من محل بوني زينز بحوش بلاس",
  "من الفرامل القدم لسبانو المزة بس توصل عالحوش بدي تاخود قطعة تانية من هنيك",
];

export const VOICE_GUIDE = "";
