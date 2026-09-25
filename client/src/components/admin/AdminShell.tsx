"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEMO_ADMIN_PASSWORD,
  DEMO_ADMIN_SESSION_KEY,
  DEMO_ADMIN_USERNAME,
  DEMO_BAD_RATING_MAX_STARS,
  getDriverShareRate,
} from "@/lib/demo-admin-config";
import {
  acknowledgeAlert,
  acknowledgeAllAlerts,
  endOfDayInventory,
  filterLedgerByPeriod,
  getAdminOpsSnapshot,
  listPendingDriverJoins,
  searchAdminOrders,
  setDriverApproval,
  subscribeAdminOps,
  summarizeLedger,
  type AdminOpsSnapshot,
  type FinancePeriod,
} from "@/lib/demo-admin-ops";
import { formatSyp, DEMO_CURRENCY_FULL } from "@/lib/demo-currency";
import type { DriverAccount } from "@/lib/driver-types";
import { AdminCustomersPanel } from "./AdminCustomersPanel";
import { AdminLiveMapDynamic } from "./AdminLiveMapDynamic";
import { AdminPricingPanel } from "./AdminPricingPanel";
import { EmptyState } from "@/components/EmptyState";

type Tab =
  | "live"
  | "drivers"
  | "customers"
  | "orders"
  | "finance"
  | "pricing"
  | "ratings"
  | "alerts"
  | "day_end";

type LiveFilter = "all" | "active" | "rest";

const TABS: { id: Tab; label: string }[] = [
  { id: "live", label: "الخريطة" },
  { id: "drivers", label: "السائقين" },
  { id: "customers", label: "العملاء" },
  { id: "orders", label: "الطلبات" },
  { id: "finance", label: "الحسابات" },
  { id: "pricing", label: "الأسعار" },
  { id: "ratings", label: "التقييمات" },
  { id: "alerts", label: "التنبيهات" },
  { id: "day_end", label: "جرد اليوم" },
];

function fmtMoney(n: number) {
  return formatSyp(n);
}

function liveStatusLabel(availability: string): string {
  if (availability === "available") return "فعّال الآن";
  if (availability === "busy") return "برحلة";
  return "مطفي / استراحة";
}

function readDriverAccounts(): DriverAccount[] {
  try {
    const raw = localStorage.getItem("sareee-driver-accounts-v1");
    if (!raw) return [];
    return JSON.parse(raw) as DriverAccount[];
  } catch {
    return [];
  }
}

function PendingJoinsPanel({
  pending,
  onApprove,
  onReject,
}: {
  pending: ReturnType<typeof listPendingDriverJoins>;
  onApprove: (id: string, name: string, phone?: string) => void;
  onReject: (id: string, name?: string) => void;
}) {
  if (pending.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-700/40 bg-amber-950/30 p-4">
      <h3 className="font-bold text-amber-100">
        طلبات انضمام للفريق ({pending.length})
      </h3>
      <p className="mt-1 text-xs text-amber-200/80">
        وافقوا ليقدر السائق يبلّش الشغل، أو ارفضوا الطلب.
      </p>
      <ul className="mt-3 space-y-2">
        {pending.map((d) => (
          <li
            key={d.driverId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2"
          >
            <div>
              <p className="font-semibold text-white">{d.displayName}</p>
              <p className="text-xs text-slate-400">
                {[
                  d.phone,
                  d.motorcycleModel,
                  d.plateNumber,
                  d.basketSize === "large"
                    ? "سلة كبيرة"
                    : d.basketSize === "small"
                      ? "سلة صغيرة"
                      : undefined,
                  d.capacityNote,
                ]
                  .filter(Boolean)
                  .join(" · ") || d.driverId}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onApprove(d.driverId, d.displayName, d.phone)}
                className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold"
              >
                موافقة وبدء العمل
              </button>
              <button
                type="button"
                onClick={() => onReject(d.driverId, d.displayName)}
                className="rounded-xl border border-red-700/50 px-3 py-2 text-xs text-red-200"
              >
                رفض
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminLogin({ onOk }: { onOk: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (user.trim() === DEMO_ADMIN_USERNAME && pass === DEMO_ADMIN_PASSWORD) {
      sessionStorage.setItem(DEMO_ADMIN_SESSION_KEY, "1");
      onOk();
      return;
    }
    setError("يوزر أو باسورد غلط");
  }

  return (
    <section className="theme-locked-dark ui-app-frame flex min-h-[100dvh] flex-col justify-center px-5 py-10">
      <div className="ui-glass-strong rounded-3xl p-6 sm:p-8">
        <h1
          className="font-display text-3xl font-bold sm:text-4xl"
          style={{
            backgroundImage:
              "linear-gradient(100deg, #f8c4c8, #e85a66 50%, #7eb6ff)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          لوحة الأدمن
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          دخول محمي — مو ظاهر كزر للعامة. من المتصفح:{" "}
          <span className="text-slate-200">/admin</span> أو{" "}
          <span className="text-slate-200">#admin</span>. من التطبيق: اضغطوا مطوّلاً على
          اسم «سريع حوش بلاس» حوالي ثانيتين ونص.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-3">
          <label className="block text-sm text-slate-300">
            اليوزر
            <input
              className="ui-input mt-1"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block text-sm text-slate-300">
            كلمة المرور
            <input
              type="password"
              className="ui-input mt-1"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button type="submit" className="ui-btn-primary w-full py-3.5 text-base">
            دخول الأدمن
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] text-slate-500">
          نموذج واجهات — بدون backend حقيقي · نسب تجريبية 75%/25% · إنذار ≤{" "}
          {DEMO_BAD_RATING_MAX_STARS} نجوم
        </p>
      </div>
    </section>
  );
}

export function AdminShell({ onExit }: { onExit?: () => void }) {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("live");
  const [ops, setOps] = useState<AdminOpsSnapshot>(() => getAdminOpsSnapshot());
  const [accounts, setAccounts] = useState<DriverAccount[]>([]);
  const [driverQuery, setDriverQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const [financePeriod, setFinancePeriod] = useState<FinancePeriod>("day");
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [liveFilter, setLiveFilter] = useState<LiveFilter>("all");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [financeDriverQuery, setFinanceDriverQuery] = useState("");
  const [inventoryQuery, setInventoryQuery] = useState("");

  useEffect(() => {
    setAuthed(sessionStorage.getItem(DEMO_ADMIN_SESSION_KEY) === "1");
  }, []);

  /** Admin dashboard is always dark — light theme overrides break ops UI. */
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute("data-theme");
    html.setAttribute("data-theme", "dark");
    html.classList.add("dark");
    html.classList.remove("light");
    return () => {
      if (prev === "light" || prev === "dark") {
        html.setAttribute("data-theme", prev);
        html.classList.toggle("dark", prev === "dark");
        html.classList.toggle("light", prev === "light");
      }
    };
  }, []);

  useEffect(() => {
    if (!authed) return;
    const refresh = () => {
      setOps(getAdminOpsSnapshot());
      setAccounts(readDriverAccounts());
    };
    refresh();
    const unsub = subscribeAdminOps(refresh);
    const t = window.setInterval(refresh, 1000);
    return () => {
      unsub();
      window.clearInterval(t);
    };
  }, [authed]);

  const openAlerts = ops.alerts.filter((a) => !a.acknowledged);
  const pendingJoins = listPendingDriverJoins();
  const pendingJoinCount = pendingJoins.length;

  const filteredDrivers = useMemo(() => {
    const q = driverQuery.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        (a.vehicle?.plateNumber ?? "").toLowerCase().includes(q),
    );
  }, [accounts, driverQuery]);

  const selectedDriver = accounts.find((a) => a.id === selectedDriverId) ?? null;

  const driverStats = useMemo(() => {
    if (!selectedDriver) return null;
    const all = ops.ledger.filter((e) => e.driverId === selectedDriver.id);
    return {
      day: summarizeLedger(filterLedgerByPeriod(all, "day")),
      week: summarizeLedger(filterLedgerByPeriod(all, "week")),
      month: summarizeLedger(filterLedgerByPeriod(all, "month")),
      year: summarizeLedger(filterLedgerByPeriod(all, "year")),
      trips: all,
    };
  }, [selectedDriver, ops.ledger]);

  const orderResults = useMemo(
    () => searchAdminOrders(ops.orders ?? [], orderQuery),
    [ops.orders, orderQuery],
  );

  const financeRows = useMemo(() => {
    const entries = filterLedgerByPeriod(ops.ledger ?? [], financePeriod);
    return { entries, summary: summarizeLedger(entries) };
  }, [ops.ledger, financePeriod]);

  const dayInventory = useMemo(
    () => endOfDayInventory(ops.orders ?? []),
    [ops.orders],
  );

  const dayInventoryFiltered = useMemo(
    () => searchAdminOrders(dayInventory, inventoryQuery),
    [dayInventory, inventoryQuery],
  );

  const financeDriverMatches = useMemo(() => {
    const q = financeDriverQuery.trim().toLowerCase();
    if (!q) return [] as DriverAccount[];
    return accounts.filter(
      (a) =>
        a.displayName.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        (a.vehicle?.plateNumber ?? "").toLowerCase().includes(q),
    );
  }, [accounts, financeDriverQuery]);

  const financeDriverFocus = useMemo(() => {
    if (financeDriverMatches.length === 1) return financeDriverMatches[0]!;
    if (
      selectedDriverId &&
      financeDriverMatches.some((a) => a.id === selectedDriverId)
    ) {
      return accounts.find((a) => a.id === selectedDriverId) ?? null;
    }
    return financeDriverMatches[0] ?? null;
  }, [financeDriverMatches, selectedDriverId, accounts]);

  const financeDriverLedger = useMemo(() => {
    if (!financeDriverFocus) return null;
    const all = ops.ledger.filter((e) => e.driverId === financeDriverFocus.id);
    const day = filterLedgerByPeriod(all, "day");
    const week = filterLedgerByPeriod(all, "week");
    const month = filterLedgerByPeriod(all, "month");
    return {
      all,
      day: { entries: day, summary: summarizeLedger(day) },
      week: { entries: week, summary: summarizeLedger(week) },
      month: { entries: month, summary: summarizeLedger(month) },
    };
  }, [financeDriverFocus, ops.ledger]);

  const liveDrivers = useMemo(() => {
    const list = ops.presence.filter((p) => p.approvalStatus === "approved");
    if (liveFilter === "active") {
      return list.filter(
        (p) => p.availability === "available" || p.availability === "busy",
      );
    }
    if (liveFilter === "rest") {
      return list.filter((p) => p.availability === "offline");
    }
    return list;
  }, [ops.presence, liveFilter]);

  const liveCounts = useMemo(() => {
    const approved = ops.presence.filter((p) => p.approvalStatus === "approved");
    return {
      active: approved.filter(
        (p) => p.availability === "available" || p.availability === "busy",
      ).length,
      rest: approved.filter((p) => p.availability === "offline").length,
      all: approved.length,
    };
  }, [ops.presence]);

  function logout() {
    sessionStorage.removeItem(DEMO_ADMIN_SESSION_KEY);
    setAuthed(false);
    onExit?.();
  }

  function approve(id: string, name: string, phone?: string) {
    const result = setDriverApproval(id, "approved", {
      displayName: name,
      phone,
    });
    setOps(getAdminOpsSnapshot());
    setAccounts(readDriverAccounts());
    if (result.ok) {
      setActionMsg(`تمت الموافقة على «${name}» — يقدر يبلّش الشغل`);
    } else {
      setActionMsg(result.error);
    }
    window.setTimeout(() => setActionMsg(null), 4000);
  }

  function reject(id: string, name?: string) {
    const result = setDriverApproval(id, "rejected", { displayName: name });
    setOps(getAdminOpsSnapshot());
    setAccounts(readDriverAccounts());
    setActionMsg(result.ok ? `تم رفض «${name ?? id}»` : result.error);
    window.setTimeout(() => setActionMsg(null), 4000);
  }

  function suspend(id: string) {
    const result = setDriverApproval(id, "suspended");
    setOps(getAdminOpsSnapshot());
    setAccounts(readDriverAccounts());
    setActionMsg(result.ok ? "تم تعليق الحساب" : result.error);
    window.setTimeout(() => setActionMsg(null), 4000);
  }

  if (!authed) {
    return (
      <div className="theme-locked-dark relative min-h-[100dvh]">
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="absolute left-4 top-4 z-40 rounded-xl border border-white/15 px-3 py-2 text-xs text-slate-300"
          >
            رجوع
          </button>
        ) : null}
        <AdminLogin onOk={() => setAuthed(true)} />
      </div>
    );
  }

  return (
    <div className="theme-locked-dark min-h-[100dvh] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 ui-glass-strong backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs text-slate-400">سريع حوش بلاس · عمليات</p>
            <h1 className="font-display text-xl font-bold sm:text-2xl"
              style={{
                backgroundImage:
                  "linear-gradient(100deg, #f8c4c8, #e85a66 45%, #7eb6ff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              داشبورد الأدمن
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {openAlerts.length > 0 ? (
              <span className="rounded-full bg-red-700 px-2.5 py-1 text-xs font-bold">
                {openAlerts.length} تنبيه
              </span>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs text-slate-300"
            >
              خروج
            </button>
          </div>
        </div>
        {/* Mobile: one select — less crowded. Desktop: chip row. */}
        <div className="mx-auto max-w-6xl px-3 pb-3">
          <label className="mb-2 block text-[11px] text-slate-400 md:hidden">
            القسم
            <select
              className="ui-input mt-1 text-sm"
              value={tab}
              onChange={(e) => setTab(e.target.value as Tab)}
            >
              {TABS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                  {t.id === "alerts" && openAlerts.length
                    ? ` (${openAlerts.length})`
                    : ""}
                  {t.id === "drivers" && pendingJoinCount
                    ? ` · ${pendingJoinCount} جديد`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <nav className="hidden gap-1 overflow-x-auto md:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${
                  tab === t.id
                    ? "bg-red-900 text-white"
                    : "border border-white/10 text-slate-300"
                }`}
              >
                {t.label}
                {t.id === "alerts" && openAlerts.length
                  ? ` (${openAlerts.length})`
                  : ""}
                {t.id === "drivers" && pendingJoinCount
                  ? ` · ${pendingJoinCount} جديد`
                  : ""}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-5">
        {actionMsg ? (
          <p className="rounded-2xl border border-emerald-700/40 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
            {actionMsg}
          </p>
        ) : null}
        <PendingJoinsPanel
          pending={pendingJoins}
          onApprove={approve}
          onReject={reject}
        />

        {tab === "live" ? (
          <section>
            <h2 className="text-lg font-bold text-white">مواقع السائقين المباشرة</h2>
            <p className="mt-1 text-sm text-slate-400">
              تظهر حتى لو واقفين أو باستراحة — يتحدّث من جلسة السائق (نفس المتصفح/الجهاز).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["all", `الكل (${liveCounts.all})`],
                  ["active", `فعّالين الآن (${liveCounts.active})`],
                  ["rest", `مطفي / استراحة (${liveCounts.rest})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLiveFilter(id)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    liveFilter === id
                      ? "bg-red-900 text-white"
                      : "border border-white/10 text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4 h-[55vh] min-h-[320px] overflow-hidden rounded-2xl border border-white/10">
              <AdminLiveMapDynamic drivers={liveDrivers} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-3">
                <p className="text-xs font-bold text-emerald-300">فعّالين الآن</p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
                  {ops.presence.filter(
                    (p) =>
                      p.approvalStatus === "approved" &&
                      (p.availability === "available" || p.availability === "busy"),
                  ).length === 0 ? (
                    <li>
                      <EmptyState
                        title="ما في أحد أونلاين"
                        body="السائق لازم يكون معتمد و«متاح للعمل» من نفس المتصفح."
                        tone="wait"
                      />
                    </li>
                  ) : (
                    ops.presence
                      .filter(
                        (p) =>
                          p.approvalStatus === "approved" &&
                          (p.availability === "available" ||
                            p.availability === "busy"),
                      )
                      .map((p) => (
                        <li key={p.driverId} className="text-slate-200">
                          {p.displayName} · {liveStatusLabel(p.availability)}
                          {p.activeOrderNumber
                            ? ` · ${p.activeOrderNumber}`
                            : ""}
                        </li>
                      ))
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-600/40 bg-slate-900/40 p-3">
                <p className="text-xs font-bold text-slate-300">مطفي / استراحة</p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
                  {ops.presence.filter(
                    (p) =>
                      p.approvalStatus === "approved" &&
                      p.availability === "offline",
                  ).length === 0 ? (
                    <li className="text-slate-500">ما في أحد باستراحة</li>
                  ) : (
                    ops.presence
                      .filter(
                        (p) =>
                          p.approvalStatus === "approved" &&
                          p.availability === "offline",
                      )
                      .map((p) => (
                        <li key={p.driverId} className="text-slate-300">
                          {p.displayName} · {p.phone}
                        </li>
                      ))
                  )}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {tab === "drivers" ? (
          <section className="space-y-4">
            <input
              value={driverQuery}
              onChange={(e) => setDriverQuery(e.target.value)}
              placeholder="بحث باسم السائق أو رقمه أو النمرة..."
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm outline-none focus:border-red-700"
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
                {filteredDrivers.map((d) => {
                  const st = ops.approvals[d.id] ?? d.approvalStatus ?? "approved";
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedDriverId(d.id)}
                        className={`w-full rounded-2xl border px-3 py-3 text-right text-sm ${
                          selectedDriverId === d.id
                            ? "border-red-700 bg-red-950/40"
                            : "border-white/10 bg-white/5"
                        }`}
                      >
                        <p className="font-bold text-white">{d.displayName}</p>
                        <p className="text-xs text-slate-400">
                          {d.phone} · {st}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {!selectedDriver || !driverStats ? (
                  <p className="text-sm text-slate-400">
                    اختاروا سائق لعرض طلبات اليوم / الأسبوع / الشهر والنسب.
                  </p>
                ) : (
                  <>
                    <h3 className="font-display text-lg font-bold text-white">
                      {selectedDriver.displayName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedDriver.phone} ·{" "}
                      {selectedDriver.vehicle?.motorcycleModel ?? "—"} ·{" "}
                      {selectedDriver.vehicle?.plateNumber ?? "—"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          approve(selectedDriver.id, selectedDriver.displayName)
                        }
                        className="rounded-xl bg-emerald-800 px-3 py-1.5 text-xs"
                      >
                        اعتماد
                      </button>
                      <button
                        type="button"
                        onClick={() => suspend(selectedDriver.id)}
                        className="rounded-xl border border-amber-600/40 px-3 py-1.5 text-xs text-amber-100"
                      >
                        تعليق
                      </button>
                      <button
                        type="button"
                        onClick={() => reject(selectedDriver.id)}
                        className="rounded-xl border border-red-700/40 px-3 py-1.5 text-xs text-red-200"
                      >
                        رفض
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      {(
                        [
                          ["اليوم", driverStats.day],
                          ["الأسبوع", driverStats.week],
                          ["الشهر", driverStats.month],
                          ["السنة", driverStats.year],
                        ] as const
                      ).map(([label, s]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-white/10 bg-black/20 p-3"
                        >
                          <p className="text-xs text-slate-400">{label}</p>
                          <p className="font-bold text-white">{s.orderCount} طلب</p>
                          <p className="text-xs text-emerald-300">
                            سائق {fmtMoney(s.driverEarning)} (
                            {Math.round(getDriverShareRate(selectedDriver?.id) * 100)}%)
                          </p>
                          <p className="text-xs text-sky-300">
                            شركة {fmtMoney(s.platformShare)} (
                            {Math.round((1 - getDriverShareRate(selectedDriver?.id)) * 100)}%)
                          </p>
                        </div>
                      ))}
                    </div>
                    <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto text-xs text-slate-300">
                      {driverStats.trips.slice(0, 30).map((t) => (
                        <li key={t.id}>
                          {t.orderNumber} · {fmtMoney(t.totalCharge)} · سائق{" "}
                          {fmtMoney(t.driverEarning)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {tab === "orders" ? (
          <section>
            <h2 className="text-lg font-bold">بحث الطلبات</h2>
            <p className="mt-1 text-sm text-slate-400">
              رقم الطلب · اسم/رقم السائق · اسم المحل · اسم/هاتف العميل
            </p>
            <input
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="اكتبوا رقم الطلب أو اسم السائق أو المحل أو العميل..."
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm outline-none focus:border-red-700"
            />
            <ul className="mt-4 space-y-2">
              {orderResults.length === 0 ? (
                <li>
                  <EmptyState
                    title="ما في نتائج"
                    body={
                      orderQuery.trim()
                        ? "جرّبوا رقم طلب أو اسم عميل/سائق أو محل مختلف."
                        : "لما العملاء يعملوا طلبات (نفس المتصفح) بتظهر هون. لسجل عميل معيّن استخدموا تبويب العملاء."
                    }
                  />
                </li>
              ) : (
                orderResults.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-red-200">{o.orderNumber}</p>
                      <span className="text-xs text-slate-400">{o.status}</span>
                    </div>
                    <p className="mt-1 text-slate-300">
                      {o.pickupShop} ({o.pickupArea}) → {o.deliveryShop} (
                      {o.deliveryArea})
                    </p>
                    <p className="text-xs text-slate-400">
                      عميل: {o.customerName} · سائق: {o.driverName ?? "—"}{" "}
                      {o.driverPhone ?? ""} · {fmtMoney(o.totalCharge)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        ) : null}

        {tab === "customers" ? (
          <AdminCustomersPanel orders={ops.orders} />
        ) : null}

        {tab === "pricing" ? <AdminPricingPanel /> : null}

        {tab === "finance" ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold">إدارة الحسابات والمدخول</h2>
              <p className="mt-1 text-sm text-slate-400">
                العملة: {DEMO_CURRENCY_FULL} · سائق{" "}
                {Math.round(getDriverShareRate() * 100)}% افتراضي · شركة{" "}
                {Math.round((1 - getDriverShareRate()) * 100)}% (قابلة للتعديل من تبويب الأسعار)
              </p>
            </div>

            <div className="rounded-2xl border border-sky-800/40 bg-sky-950/20 p-4">
              <h3 className="font-bold text-sky-100">حساب سائق لحال</h3>
              <p className="mt-1 text-xs text-slate-400">
                بحث بالاسم أو رقم الهاتف أو رقم المركبة — بيطلع الطلبات وشو قبض وشو
                لازم يعطي المنصة (يومي / أسبوعي / شهري)
              </p>
              <input
                value={financeDriverQuery}
                onChange={(e) => {
                  setFinanceDriverQuery(e.target.value);
                  setSelectedDriverId(null);
                }}
                placeholder="اسم السائق · رقمه · نمرة المركبة..."
                className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm outline-none focus:border-red-700"
              />
              {financeDriverQuery.trim() && financeDriverMatches.length > 1 ? (
                <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
                  {financeDriverMatches.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedDriverId(a.id)}
                        className={`w-full rounded-xl px-3 py-2 text-right text-sm ${
                          financeDriverFocus?.id === a.id
                            ? "bg-red-950/50 text-white"
                            : "text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        {a.displayName} · {a.phone} · {a.vehicle?.plateNumber ?? "—"}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {financeDriverFocus && financeDriverLedger ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-bold text-white">
                    {financeDriverFocus.displayName} · {financeDriverFocus.phone} ·{" "}
                    {financeDriverFocus.vehicle?.plateNumber ?? "—"}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        ["اليوم", financeDriverLedger.day],
                        ["الأسبوع", financeDriverLedger.week],
                        ["الشهر", financeDriverLedger.month],
                      ] as const
                    ).map(([label, block]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm"
                      >
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="mt-1 font-bold text-white">
                          {block.summary.orderCount} طلب
                        </p>
                        <p className="mt-1 text-xs text-slate-300">
                          قبض من الزبائن: {fmtMoney(block.summary.totalCharge)}
                        </p>
                        <p className="text-xs text-emerald-300">
                          حصة السائق (قبض): {fmtMoney(block.summary.driverEarning)}
                        </p>
                        <p className="text-xs text-amber-200">
                          لازم يعطي المنصة: {fmtMoney(block.summary.platformShare)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-slate-300">
                    {financeDriverLedger.all.length === 0 ? (
                      <li className="text-slate-500">ما في طلبات مكتملة لهذا السائق</li>
                    ) : (
                      financeDriverLedger.all.map((e) => (
                        <li
                          key={e.id}
                          className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5"
                        >
                          {e.orderNumber} · {e.pickupShop} → {e.deliveryShop} · قبض{" "}
                          {fmtMoney(e.totalCharge)} · للمنصة{" "}
                          {fmtMoney(e.platformShare)} · له {fmtMoney(e.driverEarning)}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ) : financeDriverQuery.trim() ? (
                <p className="mt-3 text-sm text-slate-500">ما في سائق مطابق</p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  اكتبوا اسم أو رقم للبحث عن حساب سائق
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-200">ملخص المنصة العام</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["day", "يومي"],
                    ["week", "أسبوعي"],
                    ["month", "شهري"],
                    ["year", "سنوي"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFinancePeriod(id)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                      financePeriod === id
                        ? "bg-red-900 text-white"
                        : "border border-white/10 text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Stat label="طلبات" value={String(financeRows.summary.orderCount)} />
                <Stat
                  label="إجمالي التحصيل"
                  value={fmtMoney(financeRows.summary.totalCharge)}
                />
                <Stat
                  label="حصة السائقين 75%"
                  value={fmtMoney(financeRows.summary.driverEarning)}
                />
                <Stat
                  label="حصة الشركة 25%"
                  value={fmtMoney(financeRows.summary.platformShare)}
                />
              </div>
              {financeRows.summary.orderCount > 0 &&
              financeRows.summary.driverEarning + financeRows.summary.platformShare !==
                financeRows.summary.totalCharge ? (
                <p className="mt-2 text-xs text-red-300">
                  تنبيه مطابقة: مجموع الحصص لا يساوي التحصيل — راجعوا القيود.
                </p>
              ) : financeRows.summary.orderCount > 0 ? (
                <p className="mt-2 text-xs text-emerald-400">
                  مطابقة دقيقة: سائق + شركة = إجمالي التحصيل
                </p>
              ) : null}
              <ul className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto">
                {financeRows.entries.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-red-200">{e.orderNumber}</span>
                    {" · "}
                    {e.driverName}
                    {" · إجمالي "}
                    {fmtMoney(e.totalCharge)}
                    {" · سائق "}
                    {fmtMoney(e.driverEarning)}
                    {" · شركة "}
                    {fmtMoney(e.platformShare)}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {tab === "ratings" ? (
          <section>
            <h2 className="text-lg font-bold">متابعة التقييمات</h2>
            <p className="mt-1 text-sm text-slate-400">
              إنذار تلقائي عند {DEMO_BAD_RATING_MAX_STARS} نجوم أو أقل — مع رقم المحل
              للتواصل
            </p>
            <ul className="mt-4 space-y-2">
              {ops.ratings.length === 0 ? (
                <li className="text-sm text-slate-500">ما في تقييمات بعد</li>
              ) : (
                ops.ratings.map((r) => (
                  <li
                    key={r.id}
                    className={`rounded-2xl border p-3 text-sm ${
                      r.isBad
                        ? "border-red-700/50 bg-red-950/40"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <p className="font-bold text-white">
                        {"★".repeat(r.stars)}
                        {"☆".repeat(5 - r.stars)}
                        {r.isBad ? " · إنذار" : ""}
                      </p>
                      <span className="text-xs text-slate-400">{r.orderNumber}</span>
                    </div>
                    <p className="mt-1 text-slate-300">
                      محل: {r.deliveryShop || r.pickupShop || r.customerName || "—"}
                      {r.customerName ? ` (${r.customerName})` : ""}
                    </p>
                    {r.customerPhone ? (
                      <p className="mt-1 font-bold text-amber-200">
                        هاتف المحل:{" "}
                        <a href={`tel:${r.customerPhone}`} className="underline">
                          {r.customerPhone}
                        </a>
                      </p>
                    ) : r.isBad ? (
                      <p className="mt-1 text-xs text-red-300">
                        ما انحفظ رقم للتواصل — راجعوا الطلب {r.orderNumber}
                      </p>
                    ) : null}
                    <p className="mt-1 text-slate-400">
                      سائق: {r.driverName ?? "—"}
                    </p>
                    {r.notes ? (
                      <p className="mt-2 rounded-xl bg-black/30 px-3 py-2 text-xs text-slate-200">
                        رسالة السبب: «{r.notes}»
                      </p>
                    ) : r.isBad ? (
                      <p className="mt-1 text-xs text-slate-500">بدون رسالة سبب</p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>
        ) : null}

        {tab === "alerts" ? (
          <section>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">التنبيهات</h2>
              <button
                type="button"
                onClick={() => {
                  acknowledgeAllAlerts();
                  setOps(getAdminOpsSnapshot());
                }}
                className="rounded-xl border border-white/15 px-3 py-1.5 text-xs"
              >
                تعليم الكل كمقروء
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {ops.alerts.length === 0 ? (
                <li className="text-sm text-slate-500">ما في تنبيهات</li>
              ) : (
                ops.alerts.map((a) => (
                  <li
                    key={a.id}
                    className={`rounded-2xl border p-3 text-sm ${
                      a.acknowledged
                        ? "border-white/5 bg-white/[0.03] opacity-60"
                        : a.kind === "bad_rating"
                          ? "border-red-700/50 bg-red-950/40"
                          : a.kind === "driver_join"
                            ? "border-amber-700/40 bg-amber-950/30"
                            : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <p className="font-bold text-white">{a.title}</p>
                      <div className="flex gap-2">
                        {a.kind === "driver_join" && a.driverId && !a.acknowledged ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                approve(
                                  a.driverId!,
                                  a.body.split(" · ")[0] ?? "سائق",
                                )
                              }
                              className="rounded-lg bg-emerald-700 px-2 py-1 text-xs font-bold"
                            >
                              موافقة
                            </button>
                            <button
                              type="button"
                              onClick={() => reject(a.driverId!)}
                              className="rounded-lg border border-red-700/50 px-2 py-1 text-xs text-red-200"
                            >
                              رفض
                            </button>
                          </>
                        ) : null}
                        {!a.acknowledged ? (
                          <button
                            type="button"
                            onClick={() => {
                              acknowledgeAlert(a.id);
                              setOps(getAdminOpsSnapshot());
                            }}
                            className="text-xs text-sky-300"
                          >
                            تم
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 text-slate-300">{a.body}</p>
                    {a.kind === "bad_rating" && a.customerPhone ? (
                      <p className="mt-2 font-bold text-amber-200">
                        تواصل مع المحل:{" "}
                        <a href={`tel:${a.customerPhone}`} className="underline">
                          {a.customerPhone}
                        </a>
                        {a.shopName ? ` · ${a.shopName}` : ""}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-500">
                      {new Date(a.createdAt).toLocaleString("ar-SY")}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        ) : null}

        {tab === "day_end" ? (
          <section>
            <h2 className="text-lg font-bold">جرد طلبات نهاية اليوم</h2>
            <p className="mt-1 text-sm text-slate-400">
              كل الطلبات المنشأة اليوم ({dayInventory.length}) — بحث برقم الطلب / اسم
              السائق / اسم المحل
            </p>
            <input
              value={inventoryQuery}
              onChange={(e) => setInventoryQuery(e.target.value)}
              placeholder="رقم الطلب · اسم السائق · اسم المحل..."
              className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm outline-none focus:border-red-700"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat
                label="مكتمل / مُقيَّم"
                value={String(
                  dayInventory.filter(
                    (o) => o.status === "delivered" || o.status === "rated",
                  ).length,
                )}
              />
              <Stat
                label="نشط"
                value={String(
                  dayInventory.filter(
                    (o) =>
                      !["delivered", "rated", "cancelled"].includes(String(o.status)),
                  ).length,
                )}
              />
              <Stat
                label="ملغى"
                value={String(
                  dayInventory.filter((o) => o.status === "cancelled").length,
                )}
              />
            </div>
            <ul className="mt-4 space-y-2">
              {dayInventoryFiltered.length === 0 ? (
                <li className="text-sm text-slate-500">ما في نتائج للبحث</li>
              ) : (
                dayInventoryFiltered.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-red-200">{o.orderNumber}</span>
                    {" · "}
                    {o.status}
                    {" · "}
                    {o.pickupShop} → {o.deliveryShop}
                    {" · "}
                    {o.driverName ?? "بدون سائق"}
                    {o.driverPhone ? ` (${o.driverPhone})` : ""}
                    {o.customerPhone ? (
                      <span className="block text-xs text-slate-400">
                        هاتف المحل/العميل: {o.customerPhone}
                      </span>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-white">{value}</p>
    </div>
  );
}
