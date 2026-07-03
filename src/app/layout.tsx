import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { TestnetDisclaimer } from "@/components/layout/TestnetDisclaimer";
import { ClientOnly } from "./ClientOnly";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArcFlow Finance — DeFi on Arc Testnet",
  description: "Swap, lend, and borrow on Arc Testnet. Gas paid in USDC. Sub-second finality.",
  keywords: ["DeFi", "Arc Testnet", "Swap", "Lending", "USDC"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning={true}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={{ background: "#0a0a0f", color: "#f0f0f0" }} suppressHydrationWarning={true}>
        <ClientOnly>
          <Providers>
            <Header />
            <main className="pt-16 min-h-screen">
              {children}
            </main>
            <TestnetDisclaimer />
          </Providers>
        </ClientOnly>
      </body>
    </html>
  );
}
