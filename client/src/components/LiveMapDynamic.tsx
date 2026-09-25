"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import type { LiveMapProps } from "./live-map-types";

type MapComponent = ComponentType<LiveMapProps>;

function MapSkeleton({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-[#0a1628] px-4 text-center text-sm text-slate-300 sm:h-72">
      {message}
    </div>
  );
}

/**
 * Loads Leaflet only in the browser after mount (avoids SSR + flaky dynamic chunks).
 */
export function LiveMapDynamic(props: LiveMapProps) {
  const [MapView, setMapView] = useState<MapComponent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback(() => {
    setError(null);
    setMapView(null);
    let cancelled = false;

    void import("./LiveMap")
      .then((mod) => {
        if (cancelled) return;
        setMapView(() => mod.default);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("LiveMap load failed", err);
        setError("تعذّر تحميل الخريطة. جرّب إعادة المحاولة.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load, retryKey]);

  if (error) {
    return (
      <div className="space-y-2">
        <MapSkeleton message={error} />
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="w-full rounded-2xl border border-red-800/50 bg-red-950/40 py-2.5 text-sm font-semibold text-red-200"
        >
          إعادة تحميل الخريطة
        </button>
      </div>
    );
  }

  if (!MapView) {
    return <MapSkeleton message="جاري تحميل الخريطة..." />;
  }

  return <MapView {...props} />;
}
