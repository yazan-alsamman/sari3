"use client";

import { useEffect } from "react";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

function selfIcon() {
  return L.divIcon({
    className: "saree-driver-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 0 0 6px rgba(34,197,94,.25)"></div>`,
  });
}

function Recenter({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [map, lat, lng]);
  return null;
}

export default function DriverMap({
  lat,
  lng,
  radiusKm,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      className="h-full w-full rounded-3xl"
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Recenter lat={lat} lng={lng} />
      <Marker position={[lat, lng]} icon={selfIcon()} />
      <Circle
        center={[lat, lng]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: "#b91c1c",
          fillColor: "#7f1d1d",
          fillOpacity: 0.12,
          weight: 2,
        }}
      />
    </MapContainer>
  );
}
