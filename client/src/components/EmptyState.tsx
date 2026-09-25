"use client";

import type { ReactNode } from "react";

/** Consistent empty / waiting panel for demo UX. */
export function EmptyState({
  title,
  body,
  action,
  tone = "neutral",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  tone?: "neutral" | "wait" | "warn";
}) {
  const border =
    tone === "wait"
      ? "border-sky-600/40 bg-sky-950/25"
      : tone === "warn"
        ? "border-amber-700/40 bg-amber-950/30"
        : "border-white/10 bg-white/5";

  return (
    <div className={`rounded-3xl border px-4 py-5 text-center ${border}`}>
      <p className="text-sm font-bold text-slate-100">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
