import "./globals.css";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchModal } from "@/components/ui/SearchModal";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { getLocale } from "@/lib/i18n/server";
import { createTranslator } from "@/lib/i18n/config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nowhereinsidestock.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = createTranslator(locale);
  return {
    metadataBase: new URL(siteUrl),
    applicationName: "NowhereInsideStock",
    title: {
      default: t("meta.title"),
      template: "%s | NowhereInsideStock"
    },
    description: t("meta.description"),
    keywords: locale === "th"
      ? ["วิเคราะห์หุ้น", "วิเคราะห์ทางเทคนิค", "คัดกรองหุ้น", "พอร์ตโฟลิโอ", "Backtest", "หุ้นไทย", "หุ้นสหรัฐ"]
      : ["stock analysis", "technical analysis", "stock screener", "portfolio tracker", "backtesting", "Thai stocks", "US stocks"],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: "NowhereInsideStock",
      title: t("meta.title"),
      description: t("meta.ogDescription"),
      locale: locale === "th" ? "th_TH" : "en_US"
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.title"),
      description: t("meta.twitterDescription")
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
    }
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "NowhereInsideStock",
    url: siteUrl,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    inLanguage: locale,
    description: t("meta.structuredDescription"),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }
  };

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen overflow-x-hidden">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <I18nProvider initialLocale={locale}>
          <div className="flex min-h-screen flex-col overflow-x-hidden">
            <Header />
            <div className="flex-1 overflow-x-hidden pb-20 md:pb-0">{children}</div>
            <Footer />
          </div>
          <BottomNav />
          <SearchModal />
        </I18nProvider>
      </body>
    </html>
  );
}
