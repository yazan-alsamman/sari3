/** Approximate industrial-area anchors around Damascus (demo routing). */
export const AREA_COORDS: Record<string, [number, number]> = {
  "حوش بلاس": [33.4485, 36.278],
  صناعة: [33.478, 36.292],
  برامكة: [33.5085, 36.291],
  مزة: [33.508, 36.255],
  جرمانا: [33.485, 36.345],
  "كراج تيناوي": [33.495, 36.305],
  "كراج النخيل": [33.502, 36.318],
  "كراج خان زاده": [33.512, 36.275],
  "صناعية تل": [33.47, 36.26],
  دوما: [33.572, 36.403],
  أخرى: [33.48, 36.28],
};

export function coordsForArea(area: string): [number, number] {
  const trimmed = area.trim();
  const known = Object.keys(AREA_COORDS).find((z) => trimmed.includes(z));
  return AREA_COORDS[known ?? "أخرى"];
}

export function lerpLatLng(
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Haversine distance in meters */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number } | [number, number],
): number {
  const lat2 = Array.isArray(b) ? b[0] : b.lat;
  const lng2 = Array.isArray(b) ? b[1] : b.lng;
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - a.lat);
  const dLng = toRad(lng2 - a.lng);
  const lat1 = toRad(a.lat);
  const lat2r = toRad(lat2);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
