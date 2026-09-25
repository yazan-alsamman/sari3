"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useDriver } from "@/lib/driver-store";
import { BASKET_SIZES, type BasketSize } from "@/lib/demo-capacity";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DriverAuthScreen({ onBack }: { onBack: () => void }) {
  const { register, login } = useDriver();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [idPhotoDataUrl, setIdPhotoDataUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [motorcycleModel, setMotorcycleModel] = useState("");
  const [basketSize, setBasketSize] = useState<BasketSize | "">("");
  const [capacityNote, setCapacityNote] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onIdPhoto(file: File | null) {
    if (!file) {
      setIdPhotoDataUrl(null);
      return;
    }
    try {
      setIdPhotoDataUrl(await fileToDataUrl(file));
    } catch {
      setError("ما قدرنا نقرأ صورة الهوية");
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "login") {
      const r = login({ displayName, password });
      if (!r.ok) setError(r.error);
      return;
    }
    if (!basketSize) {
      setError("اختاروا حجم السلة");
      return;
    }
    const r = register({
      firstName,
      lastName,
      birthDate,
      idPhotoDataUrl: idPhotoDataUrl ?? "",
      phone,
      password,
      vehicle: {
        motorcycleModel,
        basketSize,
        capacityNote,
        basketInfo: "",
        plateNumber,
      },
    });
    if (!r.ok) setError(r.error);
  }

  return (
    <section className="theme-locked-dark ui-app-frame flex min-h-[100dvh] flex-col px-4 py-6 sm:px-5">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 self-start text-sm text-slate-400 hover:text-sky-300"
      >
        ← رجوع
      </button>

      <h1
        className="font-display text-3xl font-bold sm:text-4xl"
        style={{
          backgroundImage: "linear-gradient(100deg, #f8c4c8, #e85a66 50%, #7eb6ff)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        دخول السائق
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        إنشاء الحساب مرة: هوية + موتور + حجم السلة والسعة — بعدين اسم + كلمة مرور.
        الحساب الجديد بانتظار موافقة الأدمن.
      </p>

      <div className="ui-glass mt-5 grid grid-cols-2 gap-2 rounded-2xl p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-xl py-2.5 text-sm font-semibold transition ${
            mode === "login" ? "ui-btn-primary" : "text-slate-300 hover:bg-white/5"
          }`}
        >
          دخول
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-xl py-2.5 text-sm font-semibold transition ${
            mode === "register" ? "ui-btn-primary" : "text-slate-300 hover:bg-white/5"
          }`}
        >
          إنشاء حساب
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-3 pb-8">
        {mode === "login" ? (
          <Field
            label="اسم السائق (الاسم والكنية)"
            value={displayName}
            onChange={setDisplayName}
            placeholder="مثل: أحمد معروف"
          />
        ) : (
          <>
            <Field
              label="الاسم"
              value={firstName}
              onChange={setFirstName}
              placeholder="أحمد"
            />
            <Field
              label="الكنية"
              value={lastName}
              onChange={setLastName}
              placeholder="معروف"
            />
            <Field
              label="تاريخ الميلاد"
              value={birthDate}
              onChange={setBirthDate}
              type="date"
            />
            <label className="block space-y-1">
              <span className="text-xs text-slate-400">صورة الهوية (إلزامي)</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="ui-input text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-red-900 file:px-3 file:py-1 file:text-xs file:text-white"
                onChange={(e) => void onIdPhoto(e.target.files?.[0] ?? null)}
              />
              {idPhotoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={idPhotoDataUrl}
                  alt="معاينة الهوية"
                  className="mt-2 h-28 w-full rounded-2xl object-cover"
                />
              ) : null}
            </label>
            <Field
              label="رقم الهاتف"
              value={phone}
              onChange={setPhone}
              placeholder="09xxxxxxxx"
              inputMode="tel"
            />
          </>
        )}

        <Field
          label="كلمة المرور"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          type="password"
        />

        {mode === "register" ? (
          <div className="ui-panel space-y-3 p-3 sm:p-4">
            <p className="text-xs font-semibold text-slate-300">
              معلومات الموتور والسلة (مرة عند إنشاء الحساب)
            </p>
            <Field
              label="نوع / موديل الموتور"
              value={motorcycleModel}
              onChange={setMotorcycleModel}
              placeholder="مثل: هوندا 125"
            />
            <div className="space-y-2">
              <p className="text-xs text-slate-400">حجم السلة (إلزامي)</p>
              <div className="grid grid-cols-2 gap-2">
                {BASKET_SIZES.map((b) => {
                  const active = basketSize === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBasketSize(b.id)}
                      className={`rounded-xl px-2 py-3 text-center text-xs font-semibold transition ${
                        active
                          ? "ui-btn-primary"
                          : "bg-black/25 text-slate-300 ring-1 ring-white/10"
                      }`}
                    >
                      <span className="block font-bold">{b.label}</span>
                      <span className="mt-1 block opacity-80">{b.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Field
              label="السعة القادرين تتحملوها"
              value={capacityNote}
              onChange={setCapacityNote}
              placeholder="مثل: حتى 25 كغ / قطعتين متوسطات"
            />
            <Field
              label="رقم النمرة"
              value={plateNumber}
              onChange={setPlateNumber}
              placeholder="دمشق · د xxxxx"
            />
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-amber-700/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
            {error}
          </p>
        ) : null}

        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          className="ui-btn-primary w-full py-3.5 text-base"
        >
          {mode === "login" ? "دخول" : "إرسال طلب الانضمام"}
        </motion.button>
      </form>

      <p className="mt-2 text-center text-[11px] text-slate-500">
        تخزين محلي للتجربة فقط — مو حساب سيرفر حقيقي (ADR-002)
      </p>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-slate-400">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ui-input text-sm"
      />
    </label>
  );
}
