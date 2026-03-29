import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TelemarkeTHINK",
  description: "WA & Email Automation for Insurance Business",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
