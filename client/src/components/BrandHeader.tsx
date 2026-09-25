"use client";

import { motion } from "framer-motion";
import { BackButton } from "./BackButton";
import { ThemeToggle } from "@/lib/theme";

export function BrandHeader({
  subtitle,
  compact = false,
  showBack = false,
  /** Off on login/auth screens — light mode only after entering the app */
  showThemeToggle = false,
}: {
  subtitle?: string;
  compact?: boolean;
  showBack?: boolean;
  showThemeToggle?: boolean;
}) {
  return (
    <header
      className={`relative overflow-hidden border-b border-white/10 text-white ${
        compact ? "px-4 py-3" : "px-5 py-5"
      }`}
      style={{
        background:
          "linear-gradient(120deg, rgba(7,17,31,0.95) 0%, rgba(19,42,74,0.9) 55%, rgba(143,31,42,0.35) 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(47,140,255,0.2),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-6 top-2 h-16 w-16 rounded-full border border-dashed border-sky-400/30 anim-gear opacity-50" />
      <div className="relative mx-auto flex w-full max-w-lg items-center justify-between gap-3 sm:max-w-xl">
        <div className="min-w-0 flex-1">
          {showBack ? (
            <div className="mb-2">
              <BackButton />
            </div>
          ) : null}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-display font-bold tracking-tight ${
              compact ? "text-xl" : "text-2xl sm:text-3xl"
            }`}
            style={{
              backgroundImage:
                "linear-gradient(100deg, #f8c4c8, #e85a66 50%, #7eb6ff)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            سريع حوش بلاس
          </motion.p>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-slate-300">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showThemeToggle ? <ThemeToggle /> : null}
          <motion.div
            animate={{ rotate: [0, 12, -8, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            className="anim-track flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f8cff] to-[#8f1f2a] text-sm font-bold !text-white"
            aria-hidden
          >
            س
          </motion.div>
        </div>
      </div>
    </header>
  );
}
