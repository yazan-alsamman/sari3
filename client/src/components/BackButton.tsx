"use client";

import { motion } from "framer-motion";
import { useCustomerExit } from "@/lib/customer-exit";
import { useApp } from "@/lib/store";

export function BackButton({ className = "" }: { className?: string }) {
  const { step, goBack } = useApp();
  const exitToRolePick = useCustomerExit();

  if (step === "welcome") return null;

  function onBack() {
    // From first customer screen, return to role pick (not a dead "welcome" loop)
    if ((step === "auth" || step === "welcome") && exitToRolePick) {
      exitToRolePick();
      return;
    }
    goBack();
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onBack}
      className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 backdrop-blur-md hover:bg-white/10 ${className}`}
      aria-label="رجوع"
    >
      <span aria-hidden className="text-base leading-none">
        →
      </span>
      رجوع
    </motion.button>
  );
}
