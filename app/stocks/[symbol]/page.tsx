"use client";

import { useMarketQuotes } from "@/lib/client/use-market-quotes";
import { useParams } from "next/navigation";
import { RiskPlanner } from "@/components/stocks/RiskPlanner";
import { StockDetailPreviewTabs } from "@/components/stocks/StockDetailPreviewTabs";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol.toUpperCase();
  const { quotes, errors, refreshing, refresh: loadQuote } = useMarketQuotes([symbol], "detail", 120_000);
  const data = quotes[symbol];
  const error = errors[symbol];
  const { locale } = useI18n();

  const nearestSupport = data
    ? [...data.supportResistance.supports]
        .filter((zone) => zone.level < data.latestPrice)
        .sort((a, b) => b.level - a.level)[0]?.level ?? null
    : null;
  const nearestResistance = data
    ? [...data.supportResistance.resistances]
        .filter((zone) => zone.level > data.latestPrice)
        .sort((a, b) => a.level - b.level)[0]?.level ?? null
    : null;

  return (
    <PageShell size="wide" className="space-y-5">
      {!data && !error ? <LoadingSkeleton label={locale === "th" ? `กำลังโหลด ${symbol}` : `Loading ${symbol}`} /> : null}
      {error && !data ? <ErrorState message={error} onRetry={() => void loadQuote()} /> : null}
      {error && data ? <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">{locale === "th" ? `รีเฟรชไม่สำเร็จ: ${error} กำลังแสดงข้อมูลล่าสุดที่โหลดสำเร็จ` : `Refresh failed: ${error}. Showing the last successful snapshot.`}</div> : null}
      {data ? (
        <>
          <StockDetailPreviewTabs key={symbol} data={data} onRefresh={() => void loadQuote()} refreshing={refreshing} />
          <RiskPlanner
            symbol={data.symbol}
            currentPrice={data.latestPrice}
            currency={data.currency}
            support={nearestSupport}
            resistance={nearestResistance}
          />
        </>
      ) : null}
    </PageShell>
  );
}
