"use client";

import { useEffect, useState } from "react";
import { apiListZones, apiPreviewPrice } from "./backend-api";
import { DEMO_CURRENCY_FULL } from "./demo-currency";
import { calculateDemoPrice } from "./demo-pricing";
import type { DeliveryMode, DemoPriceBreakdown } from "./types";

let zonesPromise: Promise<Map<string, string>> | null = null;

function loadZoneIds(): Promise<Map<string, string>> {
  if (!zonesPromise) {
    zonesPromise = apiListZones()
      .then((rows) => new Map(rows.map((z) => [z.nameAr, z.id])))
      .catch(() => {
        zonesPromise = null;
        return new Map<string, string>();
      });
  }
  return zonesPromise;
}

export async function zoneIdForName(name: string): Promise<string | null> {
  const zones = await loadZoneIds();
  return zones.get(name.trim()) ?? null;
}

export async function listLiveZoneNames(): Promise<string[] | null> {
  const zones = await loadZoneIds();
  const names = [...zones.keys()];
  return names.length > 0 ? names : null;
}

export async function quoteLivePrice(input: {
  pickupArea: string;
  deliveryArea: string;
  mode: DeliveryMode;
  intermediateStopCount: number;
  weightClass?: "light" | "heavy";
}): Promise<DemoPriceBreakdown> {
  const fallback = calculateDemoPrice({
    pickupArea: input.pickupArea,
    deliveryArea: input.deliveryArea,
    mode: input.mode,
    intermediateStopCount: input.intermediateStopCount,
  });
  try {
    const zones = await loadZoneIds();
    const pickupZoneId = zones.get(input.pickupArea.trim());
    const deliveryZoneId = zones.get(input.deliveryArea.trim());
    if (!pickupZoneId || !deliveryZoneId) return fallback;
    const preview = await apiPreviewPrice({
      pickupZoneId,
      deliveryZoneId,
      mode: input.mode,
      weightClass: input.weightClass ?? "light",
      intermediateStopCount: input.intermediateStopCount,
    });
    return {
      currencyLabel: preview.currencyFull || DEMO_CURRENCY_FULL,
      baseAmount: preview.baseAmount,
      modeSurcharge: preview.modeSurcharge,
      stopsSurcharge: preview.stopsSurcharge + (preview.heavySurcharge || 0),
      total: preview.totalAmount,
      isDemo: false,
      disclaimer: "حسب تسعير المناطق الحالي",
    };
  } catch {
    return fallback;
  }
}

export function useLiveQuote(input: {
  pickupArea: string;
  deliveryArea: string;
  mode: DeliveryMode;
  intermediateStopCount: number;
  weightClass?: "light" | "heavy";
}): DemoPriceBreakdown {
  const [price, setPrice] = useState<DemoPriceBreakdown>(() =>
    calculateDemoPrice({
      pickupArea: input.pickupArea,
      deliveryArea: input.deliveryArea,
      mode: input.mode,
      intermediateStopCount: input.intermediateStopCount,
    }),
  );

  useEffect(() => {
    let cancel = false;
    void quoteLivePrice(input).then((next) => {
      if (!cancel) setPrice(next);
    });
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    input.pickupArea,
    input.deliveryArea,
    input.mode,
    input.intermediateStopCount,
    input.weightClass,
  ]);

  return price;
}
