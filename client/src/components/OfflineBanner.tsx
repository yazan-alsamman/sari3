"use client";

import { useEffect, useState } from "react";
import { playTone, pushNotify, vibratePattern } from "@/lib/notify";

/** Shows a persistent banner when the device loses connectivity. */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    function onOnline() {
      setOnline(true);
    }
    async function onOffline() {
      setOnline(false);
      playTone("offline");
      vibratePattern("offline");
      await pushNotify(
        "فقدت الاتصال بالنت",
        "انقطع الإنترنت — بعض الميزات مثل التتبع والإشعارات قد تتأخر.",
      );
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-[80] border-b border-amber-500/40 bg-amber-950/90 px-4 py-2.5 text-center text-sm font-semibold text-amber-100 backdrop-blur"
    >
      فقدت الاتصال بالنت — تحققوا من الشبكة
    </div>
  );
}
