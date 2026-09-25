"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import type { DriverPresence } from "@/lib/demo-admin-ops";

type MapProps = { drivers: DriverPresence[] };
type MapComponent = ComponentType<MapProps>;

export function AdminLiveMapDynamic(props: MapProps) {
  const [MapView, setMapView] = useState<MapComponent | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    void import("./AdminLiveMap").then((mod) => {
      if (!cancelled) setMapView(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  if (!MapView) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-[#0a1628] text-sm text-slate-300">
        جاري تحميل خريطة الأدمن...
      </div>
    );
  }
  return <MapView {...props} />;
}
