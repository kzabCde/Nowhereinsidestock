"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWatchlistStore } from "@/store/watchlist-store";
import { EmptyState } from "@/components/ui/EmptyState";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";
import type { QuoteResponse } from "@/lib/types/market";

const mag7 = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"];

function trendClass(trend: string | undefined) {
  if (trend === "bullish") return "badge-positive";
  if (trend === "bearish") return "badge-negative";
  return "badge-neutral";
}

export function WatchlistGrid() {
  const watchlist = useWatchlistStore((s) => s.watchlist);
  const removeStock = useWatchlistStore((s) => s.removeStock);
  const addStock = useWatchlistStore((s) => s.addStock);
  const [quotes, setQuotes] = useState<Record<string, QuoteResponse>>({});
  const { locale, t } = useI18n();

  useEffect(() => {
    if (!watchlist.length) return;
    const load = async () => {
      const entries = await Promise.all(
        watchlist.map(async (item) => {
          const res = await fetch(`/api/quote/${item.symbol}`, { cache: "no-store" });
          if (!res.ok) return null;
          return [item.symbol, (await res.json()) as QuoteResponse] as const;
        })
      );
      setQuotes(Object.fromEntries(entries.filter((e): e is readonly [string, QuoteResponse] => e !== null)));
    };
    void load();
    const intervalId = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(intervalId);
  }, [watchlist]);

  if (!watchlist.length) {
    return (
      <EmptyState
        title={t("watchlist.emptyTitle")}
        description={t("watchlist.emptyDesc")}
        actions={
          <>
            <PremiumButton href="/rankings" tone="primary">{locale === "th" ? "ดูอันดับหุ้น" : "Browse rankings"}</PremiumButton>
            {mag7.map((symbol) => <PremiumButton key={symbol} onClick={() => addStock({ symbol })}>+ {symbol}</PremiumButton>)}
          </>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {watchlist.map((item) => {
        const q = quotes[item.symbol];
        const positive = (q?.changePercent ?? item.changePercent ?? 0) >= 0;
        const trendLabel = q?.insight.trend === "bullish" ? t("stock.trendBullish") : q?.insight.trend === "bearish" ? t("stock.trendBearish") : q?.insight.trend === "neutral" ? t("stock.trendSideways") : "—";

        return (
          <article key={item.symbol} className="interactive-card group flex min-h-64 flex-col p-5">
            <div className="relative z-[1] flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="section-kicker">{item.symbol}</p><h3 className="mt-1.5 truncate text-base font-semibold text-white">{q?.name ?? item.name ?? item.symbol}</h3></div>
              <span className={`shrink-0 ${trendClass(q?.insight.trend)}`}>{trendLabel}</span>
            </div>

            <div className="relative z-[1] mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.055] bg-white/[0.018] p-3"><p className="section-kicker">{t("common.price")}</p><p className="mt-2 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-white">{q ? formatMarketCurrency(q.latestPrice, q.currency ?? "USD") : "—"}</p></div>
              <div className="rounded-xl border border-white/[0.055] bg-white/[0.018] p-3 text-right"><p className="section-kicker">{t("common.change")}</p><p className={`mt-2 text-xl font-semibold tabular-nums ${positive ? "text-success" : "text-danger"}`}>{q ? `${positive ? "+" : ""}${q.changePercent.toFixed(2)}%` : "—"}</p></div>
            </div>

            <div className="relative z-[1] mt-auto flex items-center gap-2 border-t border-white/[0.055] pt-4">
              <button onClick={() => removeStock(item.symbol)} className="btn-premium border-danger/15 px-2.5 text-xs text-danger/70 hover:border-danger/30 hover:text-danger">{t("common.remove")}</button>
              <Link href={`/stocks/${item.symbol}`} className="btn-primary flex-1 text-center text-xs">{locale === "th" ? "เปิดข้อมูล" : "Open detail"}</Link>
              <Link href={`/compare?symbols=${item.symbol}`} aria-label={t("nav.compare")} className="btn-premium w-10 px-0 text-xs"><span aria-hidden="true">↗</span></Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
