"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWatchlistStore } from "@/store/watchlist-store";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { SectionCard } from "@/components/ui/SectionCard";
import type { QuoteResponse } from "@/lib/types/market";

const mag7 = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"];

export function WatchlistGrid() {
  const watchlist = useWatchlistStore((s) => s.watchlist);
  const removeStock = useWatchlistStore((s) => s.removeStock);
  const addStock = useWatchlistStore((s) => s.addStock);
  const [quotes, setQuotes] = useState<Record<string, QuoteResponse>>({});

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
        title="No favorites yet"
        description="Start from rankings, search, or quick-add a Magnificent Seven stock to build your watchlist."
        actions={
          <>
            <PremiumButton href="/rankings" tone="primary">Browse rankings</PremiumButton>
            {mag7.map((symbol) => (
              <PremiumButton key={symbol} onClick={() => addStock({ symbol })}>+ {symbol}</PremiumButton>
            ))}
          </>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {watchlist.map((item) => {
        const q = quotes[item.symbol];
        const positive = (q?.changePercent ?? item.changePercent ?? 0) >= 0;
        return (
          <SectionCard key={item.symbol} as="article" className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{item.symbol}</p>
                <h3 className="mt-2 truncate text-xl font-semibold text-white">{q?.name ?? item.name ?? item.symbol}</h3>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase text-slate-300">{q?.insight.trend ?? "loading"}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Latest price" value={q ? `$${q.latestPrice.toFixed(2)}` : "Loading..."} />
              <MetricCard label="Change" value={q ? `${positive ? "+" : ""}${q.changePercent.toFixed(2)}%` : "—"} tone={positive ? "positive" : "negative"} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button onClick={() => removeStock(item.symbol)} className="btn-premium w-full border-rose-300/30 text-rose-200 sm:w-auto">Remove</button>
              <Link href={`/stocks/${item.symbol}`} className="btn-premium w-full text-center sm:w-auto">View Detail</Link>
              <Link href={`/compare?symbols=${item.symbol}`} className="btn-premium w-full text-center sm:w-auto">Add to Compare</Link>
            </div>
          </SectionCard>
        );
      })}
    </div>
  );
}
