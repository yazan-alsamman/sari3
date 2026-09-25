"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthScreen } from "./AuthScreen";
import { CancelOrderModal } from "./CancelOrderModal";
import { OrderScreen } from "./OrderScreen";
import { RatingModal } from "./RatingModal";
import { TrackingScreen } from "./TrackingScreen";
import { CustomerExitContext } from "@/lib/customer-exit";
import { useApp } from "@/lib/store";
import { pageSlide } from "./ui/MotionPrimitives";

const slideVariants = pageSlide;

export function AppShell({ onBackToWelcome }: { onBackToWelcome?: () => void }) {
  const { step, setStep, requireCustomerLoginScreen, logoutCustomer } = useApp();

  // Entering customer role → always show login/register (don't skip with stale session)
  useEffect(() => {
    requireCustomerLoginScreen();
  }, [requireCustomerLoginScreen]);

  const customerStep = step === "welcome" ? "auth" : step;

  function exitToRolePick() {
    logoutCustomer();
    setStep("welcome");
    onBackToWelcome?.();
  }

  return (
    <CustomerExitContext.Provider value={onBackToWelcome ? exitToRolePick : null}>
      <div className="ui-app-frame min-h-[100dvh]">
        {onBackToWelcome ? (
          <div className="px-4 pt-3">
            <button
              type="button"
              onClick={exitToRolePick}
              className="ui-btn-ghost px-3 py-1.5 text-xs"
            >
              ← اختيار الدور
            </button>
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          <motion.div
            key={customerStep}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {customerStep === "auth" && <AuthScreen />}
            {customerStep === "order" && <OrderScreen />}
            {customerStep === "tracking" && <TrackingScreen />}
          </motion.div>
        </AnimatePresence>
        <RatingModal />
        <CancelOrderModal />
      </div>
    </CustomerExitContext.Provider>
  );
}
