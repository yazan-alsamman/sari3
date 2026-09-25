"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PRICING_CONFIG,
  getPricingConfig,
  routeKey,
  savePricingConfig,
  subscribePricingConfig,
  type DemoPricingConfig,
} from "@/lib/demo-pricing-config";
import { INDUSTRIAL_AREAS } from "@/lib/demo-pricing-areas";
import { formatSyp } from "@/lib/demo-currency";
import type { DriverAccount } from "@/lib/driver-types";

function readDriverAccounts(): DriverAccount[] {
  try {
    const raw = localStorage.getItem("sareee-driver-accounts-v1");
    if (!raw) return [];
    return JSON.parse(raw) as DriverAccount[];
  } catch {
    return [];
  }
}

/**
 * Admin tab — edit demo delivery prices, default/per-driver shares, bonuses.
 * Demo only (ADR-006 / ADR-013 still PROPOSED).
 */
export function AdminPricingPanel() {
  const [cfg, setCfg] = useState<DemoPricingConfig>(() => getPricingConfig());
  const [accounts, setAccounts] = useState<DriverAccount[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [routeFrom, setRouteFrom] = useState<string>(INDUSTRIAL_AREAS[0]);
  const [routeTo, setRouteTo] = useState<string>(INDUSTRIAL_AREAS[1] ?? INDUSTRIAL_AREAS[0]);
  const [routePrice, setRoutePrice] = useState("25000");

  useEffect(() => {
    const sync = () => {
      setCfg(getPricingConfig());
      setAccounts(readDriverAccounts());
    };
    sync();
    return subscribePricingConfig(sync);
  }, []);

  const routeList = useMemo(
    () => Object.entries(cfg.routeOverrides).sort(([a], [b]) => a.localeCompare(b, "ar")),
    [cfg.routeOverrides],
  );

  function persist(next: DemoPricingConfig, note: string) {
    savePricingConfig(next);
    setCfg(getPricingConfig());
    setMsg(note);
    window.setTimeout(() => setMsg(null), 2500);
  }

  function setZone(area: string, value: string) {
    const n = Math.max(0, Math.round(Number(value) || 0));
    persist(
      { ...cfg, zoneBases: { ...cfg.zoneBases, [area]: n } },
      `تم حفظ سعر أساس «${area}»`,
    );
  }

  function addRoute() {
    const n = Math.max(0, Math.round(Number(routePrice) || 0));
    if (!n) return;
    const key = routeKey(routeFrom, routeTo);
    persist(
      {
        ...cfg,
        routeOverrides: { ...cfg.routeOverrides, [key]: n },
      },
      `تم حفظ مسار ${key}`,
    );
  }

  function removeRoute(key: string) {
    const next = { ...cfg.routeOverrides };
    delete next[key];
    persist({ ...cfg, routeOverrides: next }, "تم حذف المسار");
  }

  function setDriverShare(driverId: string, pct: string) {
    const rate = Math.min(100, Math.max(0, Number(pct) || 0)) / 100;
    const overrides = { ...cfg.driverShareOverrides };
    if (rate === cfg.defaultDriverShareRate) delete overrides[driverId];
    else overrides[driverId] = rate;
    persist({ ...cfg, driverShareOverrides: overrides }, "تم حفظ نسبة السائق");
  }

  function setDriverBonus(driverId: string, amount: string) {
    const n = Math.max(0, Math.round(Number(amount) || 0));
    const bonuses = { ...cfg.driverBonuses };
    if (n === 0) delete bonuses[driverId];
    else bonuses[driverId] = n;
    persist({ ...cfg, driverBonuses: bonuses }, "تم حفظ البونص");
  }

  function resetDefaults() {
    persist(structuredClone(DEFAULT_PRICING_CONFIG), "تمت إعادة القيم الافتراضية");
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">الأسعار والنسب</h2>
        <p className="mt-1 text-sm text-slate-400">
          تعديل أسعار التوصيل التجريبية، نسبة السائق الافتراضية، نسب خاصة وبونص لكل سائق.
          التغييرات تنعكس فوراً على معاينة سعر العميل وحصّة السائق (تخزين محلي).
        </p>
      </div>

      {msg ? (
        <p className="rounded-2xl border border-emerald-700/40 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-100">
          {msg}
        </p>
      ) : null}

      <div className="ui-glass rounded-3xl p-4 space-y-3">
        <h3 className="font-bold text-sky-200">أساس المناطق (ل.س.ج)</h3>
        <p className="text-xs text-slate-400">
          السعر الأساسي ≈ متوسط منطقتي الاستلام والتسليم (مع معامل بين المناطق إن لزم).
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[...INDUSTRIAL_AREAS, "أخرى"].map((area) => (
            <label key={area} className="block text-sm">
              <span className="text-slate-300">{area}</span>
              <input
                type="number"
                className="ui-input mt-1"
                value={cfg.zoneBases[area] ?? 0}
                onChange={(e) =>
                  setCfg((c) => ({
                    ...c,
                    zoneBases: { ...c.zoneBases, [area]: Number(e.target.value) },
                  }))
                }
                onBlur={(e) => setZone(area, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="ui-glass rounded-3xl p-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="text-slate-300">معامل بين منطقتين</span>
          <input
            type="number"
            step="0.01"
            className="ui-input mt-1"
            value={cfg.crossZoneMultiplier}
            onChange={(e) =>
              setCfg((c) => ({ ...c, crossZoneMultiplier: Number(e.target.value) }))
            }
            onBlur={() =>
              persist(cfg, "تم حفظ معامل المناطق")
            }
          />
        </label>
        <label className="text-sm">
          <span className="text-slate-300">إضافة VIP (نسبة من الأساس)</span>
          <input
            type="number"
            step="0.05"
            className="ui-input mt-1"
            value={cfg.vipSurchargeRate}
            onChange={(e) =>
              setCfg((c) => ({ ...c, vipSurchargeRate: Number(e.target.value) }))
            }
            onBlur={() => persist(cfg, "تم حفظ نسبة VIP")}
          />
          <span className="text-[11px] text-slate-500">
            مثال 0.4 = +40%
          </span>
        </label>
        <label className="text-sm">
          <span className="text-slate-300">سعر كل توقف إضافي</span>
          <input
            type="number"
            className="ui-input mt-1"
            value={cfg.perStop}
            onChange={(e) =>
              setCfg((c) => ({ ...c, perStop: Number(e.target.value) }))
            }
            onBlur={() => persist(cfg, "تم حفظ سعر التوقف")}
          />
        </label>
      </div>

      <div className="ui-glass rounded-3xl p-4 space-y-3">
        <h3 className="font-bold text-amber-200">مسارات ثابتة (من → إلى)</h3>
        <p className="text-xs text-slate-400">
          إذا حددت مسار، يستبدل متوسط المناطق كأساس قبل VIP والتوقفات.
        </p>
        <div className="grid gap-2 sm:grid-cols-4">
          <select
            className="ui-input"
            value={routeFrom}
            onChange={(e) => setRouteFrom(e.target.value)}
          >
            {INDUSTRIAL_AREAS.map((a) => (
              <option key={a} value={a}>
                من: {a}
              </option>
            ))}
          </select>
          <select
            className="ui-input"
            value={routeTo}
            onChange={(e) => setRouteTo(e.target.value)}
          >
            {INDUSTRIAL_AREAS.map((a) => (
              <option key={a} value={a}>
                إلى: {a}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="ui-input"
            value={routePrice}
            onChange={(e) => setRoutePrice(e.target.value)}
            placeholder="السعر"
          />
          <button type="button" className="ui-btn-primary py-2 text-sm" onClick={addRoute}>
            إضافة / تحديث
          </button>
        </div>
        <ul className="space-y-2">
          {routeList.length === 0 ? (
            <li className="text-sm text-slate-500">ما في مسارات ثابتة بعد</li>
          ) : (
            routeList.map(([key, price]) => (
              <li
                key={key}
                className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2 text-sm"
              >
                <span>
                  {key} · <strong>{formatSyp(price)}</strong>
                </span>
                <button
                  type="button"
                  className="text-xs text-red-300"
                  onClick={() => removeRoute(key)}
                >
                  حذف
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="ui-glass rounded-3xl p-4 space-y-3">
        <h3 className="font-bold text-emerald-200">نسبة السائقين والبونص</h3>
        <label className="block text-sm max-w-xs">
          <span className="text-slate-300">النسبة الافتراضية للسائق (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            className="ui-input mt-1"
            value={Math.round(cfg.defaultDriverShareRate * 100)}
            onChange={(e) =>
              setCfg((c) => ({
                ...c,
                defaultDriverShareRate: Number(e.target.value) / 100,
              }))
            }
            onBlur={() => persist(cfg, "تم حفظ النسبة الافتراضية")}
          />
          <span className="text-[11px] text-slate-500">
            الباقي للشركة · حالياً{" "}
            {Math.round((1 - cfg.defaultDriverShareRate) * 100)}%
          </span>
        </label>

        <div className="mt-3 space-y-2">
          {accounts.length === 0 ? (
            <p className="text-sm text-slate-500">
              ما في سائقين مسجّلين بعد — بعد إنشاء حساب سائق تظهر صفوف النسبة/البونص هنا.
            </p>
          ) : (
            accounts.map((a) => {
              const sharePct = Math.round(
                (cfg.driverShareOverrides[a.id] ?? cfg.defaultDriverShareRate) * 100,
              );
              const bonus = cfg.driverBonuses[a.id] ?? 0;
              return (
                <div
                  key={a.id}
                  className="grid gap-2 rounded-2xl border border-white/10 bg-black/15 p-3 sm:grid-cols-[1.2fr_1fr_1fr]"
                >
                  <div>
                    <p className="font-semibold text-white">{a.displayName}</p>
                    <p className="text-[11px] text-slate-500">{a.phone}</p>
                  </div>
                  <label className="text-xs text-slate-400">
                    نسبة خاصة %
                    <input
                      type="number"
                      className="ui-input mt-1 text-sm"
                      value={sharePct}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCfg((c) => ({
                          ...c,
                          driverShareOverrides: {
                            ...c.driverShareOverrides,
                            [a.id]: Number(v) / 100,
                          },
                        }));
                      }}
                      onBlur={(e) => setDriverShare(a.id, e.target.value)}
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    بونص لكل رحلة (ل.س.ج)
                    <input
                      type="number"
                      className="ui-input mt-1 text-sm"
                      value={bonus}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setCfg((c) => ({
                          ...c,
                          driverBonuses: { ...c.driverBonuses, [a.id]: v },
                        }));
                      }}
                      onBlur={(e) => setDriverBonus(a.id, e.target.value)}
                    />
                  </label>
                </div>
              );
            })
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={resetDefaults}
        className="ui-btn-ghost px-4 py-2 text-sm"
      >
        إعادة القيم الافتراضية التجريبية
      </button>
    </section>
  );
}
