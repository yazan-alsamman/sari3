import type { Metadata } from "next";
import { AdminPageClient } from "./AdminPageClient";

export const metadata: Metadata = {
  title: "أدمن | سريع حوش بلاس",
  description: "لوحة عمليات الأدمن — دخول محمي",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPageClient />;
}
