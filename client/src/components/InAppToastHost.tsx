"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { InAppToastDetail } from "@/lib/notify";

const KIND_STYLE: Record<InAppToastDetail["kind"], string> = {
  info: "border-sky-500/40 bg-[#0d1b2e]/95 text-sky-50",
  success: "border-emerald-500/40 bg-emerald-950/95 text-emerald-50",
  warn: "border-amber-500/40 bg-amber-950/95 text-amber-50",
  offer: "border-red-500/50 bg-[#1a1020]/96 text-red-50",
  vip: "border-amber-400/60 bg-[#2a1a08]/96 text-amber-50",
};

export function InAppToastHost() {
  const [toasts, setToasts] = useState<InAppToastDetail[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<InAppToastDetail>).detail;
      if (!detail?.title) return;
      setToasts((prev) => [...prev.slice(-3), detail]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 5200);
    }
    window.addEventListener("sareee-inapp-toast", onToast);
    return () => window.removeEventListener("sareee-inapp-toast", onToast);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-3"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className={`pointer-events-auto w-full max-w-md rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md ${KIND_STYLE[t.kind]}`}
          >
            <p className="text-sm font-bold">{t.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed opacity-90">{t.body}</p>
            <button
              type="button"
              className="mt-2 text-[11px] underline opacity-70"
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
            >
              إغلاق
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
