"use client";

/** Persistent demo hint — same-origin limitation of the localStorage bridge. */
export function DemoSameBrowserBanner() {
  return (
    <div
      className="relative z-[70] border-b border-amber-600/40 bg-amber-950/90 px-3 py-2 text-center text-[11px] leading-relaxed text-amber-50 backdrop-blur-md sm:text-xs"
      role="status"
    >
      <strong className="font-bold">مهم للتجربة:</strong> العميل والسائق والأدمن
      لازم يكونوا على{" "}
      <span className="font-semibold text-amber-100">نفس المتصفح ونفس الجهاز</span>
      {" "}
      (التخزين محلي — ما بيتشارك بين كروم والإيموليتر).
    </div>
  );
}
