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
  if (trend === "bullish") return "border-success/25 bg-success/10 text-success";
  if (trend === "bearish") return "border-danger/25 bg-danger/10 text-danger";
  return "border-white/[0.08] bg-white/[0.04] text-slate-500";
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {watchlist.map((item) => {
        const q = quotes[item.symbol];
        const positive = (q?.changePercent ?? item.changePercent ?? 0) >= 0;
        const trendLabel = q?.insight.trend === "bullish" ? t("stock.trendBullish") : q?.insight.trend === "bearish" ? t("stock.trendBearish") : q?.insight.trend === "sideways" ? t("stock.trendSideways") : "—";

        return (
          <article key={item.symbol} className="flex flex-col rounded-2xl border border-white/[0.08] bg-surface p-5 transition-all hover:border-white/[0.12]" style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="section-kicker">{item.symbol}</p><h3 className="mt-1 truncate text-base font-semibold text-white">{q?.name ?? item.name ?? item.symbol}</h3></div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${trendClass(q?.insight.trend)}`}>{trendLabel}</span>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.06] pt-4">
              <div><p className="section-kicker">{t("common.price")}</p><p className="mt-1 text-2xl font-bold tabular-nums text-white">{q ? formatMarketCurrency(q.latestPrice, q.currency ?? "USD") : "—"}</p></div>
              <div className="text-right"><p className="section-kicker">{t("common.change")}</p><p className={`mt-1 text-xl font-bold tabular-nums ${positive ? "text-success" : "text-danger"}`}>{q ? `${positive ? "+" : ""}${q.changePercent.toFixed(2)}%` : "—"}</p></div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => removeStock(item.symbol)} className="btn-premium border-danger/20 px-2.5 text-xs text-danger/70 hover:border-danger/35 hover:text-danger">{t("common.remove")}</button>
              <Link href={`/stocks/${item.symbol}`} className="btn-premium flex-1 text-center text-xs">{locale === "th" ? "ดูรายละเอียด" : "View Detail"}</Link>
              <Link href={`/compare?symbols=${item.symbol}`} className="btn-premium text-xs">{t("nav.compare")}</Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
