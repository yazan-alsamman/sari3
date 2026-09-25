"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AutoPartsSlideshow } from "./AutoPartsSlideshow";
import { GlassCard } from "./ui/MotionPrimitives";
import { DemoSameBrowserBanner } from "./DemoSameBrowserBanner";

export function WelcomeScreen({
  onChooseCustomer,
  onChooseDriver,
  onSecretAdmin,
}: {
  onChooseCustomer: () => void;
  onChooseDriver: () => void;
  /** Long-press brand — no visible admin button for regular users */
  onSecretAdmin?: () => void;
}) {
  const pressTimer = useRef<number | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);

  function clearPress() {
    if (pressTimer.current != null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function startSecretPress() {
    if (!onSecretAdmin) return;
    clearPress();
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null;
      onSecretAdmin();
    }, 2500);
  }

  return (
    <section className="theme-locked-dark relative flex min-h-[100dvh] flex-col overflow-hidden">
      <DemoSameBrowserBanner />
      <AutoPartsSlideshow />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050d18]/40 via-[#07111f]/75 to-[#07111f]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 ui-shimmer opacity-40" />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-end px-5 pb-10 pt-10 sm:px-8 sm:pb-14">
        <GlassCard strong className="border border-white/10">
          <div
            className="mb-1 flex cursor-pointer items-center gap-3 select-none"
            onPointerDown={startSecretPress}
            onPointerUp={clearPress}
            onPointerLeave={clearPress}
            onPointerCancel={clearPress}
            onContextMenu={(e) => e.preventDefault()}
            title="اضغطوا مطوّلاً لدخول الأدمن"
          >
            <span className="anim-tach flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f8cff] to-[#8f1f2a] text-sm font-bold text-white shadow-[0_0_24px_rgba(47,140,255,0.35)]">
              س
            </span>
            <motion.p
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="font-display text-3xl font-bold leading-tight text-transparent sm:text-4xl md:text-5xl"
              style={{
                backgroundImage:
                  "linear-gradient(105deg, #f0a8ae 0%, #e85a66 40%, #2f8cff 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
              aria-label="سريع حوش بلاس"
            >
              سريع حوش بلاس
            </motion.p>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
            توصيل قطع السيارات بين المحلات والورش — اختاروا دوركم وبلّشوا:
          </p>

          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={onChooseCustomer}
            className="ui-btn-primary mt-7 w-full px-5 py-4 text-base sm:text-lg"
          >
            ابدأ كعميل
          </motion.button>
          <p className="mt-1.5 text-center text-xs text-slate-400">
            صاحب محل أو ميكانيكي — اطلبوا توصيل قطعة
          </p>

          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={onChooseDriver}
            className="ui-btn-secondary mt-4 w-full px-5 py-4 text-base sm:text-lg"
          >
            ابدأ كسائق
          </motion.button>
          <p className="mt-1.5 text-center text-xs text-slate-400">
            سائق موتوسيكل — استلموا عروض التوصيل
          </p>

          <button
            type="button"
            onClick={() => setShowHowTo(true)}
            className="mt-5 w-full text-center text-sm font-semibold text-sky-300 underline-offset-2 hover:underline"
          >
            كيف تجربوا التطبيق؟ (٣ خطوات)
          </button>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            نموذج واجهات للتجربة — بدون سيرفر حقيقي بعد
          </p>
        </GlassCard>
      </div>

      <AnimatePresence>
        {showHowTo ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHowTo(false)}
          >
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="ui-glass-strong w-full max-w-md rounded-3xl p-5 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display text-xl font-bold text-sky-200">
                كيف تجربوا التطبيق؟
              </h2>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-200">
                <li>
                  <span className="font-bold text-red-300">١.</span> ابدأوا{" "}
                  <strong>كعميل</strong> — أنشئوا حساب أو ادخلوا، واعملوا طلب
                  توصيل.
                </li>
                <li>
                  <span className="font-bold text-red-300">٢.</span> من نفس
                  المتصفح ارجعوا وابدأوا <strong>كسائق</strong> — بعد موافقة
                  الأدمن فعّلوا «متاح للعمل» واقبلوا العرض.
                </li>
                <li>
                  <span className="font-bold text-red-300">٣.</span> الأدمن: اضغطوا
                  مطوّلاً على اسم التطبيق ~٢٫٥ ثانية، أو افتحوا{" "}
                  <span className="text-sky-300">/admin</span>.
                </li>
              </ol>
              <p className="mt-4 rounded-2xl border border-amber-700/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-100">
                العميل والسائق والأدمن لازم نفس المتصفح والجهاز بهالتجربة.
              </p>
              <button
                type="button"
                className="ui-btn-primary mt-5 w-full py-3"
                onClick={() => setShowHowTo(false)}
              >
                تمام، فهمت
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
