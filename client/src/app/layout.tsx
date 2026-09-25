import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "سريع حوش بلاس | Saree'e Hosh Blass",
  description:
    "منصة توصيل قطع السيارات للمحلات والسائقين في المناطق الصناعية — نموذج واجهات",
  applicationName: "سريع حوش بلاس",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07111f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-theme="dark"
      suppressHydrationWarning
      className={`${cairo.variable} ${tajawal.variable} h-full`}
    >
      <head>
        {/* Apply saved theme before paint — avoids wrong white flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("sareee-theme-v1");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);document.documentElement.classList.toggle("light",t==="light");document.documentElement.classList.toggle("dark",t==="dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
