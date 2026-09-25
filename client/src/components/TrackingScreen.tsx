"use client";

import { motion } from "framer-motion";
import { BrandHeader } from "./BrandHeader";
import { EmptyState } from "./EmptyState";
import { LiveMapDynamic } from "./LiveMapDynamic";
import { AutomotiveLoader } from "./ui/MotionPrimitives";
import { mapsNavUrlForArea, PACKAGE_SIZES } from "@/lib/notify";
import { useApp } from "@/lib/store";

const STEPS = [
  { id: "searching", label: "بحث عن سائق" },
  { id: "assigned", label: "تم التعيين" },
  { id: "in_transit", label: "بالطريق" },
  { id: "delivered", label: "تم التسليم" },
] as const;

function stepIndex(status: string): number {
  if (status === "rated") return 3;
  if (status === "cancelled") return -1;
  const i = STEPS.findIndex((s) => s.id === status);
  return i;
}

export function TrackingScreen() {
  const {
    activeOrder,
    lastRating,
    startNewOrder,
    setStep,
    openCancelModal,
    openRatingModal,
  } = useApp();

  if (!activeOrder) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4 text-white">
        <EmptyState
          title="ما في طلب نشط هلأ"
          body="ابدأوا طلب توصيل جديد — سجل الطلبات بيشوفه الأدمن بس، مو العميل."
          action={
            <button
              type="button"
              onClick={() => setStep("order")}
              className="ui-btn-primary px-5 py-3"
            >
              إنشاء طلب
            </button>
          }
        />
      </div>
    );
  }

  const { draft, driver, status, price, cancelReason } = activeOrder;
  const canCancel = ["searching", "assigned", "in_transit"].includes(status);
  const needsRating = status === "delivered" && !lastRating;
  const activeIdx = stepIndex(status);
  const sizeLabel =
    PACKAGE_SIZES.find((s) => s.id === draft.packageSize)?.label ?? "";

  return (
    <div className="min-h-[100dvh] pb-10 sm:pb-12">
      <BrandHeader compact showBack subtitle="تتبع مباشر للطلب" />

      <div className="ui-app-frame space-y-4 px-4 py-5 sm:px-5">
        {status !== "cancelled" ? (
          <section className="ui-glass rounded-3xl p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="anim-track h-2.5 w-2.5 rounded-full bg-sky-400" />
              <p className="text-xs font-semibold text-slate-300">حالة الطلب</p>
            </div>
            <p className="mb-3 text-xs text-slate-400">مسار الطلب</p>
            <div className="flex items-center justify-between gap-1">
              {STEPS.map((s, i) => {
                const done = activeIdx >= i;
                const current = activeIdx === i;
                return (
                  <div key={s.id} className="flex flex-1 flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-700 text-slate-300"
                      } ${current ? "ring-2 ring-red-400 ring-offset-2 ring-offset-[#0a1628]" : ""}`}
                    >
                      {i + 1}
                    </div>
                    <p
                      className={`mt-1 text-center text-[10px] leading-tight ${
                        current ? "font-bold text-red-200" : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-red-200">
              {status === "searching" &&
                "بانتظار سائق — افتحوا التطبيق كسائق وفعّلوا «متاح» ليقبل الطلب"}
              {status === "assigned" && "السائق في طريقه إليكم"}
              {status === "in_transit" && "السائق بالطريق — تابعوه على الخريطة"}
              {(status === "delivered" || status === "rated") &&
                "التسليم خلص — شكراً لاستخدام سريع"}
            </p>
          </section>
        ) : null}

        {status !== "cancelled" ? (
          <LiveMapDynamic
            pickupArea={draft.pickup.area}
            deliveryArea={draft.delivery.area}
            pickupLabel={draft.pickup.shopName || "استلام"}
            deliveryLabel={draft.delivery.shopName || "تسليم"}
            stopAreas={draft.intermediateStops.map((s) => s.area)}
            stopLabels={draft.intermediateStops.map(
              (s) => s.shopName || "توقف",
            )}
            inTransit={status === "in_transit" || status === "assigned"}
          />
        ) : null}

        {status === "cancelled" ? (
          <div className="rounded-3xl border border-red-900/50 bg-red-950/40 p-4 text-sm text-red-100">
            <p className="font-bold">الطلب ملغى</p>
            <p className="mt-2 text-red-200/90">
              السبب: {cancelReason || "غير محدد"}
            </p>
          </div>
        ) : null}

        {driver && status !== "cancelled" ? (
          <motion.section
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-red-900/35 bg-gradient-to-br from-red-950/40 to-transparent p-4 backdrop-blur-md"
          >
            <p className="text-xs text-red-200/80">السائق وين هلق؟</p>
            <h2 className="mt-1 text-xl font-bold text-white">{driver.name}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {status === "assigned"
                ? "متجه لنقطة الاستلام"
                : status === "in_transit"
                  ? "على مسار التوصيل (النقطة الخضراء على الخريطة)"
                  : "تم الوصول"}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-black/25 p-3">
                <dt className="text-slate-400">لوحة الدراجة</dt>
                <dd className="mt-1 font-semibold text-slate-100">
                  {driver.plate}
                </dd>
              </div>
              <div className="rounded-2xl bg-black/25 p-3">
                <dt className="text-slate-400">الوصول المتوقع</dt>
                <dd className="mt-1 font-semibold text-red-300">
                  حوالي {driver.etaMinutes} دقيقة
                </dd>
              </div>
            </dl>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`tel:${driver.phone}`}
                className="ui-btn-primary py-3 text-center text-sm"
              >
                اتصال
              </a>
              <a
                href={mapsNavUrlForArea(
                  draft.delivery.area,
                  draft.delivery.shopName,
                )}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-sky-500/40 bg-gradient-to-l from-sky-950/60 to-[#0b1a2e] py-3 text-center text-sm font-bold text-sky-100"
              >
                فتح الملاحة
              </a>
            </div>
          </motion.section>
        ) : null}

        {!driver && status === "searching" ? (
          <div className="ui-glass rounded-3xl p-6 text-center text-slate-300">
            <AutomotiveLoader label="جاري انتظار قبول سائق من واجهة السائق..." />
            <p className="mt-2 text-xs text-slate-500">
              ارجعوا لاختيار الدور ← ابدأ كسائق ← متاح للعمل
            </p>
          </div>
        ) : null}

        <section className="ui-glass rounded-3xl p-4 text-sm text-slate-300">
          <p>
            <span className="text-slate-400">من:</span> {draft.pickup.shopName} —{" "}
            {draft.pickup.area}
          </p>
          {draft.intermediateStops.map((s, i) => (
            <p key={s.id} className="mt-1">
              <span className="text-slate-400">توقف {i + 1}:</span> {s.shopName}{" "}
              — {s.area}
            </p>
          ))}
          <p className="mt-1">
            <span className="text-slate-400">إلى:</span> {draft.delivery.shopName}{" "}
            — {draft.delivery.area}
          </p>
          {draft.packageType || sizeLabel ? (
            <p className="mt-2 text-xs text-amber-100/90">
              القطعة: {draft.packageType || "—"}
              {sizeLabel ? ` · ${sizeLabel}` : ""}
            </p>
          ) : null}
          <p className="mt-2 text-red-300">
            السعر التجريبي: {price.total.toLocaleString("ar-SY")}{" "}
            {price.currencyLabel}
          </p>

          {(draft.pickup.photoDataUrl || draft.delivery.photoDataUrl) && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {draft.pickup.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.pickup.photoDataUrl}
                  alt="محل الاستلام"
                  className="h-24 w-full rounded-xl object-cover"
                />
              ) : null}
              {draft.delivery.photoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.delivery.photoDataUrl}
                  alt="محل التسليم"
                  className="h-24 w-full rounded-xl object-cover"
                />
              ) : null}
            </div>
          )}
        </section>

        {needsRating ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-800/40 bg-red-950/30 p-4 text-sm text-red-100"
          >
            <p className="font-semibold">السائق أكّد التسليم — قيّم الخدمة</p>
            <button
              type="button"
              onClick={openRatingModal}
              className="ui-btn-primary mt-3 w-full py-3"
            >
              قيّم الآن
            </button>
          </motion.div>
        ) : null}

        {lastRating ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            تم إرسال تقييم {lastRating.stars} نجوم
            {lastRating.notes ? ` — «${lastRating.notes}»` : ""}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {canCancel ? (
            <button
              type="button"
              onClick={openCancelModal}
              className="w-full rounded-2xl border border-red-800/60 bg-red-950/40 py-3.5 font-bold text-red-200"
            >
              إلغاء الطلب مع ذكر السبب
            </button>
          ) : null}

          {(status === "delivered" ||
            status === "rated" ||
            status === "cancelled") && (
            <button
              type="button"
              onClick={startNewOrder}
              className="w-full rounded-2xl bg-gradient-to-l from-[#1e3a5f] to-[#0a1628] py-3.5 font-bold text-white ring-1 ring-red-900/40"
            >
              طلب جديد
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
