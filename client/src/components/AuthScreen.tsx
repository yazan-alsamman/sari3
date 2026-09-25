"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandHeader } from "./BrandHeader";
import { INDUSTRIAL_AREAS } from "@/lib/demo-pricing";
import { useApp } from "@/lib/store";

/**
 * Customer auth — same demo pattern as driver:
 * - Register once (full shop profile + password)
 * - Later visits: name + password only
 * Accounts live in localStorage (not production auth / ADR-002).
 */
export function AuthScreen() {
  const { registerCustomer, loginCustomer } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [personalInfo, setPersonalInfo] = useState("");
  const [shopName, setShopName] = useState("");
  const [industrialArea, setIndustrialArea] = useState<string>(
    INDUSTRIAL_AREAS[0],
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    window.setTimeout(() => {
      if (mode === "login") {
        const r = loginCustomer({ fullName, password });
        if (!r.ok) setError(r.error);
        setSubmitting(false);
        return;
      }
      const r = registerCustomer({
        fullName,
        phone,
        password,
        personalInfo,
        shopName,
        industrialArea,
      });
      if (!r.ok) setError(r.error);
      setSubmitting(false);
    }, 280);
  }

  return (
    <div className="theme-locked-dark min-h-[100dvh]">
      <BrandHeader
        showBack
        subtitle={
          mode === "login"
            ? "دخول العميل — اسم + كلمة مرور"
            : "إنشاء حساب محل مرة واحدة"
        }
      />
      <motion.form
        initial={{ opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        onSubmit={onSubmit}
        className="ui-app-frame space-y-4 px-4 py-6"
      >
        <div className="ui-glass grid grid-cols-2 gap-2 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              mode === "login"
                ? "ui-btn-primary"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            دخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              mode === "register"
                ? "ui-btn-primary"
                : "text-slate-300 hover:bg-white/5"
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        <div className="ui-glass rounded-3xl p-5">
          <p className="mb-4 text-sm leading-relaxed text-slate-300">
            {mode === "login"
              ? "إذا عندكم حساب من قبل — الاسم الكامل + كلمة المرور كافية. ما في داعي تعبّوا المحل من جديد."
              : "مرة واحدة بس: اسم، موبايل، محل، منطقة، وكلمة مرور. المرات الجاية دخول سريع."}
          </p>

          <div className="space-y-4">
            <Field
              label="الاسم الكامل"
              value={fullName}
              onChange={setFullName}
              placeholder="مثال: محمد السبانو"
            />
            <Field
              label="كلمة المرور"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
            />

            <AnimatePresence initial={false}>
              {mode === "register" ? (
                <motion.div
                  key="reg-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <Field
                    label="رقم الموبايل"
                    value={phone}
                    onChange={setPhone}
                    placeholder="09xxxxxxxx"
                    type="tel"
                  />
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-200">
                      معلومات شخصية (اختياري)
                    </span>
                    <textarea
                      rows={3}
                      className="ui-input"
                      value={personalInfo}
                      placeholder="وصف مختصر عن المحل أو نوع القطع"
                      onChange={(e) => setPersonalInfo(e.target.value)}
                    />
                  </label>
                  <Field
                    label="اسم المحل الدائم"
                    value={shopName}
                    onChange={setShopName}
                    placeholder="محل سبانو"
                  />
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-200">
                      اسم المنطقة الصناعية
                    </span>
                    <select
                      className="ui-input"
                      value={industrialArea}
                      onChange={(e) => setIndustrialArea(e.target.value)}
                    >
                      {INDUSTRIAL_AREAS.map((area) => (
                        <option key={area} value={area} className="bg-[#0a1628]">
                          {area}
                        </option>
                      ))}
                    </select>
                  </label>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-amber-700/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
            {error}
          </p>
        ) : null}

        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.98 }}
          className="ui-btn-primary w-full px-5 py-4 text-lg disabled:opacity-70"
        >
          {submitting
            ? "جارٍ التحقق..."
            : mode === "login"
              ? "دخول ومتابعة للطلب"
              : "إنشاء الحساب ومتابعة للطلب"}
        </motion.button>

        <p className="text-center text-[11px] text-slate-500">
          تخزين محلي على الجهاز — مو سيرفر حقيقي (نفس أسلوب دخول السائق)
        </p>
      </motion.form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        className="ui-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={type === "password" ? "current-password" : "name"}
      />
    </label>
  );
}
