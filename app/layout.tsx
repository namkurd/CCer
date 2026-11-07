import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["600", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Criticaller",
  description: "The front page of tomorrow. Make a call. Show your reasoning. Put a number on it. Get your receipts.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
