"use client";

import { useDriver } from "@/lib/driver-store";
import { formatSyp, DEMO_CURRENCY_NAME } from "@/lib/demo-currency";

export function DriverDayEndScreen() {
  const { dayTrips, clearDayAndContinue, setStep, account } = useDriver();
  const total = dayTrips.reduce((s, t) => s + t.earningsAmount, 0);

  return (
    <section className="ui-app-frame flex min-h-[100dvh] flex-col px-4 py-6 sm:px-5">
      <h1
        className="font-display text-3xl font-bold sm:text-4xl"
        style={{
          backgroundImage: "linear-gradient(100deg, #f8c4c8, #e85a66 50%, #7eb6ff)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        جرد اليوم
      </h1>
      <p className="mt-1 text-sm text-slate-400">
        {account?.displayName} · ملخص الطلبات · {DEMO_CURRENCY_NAME}
      </p>

      <div className="ui-glass mt-5 rounded-3xl border border-emerald-700/30 p-4 sm:p-5">
        <p className="text-xs text-emerald-200/80">عدد الطلبات</p>
        <p className="text-3xl font-bold text-emerald-300">{dayTrips.length}</p>
        <p className="mt-2 text-xs text-emerald-200/80">حصة السائق اليوم</p>
        <p className="text-2xl font-bold text-white">{formatSyp(total)}</p>
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto pb-4">
        {dayTrips.length === 0 ? (
          <p className="ui-panel p-4 text-sm text-slate-400">
            ما في طلبات مكتملة اليوم بعد.
          </p>
        ) : (
          dayTrips.map((t) => (
            <div key={t.id} className="ui-glass rounded-2xl px-3 py-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white">{t.orderNumber}</span>
                <span className="text-emerald-300">{formatSyp(t.earningsAmount)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {t.customerName} · {t.pickupArea} → {t.deliveryArea}
                {t.mode === "vip" ? " · VIP" : ""}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setStep("home")}
          className="ui-btn-ghost py-3.5 text-sm font-semibold"
        >
          رجوع للعمل
        </button>
        <button
          type="button"
          onClick={clearDayAndContinue}
          className="ui-btn-primary py-3.5 text-sm"
        >
          تصفير الجرد وبدء يوم جديد
        </button>
      </div>
    </section>
  );
}
