import type { Metadata, Viewport } from "next";
import "@fontsource/vazirmatn/arabic-400.css";
import "@fontsource/vazirmatn/arabic-700.css";
import "@fontsource/vazirmatn/arabic-800.css";
import "@fontsource/vazirmatn/latin-600.css";
import "@fontsource/lalezar/arabic-400.css";
import "@fontsource/lalezar/latin-400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "سبدچین",
  description: "خرج‌های خونه، ساده و خودمونی",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "سبدچین", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FBF3E4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
