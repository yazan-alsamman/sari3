"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { DriverPresence } from "@/lib/demo-admin-ops";

function pin(color: string, letter: string) {
  return L.divIcon({
    className: "saree-map-pin",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    html: `<div style="display:flex;flex-direction:column;align-items:center">
      <div style="background:${color};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;border:2px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35)">${letter}</div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};margin-top:-1px"></div>
    </div>`,
  });
}

function FitDrivers({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView([33.487, 36.301], 12);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0]!, 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
}

function statusColor(p: DriverPresence): string {
  if (p.approvalStatus !== "approved") return "#78716c";
  if (p.availability === "busy") return "#b91c1c";
  if (p.availability === "available") return "#059669";
  return "#64748b";
}

function statusLabel(p: DriverPresence): string {
  if (p.approvalStatus === "pending") return "بانتظار موافقة";
  if (p.approvalStatus === "rejected") return "مرفوض";
  if (p.approvalStatus === "suspended") return "معلّق";
  if (p.availability === "busy") return "برحلة";
  if (p.availability === "available") return "فعّال الآن";
  return "مطفي / استراحة";
}

export default function AdminLiveMap({ drivers }: { drivers: DriverPresence[] }) {
  const points = useMemo(
    () => drivers.map((d) => [d.lat, d.lng] as [number, number]),
    [drivers],
  );

  return (
    <MapContainer
      center={[33.487, 36.301]}
      zoom={12}
      className="h-full w-full rounded-2xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitDrivers points={points} />
      {drivers.map((d) => (
        <Marker
          key={d.driverId}
          position={[d.lat, d.lng]}
          icon={pin(statusColor(d), d.displayName.slice(0, 1) || "س")}
        >
          <Popup>
            <div dir="rtl" className="text-sm">
              <strong>{d.displayName}</strong>
              <br />
              {d.phone}
              <br />
              {statusLabel(d)}
              {d.activeOrderNumber ? (
                <>
                  <br />
                  طلب: {d.activeOrderNumber}
                </>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
