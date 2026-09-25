"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandHeader } from "./BrandHeader";
import { VoiceOrderPanel } from "./VoiceOrderPanel";
import { calculateDemoPrice, INDUSTRIAL_AREAS } from "@/lib/demo-pricing";
import {
  HEAVY_PACKAGE_TYPES,
  LIGHT_PACKAGE_TYPES,
} from "@/lib/demo-capacity";
import { useApp } from "@/lib/store";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function OrderScreen() {
  const {
    profile,
    draft,
    setPickup,
    setDelivery,
    addStop,
    updateStop,
    removeStop,
    setMode,
    updateDraft,
    submitOrder,
  } = useApp();

  const [errors, setErrors] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [entryMode, setEntryMode] = useState<"voice" | "form">("voice");
  const [formHighlight, setFormHighlight] = useState(false);

  const price = useMemo(
    () =>
      calculateDemoPrice({
        pickupArea: draft.pickup.area,
        deliveryArea: draft.delivery.area,
        mode: draft.mode,
        intermediateStopCount: draft.intermediateStops.length,
      }),
    [draft],
  );

  async function onPickupPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPickup({ photoDataUrl: dataUrl });
  }

  async function onDeliveryPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setDelivery({ photoDataUrl: dataUrl });
  }

  function validate(): boolean {
    const next: string[] = [];
    if (!draft.pickup.shopName.trim() || !draft.pickup.area.trim()) {
      next.push("أكمل بيانات الاستلام (اسم المحل + المنطقة)");
    }
    if (!draft.delivery.shopName.trim() || !draft.delivery.area.trim()) {
      next.push("أكمل بيانات التسليم (اسم المحل + المنطقة)");
    }
    if (draft.packageSize !== "light" && draft.packageSize !== "heavy") {
      next.push("اختاروا وزن القطعة (خفيفة أو ثقيلة)");
    }
    if (draft.packageSize === "heavy" && !draft.packageType.trim()) {
      next.push("اختاروا نوع القطعة الثقيلة");
    }
    draft.intermediateStops.forEach((s, i) => {
      if (!s.shopName.trim() || !s.area.trim()) {
        next.push(`التوقف رقم ${i + 1} غير مكتمل`);
      }
    });
    setErrors(next);
    return next.length === 0;
  }

  function confirmAndSubmit() {
    if (!validate()) {
      setEntryMode("form");
      setFormHighlight(true);
      return;
    }
    setConfirming(true);
    window.setTimeout(() => {
      submitOrder();
      setConfirming(false);
    }, 700);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    confirmAndSubmit();
  }

  function goEditForm() {
    setEntryMode("form");
    setFormHighlight(true);
    window.setTimeout(() => setFormHighlight(false), 1800);
  }

  const inputClass = "ui-input";

  return (
    <div className="min-h-[100dvh] pb-10 sm:pb-12">
      <BrandHeader
        compact
        showBack
        subtitle={
          profile
            ? `${profile.shopName} · ${profile.industrialArea}`
            : "إنشاء طلب توصيل"
        }
      />

      <div className="ui-app-frame space-y-4 px-4 py-5 sm:px-5">
        <div className="ui-glass grid grid-cols-2 gap-2 rounded-2xl p-1.5">
          <button
            type="button"
            onClick={() => setEntryMode("voice")}
            className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
              entryMode === "voice"
                ? "ui-btn-primary"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            طلب بالصوت
          </button>
          <button
            type="button"
            onClick={() => setEntryMode("form")}
            className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
              entryMode === "form"
                ? "ui-btn-primary"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            طلب كتابي
          </button>
        </div>

        {entryMode === "voice" ? (
          <VoiceOrderPanel
            onEditForm={goEditForm}
            onConfirmOrder={confirmAndSubmit}
          />
        ) : null}

        {(entryMode === "form" || formHighlight) && (
          <form
            onSubmit={onSubmit}
            className={`space-y-4 ${
              formHighlight ? "rounded-3xl ring-2 ring-red-700/60 ring-offset-2 ring-offset-[#0a1628]" : ""
            }`}
          >
            {entryMode === "form" && draft.pickup.shopName ? (
              <p className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-200">
                الحقول معبّأة من الصوت أو يدوياً — عدّل ثم أكّد الطلب.
              </p>
            ) : null}

        {/* Pickup */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="ui-glass rounded-3xl p-4 sm:p-5"
        >
          <h2 className="mb-3 text-lg font-bold text-[#e85a66]">نقطة الاستلام</h2>
          <div className="space-y-3">
            <input
              className={inputClass}
              placeholder="اسم محل الاستلام — مثال: محل طعمة"
              value={draft.pickup.shopName}
              onChange={(e) => setPickup({ shopName: e.target.value })}
            />
            <select
              className={inputClass}
              value={draft.pickup.area || ""}
              onChange={(e) => setPickup({ area: e.target.value })}
            >
              <option value="" className="bg-[#0a1628]">
                اختر المنطقة
              </option>
              {INDUSTRIAL_AREAS.map((a) => (
                <option key={a} value={a} className="bg-[#0a1628]">
                  {a}
                </option>
              ))}
            </select>

            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-300">
                صورة واجهة المحل / اللوحة (للسائق)
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickupPhoto}
                className="block w-full text-sm text-slate-300 file:ml-3 file:rounded-lg file:border-0 file:bg-red-700 file:px-3 file:py-2 file:font-semibold file:text-white"
              />
            </label>
            {draft.pickup.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.pickup.photoDataUrl}
                alt="صورة محل الاستلام"
                className="h-36 w-full rounded-2xl object-cover"
              />
            ) : null}
          </div>
        </motion.section>

        {/* Intermediate stops */}
        <section className="rounded-3xl border border-dashed border-[rgba(47,140,255,0.28)] bg-[rgba(47,140,255,0.06)] p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-red-300">
              توقفات في الطريق
            </h2>
            <button
              type="button"
              onClick={addStop}
              className="rounded-xl bg-red-700/20 px-3 py-2 text-sm font-semibold text-red-300 ring-1 ring-red-700/40"
            >
              + إضافة توقف في طريقك
            </button>
          </div>

          <AnimatePresence initial={false}>
            {draft.intermediateStops.map((stop, index) => (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628]/50 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-300">توقف {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeStop(stop.id)}
                    className="text-xs text-red-300"
                  >
                    حذف
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    className={inputClass}
                    placeholder="اسم المحل"
                    value={stop.shopName}
                    onChange={(e) =>
                      updateStop(stop.id, { shopName: e.target.value })
                    }
                  />
                  <select
                    className={inputClass}
                    value={stop.area}
                    onChange={(e) =>
                      updateStop(stop.id, { area: e.target.value })
                    }
                  >
                    <option value="" className="bg-[#0a1628]">
                      المنطقة
                    </option>
                    {INDUSTRIAL_AREAS.map((a) => (
                      <option key={a} value={a} className="bg-[#0a1628]">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {draft.intermediateStops.length === 0 ? (
            <p className="text-sm text-slate-400">
              لا توجد توقفات إضافية — مناسب لطلب استلام→تسليم واحد.
            </p>
          ) : null}
        </section>

        {/* Delivery */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="ui-glass rounded-3xl p-4 sm:p-5"
        >
          <h2 className="mb-3 text-lg font-bold text-[#e85a66]">نقطة التسليم</h2>
          <div className="space-y-3">
            <input
              className={inputClass}
              placeholder="اسم محل التسليم — مثال: محل سبانو"
              value={draft.delivery.shopName}
              onChange={(e) => setDelivery({ shopName: e.target.value })}
            />
            <select
              className={inputClass}
              value={draft.delivery.area || ""}
              onChange={(e) => setDelivery({ area: e.target.value })}
            >
              <option value="" className="bg-[#0a1628]">
                اختر المنطقة
              </option>
              {INDUSTRIAL_AREAS.map((a) => (
                <option key={a} value={a} className="bg-[#0a1628]">
                  {a}
                </option>
              ))}
            </select>
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-300">
                صورة محل التسليم (اختياري)
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onDeliveryPhoto}
                className="block w-full text-sm text-slate-300 file:ml-3 file:rounded-lg file:border-0 file:bg-red-700 file:px-3 file:py-2 file:font-semibold file:text-white"
              />
            </label>
            {draft.delivery.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.delivery.photoDataUrl}
                alt="صورة محل التسليم"
                className="h-36 w-full rounded-2xl object-cover"
              />
            ) : null}
            <textarea
              className={inputClass}
              rows={2}
              placeholder="ملاحظات خاصة للسائق (اختياري)"
              value={draft.specialNotes}
              onChange={(e) => updateDraft({ specialNotes: e.target.value })}
            />
          </div>
        </motion.section>

        {/* Package weight class */}
        <section className="ui-glass rounded-3xl p-4 sm:p-5">
          <h2 className="mb-3 text-lg font-bold text-[#e85a66]">وزن / نوع القطعة</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    id: "light" as const,
                    label: "أوزان خفيفة",
                    hint: "سلة صغيرة أو كبيرة",
                  },
                  {
                    id: "heavy" as const,
                    label: "أوزان ثقيلة",
                    hint: "تحتاج سلة كبيرة",
                  },
                ] as const
              ).map((s) => {
                const active = draft.packageSize === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      updateDraft({
                        packageSize: s.id,
                        packageType: "",
                      })
                    }
                    className={`rounded-xl px-2 py-3 text-center text-xs font-semibold transition ${
                      active
                        ? "ui-btn-primary shadow-[0_0_20px_rgba(47,140,255,0.25)]"
                        : "bg-[rgba(7,17,31,0.55)] text-slate-300 ring-1 ring-white/10"
                    }`}
                  >
                    <span className="block font-bold">{s.label}</span>
                    <span className="mt-1 block opacity-80">{s.hint}</span>
                  </button>
                );
              })}
            </div>
            <select
              className={inputClass}
              value={draft.packageType}
              onChange={(e) => updateDraft({ packageType: e.target.value })}
            >
              <option value="" className="bg-[#0a1628]">
                {draft.packageSize === "heavy"
                  ? "نوع القطعة الثقيلة"
                  : "نوع القطعة (اختياري)"}
              </option>
              {(draft.packageSize === "heavy"
                ? HEAVY_PACKAGE_TYPES
                : LIGHT_PACKAGE_TYPES
              ).map((t) => (
                <option key={t} value={t} className="bg-[#0a1628]">
                  {t}
                </option>
              ))}
            </select>
            {draft.packageSize === "heavy" ? (
              <p className="text-[11px] text-amber-200/80">
                الطلب الثقيل ما بيطلع إلا لسائقين بسلة كبيرة.
              </p>
            ) : null}
          </div>
        </section>

        {/* Speed */}
        <section className="ui-glass rounded-3xl p-4 sm:p-5">
          <h2 className="mb-3 text-lg font-bold text-[#e85a66]">سرعة التوصيل</h2>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { id: "standard" as const, label: "عادي", hint: "Standard" },
                { id: "vip" as const, label: "VIP مستعجل", hint: "Urgent" },
              ] as const
            ).map((opt) => {
              const active = draft.mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={`rounded-2xl px-3 py-4 text-center transition ${
                    active
                      ? "ui-btn-primary shadow-[0_0_28px_rgba(143,31,42,0.4)]"
                      : "bg-[rgba(7,17,31,0.55)] text-slate-300 ring-1 ring-white/10"
                  }`}
                >
                  <span className="block text-base font-bold">{opt.label}</span>
                  <span className="text-xs opacity-80">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Price preview */}
        <motion.section
          layout
          className="ui-glass-strong rounded-3xl border border-[rgba(143,31,42,0.35)] p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#e85a66]">معاينة السعر</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-300/90">
                {price.disclaimer}
              </p>
            </div>
            <motion.p
              key={price.total}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold text-sky-300"
            >
              {price.total.toLocaleString("ar-SY")}
            </motion.p>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-slate-300">
            <li className="flex justify-between">
              <span>أساس المناطق</span>
              <span>{price.baseAmount.toLocaleString("ar-SY")}</span>
            </li>
            <li className="flex justify-between">
              <span>إضافة VIP</span>
              <span>{price.modeSurcharge.toLocaleString("ar-SY")}</span>
            </li>
            <li className="flex justify-between">
              <span>توقفات إضافية</span>
              <span>{price.stopsSurcharge.toLocaleString("ar-SY")}</span>
            </li>
            <li className="text-xs text-slate-500">{price.currencyLabel}</li>
          </ul>
        </motion.section>

        <AnimatePresence>
          {errors.length > 0 ? (
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-red-700/40 bg-red-800/10 px-4 py-3 text-sm text-red-200"
            >
              {errors.map((err) => (
                <li key={err}>• {err}</li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={confirming}
          whileTap={{ scale: 0.98 }}
          className="ui-btn-primary w-full px-5 py-4 text-lg disabled:opacity-70"
        >
          {confirming ? "جارٍ تأكيد الطلب..." : "تأكيد الطلب وتتبع السائق"}
        </motion.button>
          </form>
        )}
      </div>
    </div>
  );
}
