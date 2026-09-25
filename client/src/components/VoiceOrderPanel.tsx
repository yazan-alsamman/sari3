"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  parseVoiceOrderTranscript,
  VOICE_ORDER_EXAMPLES,
  type ParsedVoiceOrder,
} from "@/lib/parse-voice-order";
import { calculateDemoPrice, INDUSTRIAL_AREAS } from "@/lib/demo-pricing";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useApp } from "@/lib/store";

interface VoiceOrderPanelProps {
  onEditForm: () => void;
  onConfirmOrder: () => void;
}

export function VoiceOrderPanel({
  onEditForm,
  onConfirmOrder,
}: VoiceOrderPanelProps) {
  const { applyParsedOrder, draft, setPickup, setDelivery, setMode } = useApp();
  const voice = useVoiceRecognition();
  const [parsed, setParsed] = useState<ParsedVoiceOrder | null>(null);
  const [phase, setPhase] = useState<"record" | "review">("record");
  const [info, setInfo] = useState<string | null>(null);

  const missing = useMemo(() => {
    const list: string[] = [];
    if (!draft.pickup.shopName.trim()) list.push("محل الاستلام");
    if (!draft.pickup.area.trim()) list.push("منطقة الاستلام");
    if (!draft.delivery.shopName.trim()) list.push("محل الوجهة");
    if (!draft.delivery.area.trim()) list.push("منطقة الوجهة");
    return list;
  }, [draft]);

  const complete = missing.length === 0;

  const price = useMemo(() => {
    if (phase !== "review") return null;
    return calculateDemoPrice({
      pickupArea: draft.pickup.area,
      deliveryArea: draft.delivery.area,
      mode: draft.mode,
      intermediateStopCount: draft.intermediateStops.length,
    });
  }, [phase, draft]);

  function convertToOrder(raw?: string) {
    const text = (raw ?? voice.getTranscript() ?? voice.finalText).trim();
    if (!text) {
      setInfo("سجّل أو اكتب جملة الطلب.");
      return;
    }
    voice.stop();
    const result = parseVoiceOrderTranscript(text);
    setParsed(result);
    applyParsedOrder(result);
    setPhase("review");
    setInfo(result.isComplete ? null : `ناقص: ${missingAfter(result)}`);
  }

  function missingAfter(result: ParsedVoiceOrder) {
    return result.missing.map((m) => m.label.replace(" ناقص", "").replace(" ناقصة", "")).join(" · ");
  }

  function onStop() {
    voice.stop();
    window.setTimeout(() => {
      convertToOrder(voice.getTranscript() || voice.finalText);
    }, 300);
  }

  return (
    <section className="ui-glass space-y-3 rounded-3xl p-4 sm:p-5">
      <h2 className="text-lg font-bold text-[#e85a66]">طلب بالصوت</h2>
      <p className="text-[11px] text-slate-400">
        {voice.runtime === "native"
          ? "وضع التطبيق الأصلي — المايك من النظام (أندرويد / آيفون)"
          : voice.runtime === "web"
            ? "وضع المتصفح — أفضل على Chrome أندرويد مع نت"
            : "اكتب الطلب إذا الصوت غير متاح"}
      </p>

      <div className="flex flex-wrap gap-2">
        {!voice.listening ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setPhase("record");
              setParsed(null);
              setInfo(null);
              voice.start();
            }}
            className="ui-btn-primary min-w-[130px] flex-1 px-4 py-3.5 text-sm"
          >
            تسجيل
          </motion.button>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onStop}
            className="min-w-[130px] flex-1 rounded-2xl border border-red-500/60 bg-red-900/40 px-4 py-3.5 text-sm font-bold text-red-100"
          >
            <span className="inline-flex items-center gap-2">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="h-2.5 w-2.5 rounded-full bg-red-400"
              />
              إيقاف
            </span>
          </motion.button>
        )}
        <button
          type="button"
          onClick={() => convertToOrder()}
          className="ui-btn-ghost min-w-[130px] flex-1 px-4 py-3.5 text-sm font-semibold"
        >
          حوّل لطلب
        </button>
      </div>

      {voice.status ? (
        <p className="text-center text-xs text-emerald-300">{voice.status}</p>
      ) : null}
      {voice.tip || voice.runtime === "none" ? (
        <div className="rounded-2xl border border-amber-600/45 bg-amber-950/35 px-3 py-3 text-xs leading-relaxed text-amber-50">
          <p className="font-bold text-amber-100">ما قدرنا نكمّل بالصوت؟</p>
          <p className="mt-1 text-amber-100/90">
            {voice.tip ||
              "التعرف الصوتي غير متاح هون. استخدموا «جرّب هالمثال» تحت أو اكتبوا الجملة بالمربع."}
          </p>
          <ul className="mt-2 list-disc space-y-1 pr-4 text-amber-100/80">
            <li>اسمحوا للمايك من إعدادات المتصفح / التطبيق</li>
            <li>على الويب: Chrome مع إنترنت أفضل</li>
            <li>أو اضغطوا مثال جاهز يملّي الطلب فوراً</li>
          </ul>
        </div>
      ) : null}

      <textarea
        rows={3}
        value={voice.listening ? voice.displayText : voice.finalText}
        onChange={(e) => {
          voice.setTranscriptManual(e.target.value);
          setPhase("record");
          setParsed(null);
        }}
        placeholder="من محل … في … إلى محل … في …"
        className="ui-input text-sm"
        dir="rtl"
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300">
          أمثلة جاهزة — اضغطوا يملّي ويحوّل لطلب:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {VOICE_ORDER_EXAMPLES.map((ex, i) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                voice.stop();
                voice.setTranscriptManual(ex);
                convertToOrder(ex);
              }}
              className="rounded-2xl border border-sky-500/30 bg-sky-950/25 px-3 py-3 text-right transition hover:border-sky-400/50 hover:bg-sky-900/30"
            >
              <span className="mb-1 block text-[11px] font-bold text-sky-300">
                جرّب هالمثال {i + 1}
              </span>
              <span className="line-clamp-3 text-xs leading-relaxed text-slate-200">
                {ex}
              </span>
            </button>
          ))}
        </div>
      </div>

      {info ? (
        <p className="text-xs text-amber-200">{info}</p>
      ) : null}

      <AnimatePresence>
        {phase === "review" && parsed ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3 rounded-2xl border border-emerald-700/40 bg-emerald-950/25 p-4"
          >
            <ul className="space-y-1 text-sm text-slate-200">
              <li>
                من: {draft.pickup.shopName || "—"} — {draft.pickup.area || "؟"}
              </li>
              {draft.intermediateStops.map((s, i) => (
                <li key={s.id}>
                  توقف {i + 1}: {s.shopName || "؟"} — {s.area || "؟"}
                </li>
              ))}
              <li>
                إلى: {draft.delivery.shopName || "—"} —{" "}
                {draft.delivery.area || "؟"}
              </li>
              <li>{draft.mode === "vip" ? "VIP" : "عادي"}</li>
              {price ? (
                <li className="text-red-300">
                  {price.total.toLocaleString("ar-SY")}
                </li>
              ) : null}
            </ul>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("standard")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold ${
                  draft.mode === "standard"
                    ? "bg-red-900 text-white"
                    : "bg-black/20 text-slate-400"
                }`}
              >
                عادي
              </button>
              <button
                type="button"
                onClick={() => setMode("vip")}
                className={`flex-1 rounded-xl py-2 text-xs font-bold ${
                  draft.mode === "vip"
                    ? "bg-red-900 text-white"
                    : "bg-black/20 text-slate-400"
                }`}
              >
                VIP
              </button>
            </div>

            {!complete ? (
              <div className="space-y-2">
                <p className="text-xs text-amber-200">ناقص: {missing.join(" · ")}</p>
                {(!draft.pickup.area.trim() || !draft.delivery.area.trim()) && (
                  <div className="flex flex-wrap gap-1.5">
                    {INDUSTRIAL_AREAS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          if (!draft.pickup.area.trim()) setPickup({ area: a });
                          else if (!draft.delivery.area.trim())
                            setDelivery({ area: a });
                        }}
                        className="rounded-full bg-amber-900/50 px-2.5 py-1 text-[11px] text-amber-100"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
                {!draft.pickup.shopName.trim() ? (
                  <input
                    placeholder="محل الاستلام"
                    className="w-full rounded-xl border border-amber-800/40 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v)
                        setPickup({
                          shopName: v.startsWith("محل") ? v : `محل ${v}`,
                        });
                    }}
                  />
                ) : null}
                {!draft.delivery.shopName.trim() ? (
                  <input
                    placeholder="محل الوجهة"
                    className="w-full rounded-xl border border-amber-800/40 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v)
                        setDelivery({
                          shopName: v.startsWith("محل") ? v : `محل ${v}`,
                        });
                    }}
                  />
                ) : null}
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onEditForm}
                className="ui-btn-ghost flex-1 py-3 text-sm font-semibold"
              >
                تعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!complete) {
                    setInfo(`ناقص: ${missing.join(" · ")}`);
                    return;
                  }
                  onConfirmOrder();
                }}
                disabled={!complete}
                className="ui-btn-primary flex-1 py-3 text-sm disabled:opacity-40"
              >
                تأكيد الطلب
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
