"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { coordsForArea, lerpLatLng } from "@/lib/zones";
import type { LiveMapProps } from "./live-map-types";

export type { LiveMapProps };

function pinIcon(color: string, letter: string) {
  return L.divIcon({
    className: "saree-map-pin",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35)">${letter}</div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};margin-top:-1px"></div>
    </div>`,
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) {
      map.setView(points[0] ?? [33.48, 36.28], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [36, 36] });
  }, [map, points]);
  return null;
}

export default function LiveMap({
  pickupArea,
  deliveryArea,
  pickupLabel,
  deliveryLabel,
  stopAreas = [],
  stopLabels = [],
  inTransit = false,
}: LiveMapProps) {
  const pickup = useMemo(() => coordsForArea(pickupArea), [pickupArea]);
  const delivery = useMemo(() => coordsForArea(deliveryArea), [deliveryArea]);
  const stopKey = stopAreas.join("|");
  const stops = useMemo(
    () => stopAreas.map((a) => coordsForArea(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopKey],
  );

  const route = useMemo(
    () => [pickup, ...stops, delivery] as [number, number][],
    [pickup, stops, delivery],
  );

  const routeKey = route.map((p) => p.join(",")).join(";");
  const [driverPos, setDriverPos] = useState<[number, number]>(pickup);

  useEffect(() => {
    setDriverPos(pickup);
  }, [pickup]);

  useEffect(() => {
    if (!inTransit || route.length < 2) return;
    let frame = 0;
    const points = route;
    const id = window.setInterval(() => {
      frame = (frame + 1) % 100;
      const segCount = points.length - 1;
      const scaled = (frame / 100) * segCount;
      const seg = Math.min(Math.floor(scaled), segCount - 1);
      const localT = scaled - seg;
      setDriverPos(lerpLatLng(points[seg], points[seg + 1], localT));
    }, 120);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inTransit, routeKey]);

  const pickupIcon = useMemo(() => pinIcon("#1e3a5f", "م"), []);
  const deliveryIcon = useMemo(() => pinIcon("#7f1d1d", "ت"), []);
  const stopIcon = useMemo(() => pinIcon("#334155", "و"), []);
  const driverIcon = useMemo(() => pinIcon("#b91c1c", "د"), []);

  return (
    <div className="relative h-64 overflow-hidden rounded-3xl border border-white/10 shadow-lg sm:h-72">
      <MapContainer
        center={pickup}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom
        style={{ background: "#0a1628" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={route} />
        <Polyline
          positions={route}
          pathOptions={{ color: "#7f1d1d", weight: 4, opacity: 0.85 }}
        />
        <Marker position={pickup} icon={pickupIcon}>
          <Popup>
            استلام: {pickupLabel}
            <br />
            {pickupArea}
          </Popup>
        </Marker>
        {stops.map((pos, i) => (
          <Marker key={`stop-${i}`} position={pos} icon={stopIcon}>
            <Popup>
              توقف {i + 1}: {stopLabels[i] || "توقف"}
            </Popup>
          </Marker>
        ))}
        <Marker position={delivery} icon={deliveryIcon}>
          <Popup>
            تسليم: {deliveryLabel}
            <br />
            {deliveryArea}
          </Popup>
        </Marker>
        {inTransit ? (
          <Marker position={driverPos} icon={driverIcon}>
            <Popup>موقع السائق (محاكاة)</Popup>
          </Marker>
        ) : null}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-[#0a1628]/80 px-2 py-1 text-[10px] text-slate-200 backdrop-blur-sm">
        خريطة تفاعلية · OpenStreetMap · اسحب وكبّر
      </div>
    </div>
  );
}
