"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getApiBaseUrl } from "@/lib/api-base";
import { API_SESSION_EVENT, loadApiSession } from "@/lib/backend-api";
import { publishRealtime } from "@/lib/realtime-events";
import { useApp } from "@/lib/store";

const SERVER_EVENTS = [
  "order.status.changed",
  "driver.location.updated",
  "dispatch.offer.created",
  "dispatch.offer.expired",
  "rating.requested",
] as const;

/** ADR-010 transport and ADR-016 events. Reconnect still reads REST. */
export function RealtimeBridge() {
  const { reconcileActiveOrder, applyDriverPoint } = useApp();
  const reconcileRef = useRef(reconcileActiveOrder);
  const pointRef = useRef(applyDriverPoint);
  reconcileRef.current = reconcileActiveOrder;
  pointRef.current = applyDriverPoint;

  useEffect(() => {
    let socket: Socket | null = null;

    function connect() {
      socket?.disconnect();
      socket = null;
      const session = loadApiSession();
      if (!session?.accessToken) return;
      socket = io(getApiBaseUrl(), {
        path: "/socket.io",
        auth: { token: session.accessToken },
        transports: ["polling", "websocket"],
      });
      socket.on("connect", () => {
        void reconcileRef.current();
      });
      for (const event of SERVER_EVENTS) {
        socket.on(event, (payload: unknown) => {
          publishRealtime(event, payload);
          if (event === "order.status.changed" || event === "rating.requested") {
            void reconcileRef.current();
          }
          if (event === "driver.location.updated" && payload && typeof payload === "object") {
            const row = payload as {
              orderId?: unknown;
              latitude?: unknown;
              longitude?: unknown;
              accuracyMeters?: unknown;
              capturedAt?: unknown;
              freshness?: unknown;
            };
            if (
              typeof row.orderId === "string" &&
              typeof row.latitude === "number" &&
              typeof row.longitude === "number"
            ) {
              pointRef.current({
                orderId: row.orderId,
                latitude: row.latitude,
                longitude: row.longitude,
                accuracyMeters: typeof row.accuracyMeters === "number" ? row.accuracyMeters : 0,
                capturedAt: typeof row.capturedAt === "string" ? row.capturedAt : new Date().toISOString(),
                freshness: typeof row.freshness === "string" ? row.freshness : "unknown",
              });
            }
          }
        });
      }
    }

    connect();
    const refresh = window.setInterval(() => {
      void reconcileRef.current();
    }, 5000);
    window.addEventListener(API_SESSION_EVENT, connect);
    return () => {
      window.clearInterval(refresh);
      window.removeEventListener(API_SESSION_EVENT, connect);
      socket?.disconnect();
    };
  }, []);

  return null;
}
