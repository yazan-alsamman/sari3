/** Shared helpers for demo notifications, maps links, and package labels. */

export const PACKAGE_TYPES = [
  "فرامل / دسكات",
  "زيوت وفلاتر",
  "بطارية",
  "إضاءة",
  "غيار محرك خفيف",
  "إكسسوارات",
  "أخرى خفيفة",
] as const;

/** @deprecated Prefer PACKAGE_WEIGHT_CLASSES from demo-capacity — kept for labels */
export const PACKAGE_SIZES = [
  { id: "light", label: "أوزان خفيفة" },
  { id: "heavy", label: "أوزان ثقيلة" },
] as const;

export type PackageSizeId = (typeof PACKAGE_SIZES)[number]["id"];

export function mapsNavUrl(lat: number, lng: number, label?: string): string {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  // geo for Android intent fallback + Google Maps universal
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving&dir_action=navigate&q=${q}`;
}

export function mapsNavUrlForArea(area: string, shop?: string): string {
  const query = [shop, area, "دمشق"].filter(Boolean).join(" ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}&travelmode=driving`;
}

export async function ensureNotifyPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const p = await Notification.requestPermission();
    return p === "granted";
  } catch {
    return false;
  }
}

/** In-app banner (always visible even when OS notifications are blocked). */
export type InAppToastKind = "info" | "success" | "warn" | "offer" | "vip";

export type InAppToastDetail = {
  id: string;
  title: string;
  body: string;
  kind: InAppToastKind;
};

export function showInAppToast(
  title: string,
  body: string,
  kind: InAppToastKind = "info",
) {
  if (typeof window === "undefined") return;
  const detail: InAppToastDetail = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    body,
    kind,
  };
  window.dispatchEvent(
    new CustomEvent<InAppToastDetail>("sareee-inapp-toast", { detail }),
  );
}

export async function pushNotify(
  title: string,
  body: string,
  kind: InAppToastKind = "info",
) {
  showInAppToast(title, body, kind);
  try {
    const ok = await ensureNotifyPermission();
    if (!ok) return;
    new Notification(title, { body, dir: "rtl", lang: "ar" });
  } catch {
    /* ignore */
  }
}

export function playTone(kind: "normal" | "vip" | "offline" = "normal") {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const freqs =
      kind === "vip"
        ? [880, 1174, 1318, 1174]
        : kind === "offline"
          ? [320, 240]
          : [660, 880];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = kind === "vip" ? "square" : "sine";
      o.frequency.value = f;
      g.gain.value = kind === "vip" ? 0.06 : 0.04;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now + i * 0.14);
      o.stop(now + i * 0.14 + 0.12);
    });
    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    /* ignore */
  }
}

export function vibratePattern(kind: "normal" | "vip" | "offline" = "normal") {
  try {
    if (!navigator.vibrate) return;
    if (kind === "vip") navigator.vibrate([80, 40, 80, 40, 160, 60, 220]);
    else if (kind === "offline") navigator.vibrate([200, 100, 200]);
    else navigator.vibrate([60, 40, 60]);
  } catch {
    /* ignore */
  }
}
