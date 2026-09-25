"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DriverAuthScreen } from "./DriverAuthScreen";
import { DriverHomeScreen } from "./DriverHomeScreen";
import { DriverActiveScreen } from "./DriverActiveScreen";
import { DriverDayEndScreen } from "./DriverDayEndScreen";
import { useDriver } from "@/lib/driver-store";
import { pageSlide } from "@/components/ui/MotionPrimitives";

export function DriverShell({ onBackToWelcome }: { onBackToWelcome: () => void }) {
  const { step, logout, requireLoginScreen } = useDriver();

  // Every time the user chooses «ابدأ كسائق», show login/register first.
  useEffect(() => {
    requireLoginScreen();
  }, [requireLoginScreen]);

  function exitRole() {
    logout();
    onBackToWelcome();
  }

  return (
    <div className="ui-app-frame min-h-[100dvh]">
      {step !== "auth" ? (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={exitRole}
            className="ui-btn-ghost px-3 py-1.5 text-xs"
          >
            ← اختيار الدور
          </button>
        </div>
      ) : null}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={pageSlide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === "auth" && (
            <DriverAuthScreen
              onBack={() => {
                logout();
                onBackToWelcome();
              }}
            />
          )}
          {step === "home" && <DriverHomeScreen />}
          {step === "active" && <DriverActiveScreen />}
          {step === "day_end" && <DriverDayEndScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
