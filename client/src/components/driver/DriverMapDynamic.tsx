"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";

type MapProps = { lat: number; lng: number; radiusKm: number };
type MapComponent = ComponentType<MapProps>;

export function DriverMapDynamic(props: MapProps) {
  const [MapView, setMapView] = useState<MapComponent | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    void import("./DriverMap").then((mod) => {
      if (!cancelled) setMapView(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  if (!MapView) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-white/10 bg-[#0a1628] text-sm text-slate-300">
        جاري تحميل الخريطة...
      </div>
    );
  }
  return <MapView {...props} />;
}
