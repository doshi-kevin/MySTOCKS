import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AuroraBackground } from "@/components/aurora-background";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyStocks · Portfolio Tracker",
  description: "Personal portfolio tracker with live NSE/BSE prices and exit alerts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <AuroraBackground />
        {children}
      </body>
    </html>
  );
}
