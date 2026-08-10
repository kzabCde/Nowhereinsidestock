import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchModal } from "@/components/ui/SearchModal";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nowhereinsidestock.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "NowhereInsideStock",
  title: {
    default: "NowhereInsideStock — Explainable Stock Intelligence",
    template: "%s | NowhereInsideStock"
  },
  description: "Explainable stock intelligence with near-real-time quotes, technical signals, transparent rankings, portfolio tools, valuation, backtesting, and risk analytics.",
  keywords: ["stock analysis", "technical analysis", "stock screener", "portfolio tracker", "backtesting", "Thai stocks", "US stocks"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "NowhereInsideStock",
    title: "NowhereInsideStock — Explainable Stock Intelligence",
    description: "See the trend, read the signal, and inspect the evidence behind technical analytics."
  },
  twitter: {
    card: "summary_large_image",
    title: "NowhereInsideStock — Explainable Stock Intelligence",
    description: "Transparent stock signals, rankings, portfolio analytics, valuation, and backtesting."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
  }
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NowhereInsideStock",
  url: siteUrl,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: "Explainable stock intelligence platform for market screening, technical analytics, portfolio tracking, comparison, valuation, and educational backtesting.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen overflow-x-hidden">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <div className="flex min-h-screen flex-col overflow-x-hidden">
          <Header />
          <div className="flex-1 overflow-x-hidden pb-20 md:pb-0">{children}</div>
          <Footer />
        </div>
        <BottomNav />
        <SearchModal />
      </body>
    </html>
  );
}
