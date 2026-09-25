"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { CANCEL_REASONS } from "@/lib/types";

export function CancelOrderModal() {
  const { showCancelModal, closeCancelModal, cancelOrder, activeOrder } =
    useApp();
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [custom, setCustom] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const finalReason =
      reason === "سبب آخر" ? custom.trim() || "سبب آخر" : reason;
    if (reason === "سبب آخر" && !custom.trim()) return;
    cancelOrder(finalReason);
    setCustom("");
    setReason(CANCEL_REASONS[0]);
  }

  const canCancel =
    activeOrder &&
    ["searching", "assigned", "in_transit"].includes(activeOrder.status);

  return (
    <AnimatePresence>
      {showCancelModal && canCancel ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.form
            onSubmit={onSubmit}
            initial={{ y: 36, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="ui-glass-strong w-full max-w-md rounded-3xl border border-[rgba(143,31,42,0.35)] p-5 text-white sm:p-6"
          >
            <h2 className="font-display text-2xl font-bold text-red-300">
              إلغاء الطلب
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              اختر سبب الإلغاء — السبب يُسجَّل مع الطلب (محاكاة محلية).
            </p>

            <div className="mt-4 space-y-2">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition ${
                    reason === r
                      ? "border-red-700 bg-red-950/50 text-red-100"
                      : "border-white/10 bg-white/5 text-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel-reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-red-700"
                  />
                  {r}
                </label>
              ))}
            </div>

            {reason === "سبب آخر" ? (
              <textarea
                rows={3}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="اكتب سبب الإلغاء..."
                className="mt-3 w-full rounded-2xl border border-red-900/50 bg-black/30 px-4 py-3 text-sm outline-none focus:border-red-600"
              />
            ) : null}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={closeCancelModal}
                className="ui-btn-ghost flex-1 px-4 py-3 text-sm"
              >
                تراجع
              </button>
              <button
                type="submit"
                className="ui-btn-primary flex-[1.3] px-4 py-3 text-sm"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
