import type { DriverOffer } from "./driver-types";

const NAMES = ["أبو محمد", "أبو علي", "الحاج سمير", "أبو يوسف", "كراج النور"];
const SHOPS = ["طعمة", "سبانو", "الفرامل", "الزيوت", "عابدين", "بوني زينز"];
const AREAS = ["حوش بلاس", "القدم الصناعية", "الزاهرة", "المزة", "البرامكة"];
const PACKAGES = ["فرامل / دسكات", "زيوت وفلاتر", "بطارية", "غيار محرك", "أخرى"];
const SIZES = ["صغيرة (بيدك)", "متوسطة (سلة)", "كبيرة (تحتاج تثبيت)"];

/** Tiny placeholder JPEG (1x1) — only used when we want to demo "photo present". */
const DEMO_PHOTO =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGccf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Simulated nearby offer for the driver prototype (not real dispatch). */
export function createDemoDriverOffer(vipPreferred: boolean): DriverOffer {
  const vip = vipPreferred || Math.random() < 0.35;
  const pickupArea = pick(AREAS);
  let deliveryArea = pick(AREAS);
  if (deliveryArea === pickupArea) {
    deliveryArea = pick(AREAS.filter((a) => a !== pickupArea));
  }
  const withStop = Math.random() < 0.4;
  const withPhoto = Math.random() < 0.55;
  const base = vip ? 28000 : 18000;
  const stopExtra = withStop ? 5000 : 0;
  const amount = base + stopExtra + Math.floor(Math.random() * 4000);

  return {
    id: uid("offer"),
    orderNumber: `S-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: pick(NAMES),
    customerPhone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
    mode: vip ? "vip" : "standard",
    pickup: { shopName: `محل ${pick(SHOPS)}`, area: pickupArea },
    delivery: { shopName: `محل ${pick(SHOPS)}`, area: deliveryArea },
    stops: withStop
      ? [{ shopName: `محل ${pick(SHOPS)}`, area: pick(AREAS) }]
      : [],
    earningsLabel: "ل.س.ج",
    earningsAmount: amount,
    distanceKm: Number((1.2 + Math.random() * 6).toFixed(1)),
    expiresInSec: 15,
    createdAt: new Date().toISOString(),
    packageType: pick(PACKAGES),
    packageSizeLabel: pick(SIZES),
    pickupPhotoDataUrl: withPhoto ? DEMO_PHOTO : undefined,
  };
}
