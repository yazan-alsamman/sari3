"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { InAppToastHost } from "@/components/InAppToastHost";
import { ThemeProvider } from "@/lib/theme";

/** Client wrapper — /admin must include ThemeProvider (ThemeToggle lives in AdminShell). */
export function AdminPageClient() {
  return (
    <ThemeProvider>
      <InAppToastHost />
      <AdminShell />
    </ThemeProvider>
  );
}
