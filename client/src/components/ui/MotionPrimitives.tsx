"use client";

/**
 * Visual/motion primitives only — no business logic.
 */
import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

export function ScreenFade({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function GlassCard({
  children,
  className = "",
  strong = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`${strong ? "ui-glass-strong" : "ui-glass"} rounded-3xl p-5 sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Tachometer-style loader — automotive motif, not a generic spinner */
export function AutomotiveLoader({ label = "جاري التحميل..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8" role="status">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="anim-gear absolute inset-0 rounded-full border-2 border-dashed border-sky-400/50" />
        <div className="anim-tach h-8 w-8 rounded-full bg-gradient-to-br from-[#2f8cff] to-[#8f1f2a] shadow-[0_0_20px_rgba(47,140,255,0.45)]" />
        <div className="anim-piston absolute bottom-1 h-2 w-1.5 rounded-sm bg-slate-200/80" />
      </div>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

/** Live tracking pulse ring for map/status chips */
export function TrackingPulse({ children }: { children: ReactNode }) {
  return (
    <span className="anim-track inline-flex items-center justify-center rounded-full">
      {children}
    </span>
  );
}

export const pageSlide = {
  enter: { opacity: 0, x: 28, filter: "blur(3px)" },
  center: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -20, filter: "blur(3px)" },
};
