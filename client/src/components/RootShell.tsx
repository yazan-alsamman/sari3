"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AppShell } from "@/components/AppShell";
import { DriverShell } from "@/components/driver/DriverShell";
import { InAppToastHost } from "@/components/InAppToastHost";
import { OfflineBanner } from "@/components/OfflineBanner";
import { BackendHealthBanner } from "@/components/BackendHealthBanner";
import { RealtimeBridge } from "@/components/RealtimeBridge";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { DriverProvider } from "@/lib/driver-store";
import { AppProvider } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";

type Role = "pick" | "customer" | "driver" | "admin";

function shouldOpenAdminFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const hash = window.location.hash.toLowerCase();
  const q = new URLSearchParams(window.location.search);
  return (
    path.endsWith("/admin") ||
    path.includes("/admin/") ||
    hash === "#admin" ||
    q.get("admin") === "1"
  );
}

/**
 * Keep both providers mounted so a customer order survives switching
 * to the driver role (demo dispatch bridge).
 */
export function RootShell() {
  const [role, setRole] = useState<Role>("pick");

  useEffect(() => {
    if (shouldOpenAdminFromUrl()) setRole("admin");
    const onHash = () => {
      if (shouldOpenAdminFromUrl()) setRole("admin");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function leaveAdmin() {
    setRole("pick");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = "";
      url.searchParams.delete("admin");
      const path =
        url.pathname === "/admin" || url.pathname.endsWith("/admin")
          ? "/"
          : url.pathname;
      window.history.replaceState({}, "", path + url.search);
    }
  }

  return (
    <ThemeProvider>
      <AppProvider>
        <RealtimeBridge />
        <DriverProvider>
          <InAppToastHost />
          <OfflineBanner />
          <BackendHealthBanner />
          {role === "admin" ? <AdminShell onExit={leaveAdmin} /> : null}
          {role === "pick" ? (
            <WelcomeScreen
              onChooseCustomer={() => setRole("customer")}
              onChooseDriver={() => setRole("driver")}
              onSecretAdmin={() => setRole("admin")}
            />
          ) : null}
          {role === "driver" ? (
            <DriverShell onBackToWelcome={() => setRole("pick")} />
          ) : null}
          {role === "customer" ? (
            <AppShell onBackToWelcome={() => setRole("pick")} />
          ) : null}
        </DriverProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
