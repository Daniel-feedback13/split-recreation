import AppThemeProvider from "@/shared/ui/AppThemeProvider";
import type { Metadata } from "next";
import type React from "react";
import "@/styles/globals.scss";

export const metadata: Metadata = {
  title: "Realtime Recreation",
  description:
    "Pension recreation host, display, and player screens powered by Socket.IO",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
