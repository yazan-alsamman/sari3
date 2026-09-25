"use client";

import { motion } from "framer-motion";
import { useDriver } from "@/lib/driver-store";
import { tripPhaseLabel, type DemoTripPhase } from "@/lib/demo-dispatch-bus";
import { formatSyp } from "@/lib/demo-currency";
import { mapsNavUrlForArea } from "@/lib/notify";
import { TrackingPulse } from "@/components/ui/MotionPrimitives";
import { DriverMapDynamic } from "./DriverMapDynamic";

const STEPS: DemoTripPhase[] = [
  "heading_pickup",
  "at_pickup",
  "in_transit",
  "delivered",
];

export function DriverActiveScreen() {
  const {
    activeOffer,
    queuedOffer,
    tripPhase,
    nearDelivery,
    completeDeliveryWithPayment,
    position,
    setStep,
    offer,
    offerSecondsLeft,
    acceptOffer,
    rejectOffer,
    simulateOfferNow,
  } = useDriver();
  const lat = position?.lat ?? 33.487;
  const lng = position?.lng ?? 36.301;

  if (!activeOffer) {
    return (
      <section className="ui-app-frame p-6">
        <p className="text-center text-slate-300">ما في رحلة نشطة هلأ</p>
        <p className="mt-2 max-w-xs text-center text-xs text-slate-500">
          ارجعوا للرئيسية وانتظروا عرض طلب من العميل (نفس المتصفح).
        </p>
        <button
          type="button"
          className="mt-3 text-sky-300 underline"
          onClick={() => setStep("home")}
        >
          رجوع
        </button>
      </section>
    );
  }

  const phase = tripPhase ?? "heading_pickup";
  const activeIdx = Math.max(0, STEPS.indexOf(phase));
  const navTarget =
    phase === "in_transit" || phase === "delivered"
      ? {
          area: activeOffer.delivery.area,
          shop: activeOffer.delivery.shopName,
          label: "ملاحة للتسليم",
        }
      : {
          area: activeOffer.pickup.area,
          shop: activeOffer.pickup.shopName,
          label: "ملاحة للاستلام",
        };

  const canFinish = phase === "in_transit" && nearDelivery;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="ui-app-frame flex min-h-[100dvh] flex-col px-4 py-4 sm:px-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-emerald-300 sm:text-3xl">
            رحلة جارية
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            طلب {activeOffer.orderNumber} · {activeOffer.customerName}
            {activeOffer.mode === "vip" ? " · VIP" : ""}
          </p>
        </div>
        <TrackingPulse>
          <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400" />
        </TrackingPulse>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        للتجريب: كل مرحلة تتقدم تلقائياً كل ~8 ثوانٍ. عند قرب التسليم (≤٥ دقائق) تقدروا
        تقبلوا طلب ثاني.
      </p>

      {queuedOffer ? (
        <div className="mt-3 rounded-2xl border border-sky-600/40 bg-sky-950/40 px-3 py-2 text-xs text-sky-100">
          طلب ثاني بالانتظار: {queuedOffer.orderNumber} ·{" "}
          {queuedOffer.pickup.area} → {queuedOffer.delivery.area} — بعد التسليم
          الأول رح تبلّشوه.
        </div>
      ) : null}

      {nearDelivery && !queuedOffer && !offer ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-700/40 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
          <span>قرب التسليم — فيكم تستلموا طلب إضافي متوافق مع سلتكم</span>
          <button
            type="button"
            onClick={simulateOfferNow}
            className="rounded-xl bg-amber-800/80 px-3 py-1.5 font-bold"
          >
            تحديث الطلبات
          </button>
        </div>
      ) : null}

      <section className="ui-glass mt-3 rounded-3xl p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="anim-track h-2 w-2 rounded-full bg-sky-400" />
          <p className="text-xs text-slate-400">متابعة الرحلة (تلقائي)</p>
        </div>
        <div className="flex justify-between gap-1">
          {STEPS.map((s, i) => {
            const done = activeIdx >= i;
            const current = activeIdx === i;
            return (
              <div key={s} className="flex flex-1 flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                    done ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"
                  } ${current ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-[#07111f]" : ""}`}
                >
                  {i + 1}
                </div>
                <p className="mt-1 text-center text-[9px] leading-tight text-slate-400">
                  {s === "heading_pickup" && "للاستلام"}
                  {s === "at_pickup" && "عند المحل"}
                  {s === "in_transit" && "بالطريق"}
                  {s === "delivered" && "تسليم"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-emerald-200">
          {tripPhaseLabel(phase)}
        </p>
        {phase === "in_transit" && !nearDelivery ? (
          <p className="mt-2 text-center text-xs text-slate-400">
            تابعوا القيادة — لما تقربوا من التسليم بيظهر زر إنهاء الطلب
          </p>
        ) : null}
        {canFinish ? (
          <p className="mt-2 text-center text-xs text-amber-200">
            قربتوا من نقطة التسليم · الأجرة {formatSyp(activeOffer.earningsAmount)} (حصتكم)
          </p>
        ) : null}
      </section>

      <div className="mt-3 h-44 overflow-hidden rounded-3xl border border-[rgba(47,140,255,0.2)] shadow-[0_12px_40px_rgba(8,20,40,0.45)] sm:h-52">
        <DriverMapDynamic lat={lat} lng={lng} radiusKm={2} />
      </div>

      <div className="ui-glass mt-4 space-y-2 rounded-3xl p-4 text-sm">
        <p>
          من: {activeOffer.pickup.shopName} — {activeOffer.pickup.area}
        </p>
        {activeOffer.stops.map((s, i) => (
          <p key={`${s.shopName}-${i}`} className="text-amber-200">
            توقف {i + 1}: {s.shopName} — {s.area}
          </p>
        ))}
        <p>
          إلى: {activeOffer.delivery.shopName} — {activeOffer.delivery.area}
        </p>
        <a
          href={`tel:${activeOffer.customerPhone}`}
          className="block text-sky-300 underline"
        >
          اتصال بالزبون {activeOffer.customerPhone}
        </a>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={mapsNavUrlForArea(navTarget.area, navTarget.shop)}
          target="_blank"
          rel="noreferrer"
          className="col-span-2 rounded-2xl border border-sky-500/40 bg-gradient-to-l from-sky-950/60 to-[#0b1a2e] py-3 text-center text-sm font-bold text-sky-100"
        >
          {navTarget.label}
        </a>
      </div>

      <button
        type="button"
        disabled={!canFinish}
        onClick={completeDeliveryWithPayment}
        className="ui-btn-secondary mt-auto py-4 text-base disabled:cursor-not-allowed disabled:opacity-40"
      >
        إنهاء الطلب — استلمت الأجرة
      </button>

      {offer ? (
        <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border border-red-900/40 bg-[#0d1524] p-4 shadow-[0_-20px_60px_rgba(0,0,0,.55)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-red-300">
              طلب إضافي — جاوبوا بسرعة
            </p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white">
              {offerSecondsLeft}ث
            </span>
          </div>
          <p className="text-xs text-slate-300">
            {offer.orderNumber} · {offer.pickup.area} → {offer.delivery.area}
            {offer.packageSizeLabel ? ` · ${offer.packageSizeLabel}` : ""}
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-300">
            {formatSyp(offer.earningsAmount)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={rejectOffer}
              className="rounded-2xl border border-white/15 py-3 text-sm font-semibold text-slate-200"
            >
              رفض
            </button>
            <button
              type="button"
              onClick={acceptOffer}
              className="rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white"
            >
              قبول للطابور
            </button>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}
