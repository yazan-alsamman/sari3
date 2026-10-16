"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base";

type HealthState = "checking" | "live" | "ready" | "down";

type ReadyBody = {
  error?: Record<string, { status?: string }>;
};

function readinessLabel(body: ReadyBody | null): string {
  const error = body?.error ?? {};
  const postgresDown = error.postgres?.status === "down";
  const redisDown = error.redis?.status === "down";
  if (postgresDown && redisDown) return "قاعدة البيانات وRedis غير جاهزين";
  if (postgresDown) return "قاعدة البيانات غير جاهزة";
  if (redisDown) return "الخدمة تعمل، وRedis غير جاهز";
  return "الخدمة تعمل، والجاهزية غير مكتملة";
}

/**
 * Phase 1 connectivity indicator — probes backend health only.
 * Server paths take priority when a session exists. Local demo bus remains for offline/demo-only flows (LAUNCH_PATH cutover).
 */
export function BackendHealthBanner() {
  const [state, setState] = useState<HealthState>("checking");
  const [detail, setDetail] = useState("");
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
        if (readyRes.ok) {
          setDetail("");
          setState("ready");
          return;
        }
        const readyBody = (await readyRes.json().catch(() => null)) as ReadyBody | null;
        setDetail(readinessLabel(readyBody));
        setState("live");
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
      ? ""
      : state === "ready"
        ? ""
        : state === "live"
          ? detail || "الخدمة تعمل، والجاهزية غير مكتملة"
          : "تعذر الاتصال بالخدمة";

  const tone =
    state === "ready"
      ? "border-emerald-600/40 bg-emerald-950/80 text-emerald-50"
      : state === "live"
        ? "border-sky-600/40 bg-sky-950/80 text-sky-50"
        : state === "checking"
          ? "border-zinc-600/40 bg-zinc-900/80 text-zinc-200"
          : "border-rose-600/40 bg-rose-950/80 text-rose-50";

  if (state === "checking" || state === "ready") return null;

  return (
    <div
      className={`relative z-[69] border-b px-3 py-1.5 text-center text-[11px] leading-relaxed backdrop-blur-md sm:text-xs ${tone}`}
      role="status"
      title={base}
    >
      {label}
    </div>
  );
}
