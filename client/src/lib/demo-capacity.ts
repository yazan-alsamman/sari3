/**
 * Demo capacity / basket matching — UI prototype only.
 * Not ACCEPTED ADR-008. Values frozen in DEMO_ADMIN_UI.md.
 */

export type BasketSize = "small" | "large";
export type PackageWeightClass = "light" | "heavy";

export const BASKET_SIZES = [
  {
    id: "small" as const,
    label: "سلة صغيرة",
    hint: "أوزان خفيفة فقط",
  },
  {
    id: "large" as const,
    label: "سلة كبيرة",
    hint: "خفيفة + ثقيلة (بواط، محرك، إطارات…)",
  },
] as const;

export const PACKAGE_WEIGHT_CLASSES = [
  {
    id: "light" as const,
    label: "أوزان خفيفة",
    hint: "قطع صغيرة / متوسطة تناسب سلة صغيرة أو كبيرة",
  },
  {
    id: "heavy" as const,
    label: "أوزان ثقيلة",
    hint: "تحتاج سائق بسلة كبيرة",
  },
] as const;

/** Light / general part types (demo). */
export const LIGHT_PACKAGE_TYPES = [
  "فرامل / دسكات",
  "زيوت وفلاتر",
  "بطارية",
  "إضاءة",
  "غيار محرك خفيف",
  "إكسسوارات",
  "أخرى خفيفة",
] as const;

/** Heavy parts — user-confirmed list (+ «أكبر من ذلك»). */
export const HEAVY_PACKAGE_TYPES = [
  "بواط",
  "طبون",
  "محرك",
  "غطاء محرك",
  "إطارات",
  "أكبر من ذلك",
] as const;

export function weightClassLabel(c?: PackageWeightClass | "" | null): string {
  if (c === "heavy") return "أوزان ثقيلة";
  if (c === "light") return "أوزان خفيفة";
  return "";
}

export function basketSizeLabel(s?: BasketSize | "" | null): string {
  if (s === "large") return "سلة كبيرة";
  if (s === "small") return "سلة صغيرة";
  return "";
}

/** Heavy packages require a large basket; light packages fit either. */
export function driverCanTakePackage(
  basketSize: BasketSize | undefined | null,
  weightClass: PackageWeightClass | undefined | null | "",
): boolean {
  if (!weightClass || weightClass === "light") return true;
  return basketSize === "large";
}

export function inferWeightClassFromType(
  packageType: string | undefined | null,
): PackageWeightClass | null {
  if (!packageType) return null;
  if ((HEAVY_PACKAGE_TYPES as readonly string[]).includes(packageType)) {
    return "heavy";
  }
  if ((LIGHT_PACKAGE_TYPES as readonly string[]).includes(packageType)) {
    return "light";
  }
  return null;
}
