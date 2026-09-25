"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDriver } from "@/lib/driver-store";
import { DEMO_RADIUS_NOTE } from "@/lib/driver-types";
import { formatSyp } from "@/lib/demo-currency";
import { mapsNavUrlForArea } from "@/lib/notify";
import { EmptyState } from "@/components/EmptyState";
import { DriverMapDynamic } from "./DriverMapDynamic";

export function DriverHomeScreen() {
  const {
    account,
    approvalStatus,
    availability,
    setAvailability,
    settings,
    updateSettings,
    offer,
    offerSecondsLeft,
    acceptOffer,
    rejectOffer,
    position,
    locationError,
    locationSharing,
    logout,
    endDay,
    simulateOfferNow,
  } = useDriver();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gateMsg, setGateMsg] = useState<string | null>(null);
  const lat = position?.lat ?? 33.487;
  const lng = position?.lng ?? 36.301;
  const online = availability === "available";
  const canWork = approvalStatus === "approved";

  function toggleOnline() {
    setGateMsg(null);
    const next = online ? "offline" : "available";
    const r = setAvailability(next);
    if (!r.ok) setGateMsg(r.error);
  }

  return (
    <section className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col">
      <header className="z-20 flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 ui-glass-strong backdrop-blur">
        <div>
          <p className="text-xs text-slate-400">السائق</p>
          <h1 className="font-display text-lg font-bold text-white">
            {account?.displayName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="ui-btn-ghost px-3 py-2 text-xs font-semibold"
          >
            إعدادات
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400"
          >
            خروج
          </button>
        </div>
      </header>

      <div className="relative h-[46vh] min-h-[260px] w-full px-3 pt-3">
        <div className="h-full overflow-hidden rounded-3xl border border-white/10">
          <DriverMapDynamic lat={lat} lng={lng} radiusKm={settings.radiusKm} />
        </div>
        <div className="pointer-events-none absolute bottom-4 left-5 right-5 rounded-2xl ui-glass-strong px-3 py-2 text-xs text-slate-200">
          {locationSharing ? "الموقع عم ينشارك للتجربة · " : null}
          {locationError ?? "موقعكم الحالي على الخريطة"}
          {" · "}
          قطر {settings.radiusKm} كم
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-6 pt-4 sm:px-5">
        {!canWork ? (
          <div className="rounded-3xl border border-amber-700/40 bg-amber-950/40 p-4 text-sm text-amber-100">
            {approvalStatus === "pending"
              ? "حسابكم بانتظار موافقة الأدمن. بعد الموافقة من لوحة الأدمن (نفس المتصفح) بيتفعّل الشغل تلقائياً خلال ثانية."
              : approvalStatus === "suspended"
                ? "الحساب معلّق من لوحة الأدمن."
                : "تم رفض طلب الانضمام. تواصلوا مع الإدارة."}
            {approvalStatus === "pending" ? (
              <p className="mt-2 text-[11px] text-amber-200/70">
                إذا وافق الأدمن وما تغيّر الوضع: رجّعوا لهون من تبويب السائق أو اعملوا دخول من جديد.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-700/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            الحساب معتمد — تقدروا تشغّلوا «متاح للعمل»
          </div>
        )}
        {gateMsg ? (
          <p className="rounded-2xl border border-red-800/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {gateMsg}
          </p>
        ) : null}

        <div className="ui-glass flex items-center justify-between rounded-3xl p-4">
          <div>
            <p className="text-sm font-bold text-white">
              {online ? "متاح للعمل" : "خارج الخدمة"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {online
                ? "عم ننتظر طلب من العميل (نفس المتصفح)"
                : "شغّلوا «متاح للعمل» لتستلموا الطلبات"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleOnline}
            disabled={!canWork && !online}
            className={`relative h-10 w-[72px] rounded-full transition disabled:opacity-40 ${
              online ? "bg-emerald-600" : "bg-slate-600"
            }`}
            aria-label="تشغيل أو إيقاف العمل"
          >
            <span
              className={`absolute top-1 h-8 w-8 rounded-full bg-white transition ${
                online ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!online}
            onClick={simulateOfferNow}
            className="rounded-2xl border border-sky-700/40 bg-sky-950/30 py-3 text-sm font-semibold text-sky-100 disabled:opacity-40"
          >
            تحديث طلبات العملاء
          </button>
          <button
            type="button"
            onClick={endDay}
            className="rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-slate-200"
          >
            إنهاء اليوم / الجرد
          </button>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-500">
          {DEMO_RADIUS_NOTE} · الطلبات تجي فقط من واجهة العميل (نفس المتصفح). ما في طلبات وهمية.
        </p>

        {canWork && online && !offer ? (
          <EmptyState
            tone="wait"
            title="عم ننتظر طلب عميل…"
            body="افتحوا تبويب العميل من نفس المتصفح واعملوا طلب جديد. بعد ما تخلّصوا رحلة، العرض ما بيرجع — لازم طلب جديد من العميل."
          />
        ) : null}
        {canWork && !online ? (
          <EmptyState
            tone="neutral"
            title="أنتم خارج الخدمة"
            body="لما تكونوا جاهزين، فعّلوا «متاح للعمل» — الطلبات ما بتجي وأنتم مطفيين."
          />
        ) : null}
      </div>

      <AnimatePresence>
        {offer ? (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl border border-red-900/40 bg-[#0d1524] p-4 shadow-[0_-20px_60px_rgba(0,0,0,.55)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-red-300">طلب جديد — جاوبوا بسرعة</p>
                <p className="text-[11px] text-slate-400">صوت + اهتزاز عند الوصول وعند آخر 5 ثوانٍ</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    offer.mode === "vip"
                      ? "bg-amber-500/20 text-amber-200"
                      : "bg-slate-500/20 text-slate-300"
                  }`}
                >
                  {offer.mode === "vip" ? "VIP" : "عادي"}
                </span>
                <div
                  className={`relative flex h-14 w-14 items-center justify-center ${
                    offerSecondsLeft <= 5 ? "anim-tach" : ""
                  }`}
                  aria-label={`${offerSecondsLeft} ثانية متبقية`}
                >
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke={offerSecondsLeft <= 5 ? "#ef4444" : "#34d399"}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 24 * (1 - offerSecondsLeft / 15)
                      }`}
                    />
                  </svg>
                  <span
                    className={`relative text-sm font-bold tabular-nums ${
                      offerSecondsLeft <= 5 ? "text-red-300" : "text-white"
                    }`}
                  >
                    {offerSecondsLeft}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-base font-bold text-white">{offer.customerName}</p>
            {offer.linkedOrderId ? (
              <p className="text-[11px] font-semibold text-emerald-300">
                طلب حقيقي من واجهة العميل
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">طلب محاكاة</p>
            )}
            <p className="mt-1 text-sm text-slate-300">
              من {offer.pickup.shopName} — {offer.pickup.area}
            </p>
            <p className="text-sm text-slate-300">
              إلى {offer.delivery.shopName} — {offer.delivery.area}
            </p>
            {offer.stops.length > 0 ? (
              <p className="mt-1 text-xs text-amber-200">
                توقف:{" "}
                {offer.stops
                  .map((s) => `${s.shopName} (${s.area})`)
                  .join(" · ")}
              </p>
            ) : null}
            {(offer.packageType || offer.packageSizeLabel) && (
              <p className="mt-1 text-xs text-slate-400">
                القطعة: {offer.packageType || "—"}
                {offer.packageSizeLabel ? ` · ${offer.packageSizeLabel}` : ""}
              </p>
            )}
            {offer.pickupPhotoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={offer.pickupPhotoDataUrl}
                alt="صورة المحل"
                className="mt-2 h-28 w-full rounded-xl object-cover"
              />
            ) : (
              <p className="mt-2 text-[11px] text-slate-500">ما في صورة محل مرفقة</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className="font-bold text-emerald-300">
                {formatSyp(offer.earningsAmount)}
              </span>
              <a
                href={`tel:${offer.customerPhone}`}
                className="text-sky-300 underline"
              >
                اتصال {offer.customerPhone}
              </a>
              <span className="text-slate-400">≈ {offer.distanceKm} كم</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a
                href={mapsNavUrlForArea(offer.pickup.area, offer.pickup.shopName)}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-sky-700/40 bg-sky-950/30 py-2 text-center text-xs font-semibold text-sky-100"
              >
                ملاحة للاستلام
              </a>
              <a
                href={mapsNavUrlForArea(
                  offer.delivery.area,
                  offer.delivery.shopName,
                )}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-sky-700/40 bg-sky-950/30 py-2 text-center text-xs font-semibold text-sky-100"
              >
                ملاحة للتسليم
              </a>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={rejectOffer}
                className="rounded-2xl border border-white/15 py-3.5 text-sm font-bold text-slate-200"
              >
                رفض / التالي
              </button>
              <button
                type="button"
                onClick={acceptOffer}
                className="rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white"
              >
                قبول وبدء الرحلة
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-end bg-black/55 p-3"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              exit={{ y: 30 }}
              className="w-full rounded-3xl border border-white/10 bg-[#0d1524] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-white">إعدادات السائق</h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>قطر استلام الطلبات</span>
                  <span className="font-bold text-red-300">{settings.radiusKm} كم</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  value={settings.radiusKm}
                  onChange={(e) =>
                    updateSettings({ radiusKm: Number(e.target.value) })
                  }
                  className="mt-3 w-full accent-red-600"
                />
                <p className="mt-2 text-[11px] text-slate-500">{DEMO_RADIUS_NOTE}</p>
              </div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-slate-400">
                <p>الموتور: {account?.vehicle.motorcycleModel}</p>
                <p>
                  السلة:{" "}
                  {account?.vehicle.basketSize === "large"
                    ? "كبيرة"
                    : "صغيرة"}{" "}
                  · {account?.vehicle.capacityNote || account?.vehicle.basketInfo}
                </p>
                <p>النمرة: {account?.vehicle.plateNumber}</p>
                <p>الهاتف: {account?.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="mt-4 w-full rounded-2xl bg-red-900 py-3 text-sm font-bold text-white"
              >
                تم
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
