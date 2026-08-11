"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { QuoteResponse } from "@/lib/types/market";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { Sparkline } from "@/components/stocks/Sparkline";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";

export function StockCard({ stock }: { stock: QuoteResponse }) {
  const positive = stock.changePercent >= 0;
  const sparkData = stock.candles.slice(-20).map((c) => c.close);
  const { locale, t } = useI18n();
  const trendLabel = stock.insight.trend === "bullish" ? t("stock.trendBullish") : stock.insight.trend === "bearish" ? t("stock.trendBearish") : t("stock.trendSideways");

  return (
    <article className="interactive-card group flex flex-col p-4 sm:p-5">
      <div className="relative z-[1] flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="section-kicker">{stock.symbol}</p><h3 className="mt-1.5 truncate text-sm font-semibold text-white">{stock.name ?? stock.symbol}</h3></div>
        <span className={stock.insight.trend === "bullish" ? "badge-positive" : stock.insight.trend === "bearish" ? "badge-negative" : "badge-neutral"}>{trendLabel}</span>
      </div>
      <div className="relative z-[1] my-4 rounded-xl border border-white/[0.045] bg-black/10 px-2 py-1"><Sparkline data={sparkData} positive={positive} /></div>
      <div className="relative z-[1] flex items-end justify-between gap-2">
        <div><p className="section-kicker">{t("common.price")}</p><p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-[-0.035em] text-white">{formatMarketCurrency(stock.latestPrice, stock.currency ?? "USD")}</p></div>
        <p className={`mb-0.5 text-sm font-semibold tabular-nums ${positive ? "text-success" : "text-danger"}`}>{positive ? "+" : ""}{stock.changePercent.toFixed(2)}%</p>
      </div>
      <div className="relative z-[1] mt-4 flex gap-2 border-t border-white/[0.055] pt-4">
        <FavoriteButton stock={{ symbol: stock.symbol, name: stock.name, exchange: stock.exchange, price: stock.latestPrice, changePercent: stock.changePercent }} compact />
        <Link href={`/stocks/${stock.symbol}`} className="btn-primary flex-1 text-center text-xs">{locale === "th" ? "เปิดข้อมูล" : "Open detail"}</Link>
        <Link href={`/compare?symbols=${stock.symbol}`} className="btn-premium w-10 px-0" aria-label={t("nav.compare")}><ArrowUpRight size={14} /></Link>
      </div>
    </article>
  );
}
