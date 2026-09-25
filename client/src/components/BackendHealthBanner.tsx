"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base";

type HealthState = "checking" | "live" | "ready" | "down";

/**
 * Phase 1 connectivity indicator — probes backend health only.
 * Does not replace the localStorage demo bus (see LAUNCH_PATH Phase 9).
 */
export function BackendHealthBanner() {
  const [state, setState] = useState<HealthState>("checking");
  const base = getApiBaseUrl();

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const liveRes = await fetch(`${base}/api/v1/health/live`, {
          cache: "no-store",
        });
        if (!liveRes.ok) throw new Error("live failed");
        const readyRes = await fetch(`${base}/api/v1/health/ready`, {
          cache: "no-store",
        });
        if (cancelled) return;
        setState(readyRes.ok ? "ready" : "live");
      } catch {
        if (!cancelled) setState("down");
      }
    }

    void probe();
    const id = window.setInterval(probe, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [base]);

  const label =
    state === "checking"
      ? "جاري فحص الباكند…"
      : state === "ready"
        ? "الباكند جاهز (Postgres + Redis)"
        : state === "live"
          ? "الباكند يعمل — القاعدة/Redis غير جاهزين"
          : "الباكند غير متصل (شغّل apps/backend على :3001)";

  const tone =
    state === "ready"
      ? "border-emerald-600/40 bg-emerald-950/80 text-emerald-50"
      : state === "live"
        ? "border-sky-600/40 bg-sky-950/80 text-sky-50"
        : state === "checking"
          ? "border-zinc-600/40 bg-zinc-900/80 text-zinc-200"
          : "border-rose-600/40 bg-rose-950/80 text-rose-50";

  return (
    <div
      className={`relative z-[69] border-b px-3 py-1.5 text-center text-[11px] leading-relaxed backdrop-blur-md sm:text-xs ${tone}`}
      role="status"
      title={base}
    >
      <strong className="font-bold">Phase 1 API:</strong> {label}
    </div>
  );
}
