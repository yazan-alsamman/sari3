"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/lib/store";

export function RatingModal() {
  const {
    showRatingModal,
    activeOrder,
    profile,
    submitRating,
    closeRatingModal,
  } = useApp();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (showRatingModal) {
      setStars(0);
      setHover(0);
      setNotes("");
    }
  }, [showRatingModal, activeOrder?.id]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (stars < 1) return;
    submitRating(stars, notes.trim());
  }

  const driverName = activeOrder?.driver?.name ?? "السائق";
  const shop = profile?.shopName ?? "المحل";

  return (
    <AnimatePresence>
      {showRatingModal && activeOrder ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.form
            onSubmit={onSubmit}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
            className="ui-glass-strong w-full max-w-md rounded-3xl border border-[rgba(143,31,42,0.35)] p-5 text-white sm:p-6"
          >
            <div className="mb-1 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              السائق أكّد التسليم
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-red-300">
              قيّم الخدمة
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              قيّم السائق {driverName} من {shop}.
            </p>

            <div className="my-5 flex justify-center gap-2" dir="ltr">
              {[1, 2, 3, 4, 5].map((value) => {
                const active = (hover || stars) >= value;
                return (
                  <motion.button
                    key={value}
                    type="button"
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.15 }}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setStars(value)}
                    className={`text-3xl transition ${
                      active
                        ? "text-red-400 drop-shadow-[0_0_12px_rgba(185,28,28,0.7)]"
                        : "text-slate-600"
                    }`}
                    aria-label={`${value} نجوم`}
                  >
                    ★
                  </motion.button>
                );
              })}
            </div>

            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`مثال: تأخر في الوصول كذا دقيقة… أو شكراً ${driverName}`}
              className="ui-input text-sm"
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={closeRatingModal}
                className="ui-btn-ghost flex-1 px-4 py-3 text-sm"
              >
                لاحقاً
              </button>
              <button
                type="submit"
                disabled={stars < 1}
                className="ui-btn-primary flex-[1.4] px-4 py-3 text-sm disabled:opacity-50"
              >
                إرسال التقييم
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500">
              التقييم بعد الاستلام يُرسل محلياً — الربط مع الإدارة لاحقاً
            </p>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
