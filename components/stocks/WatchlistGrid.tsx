"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWatchlistStore } from "@/store/watchlist-store";
import type { QuoteResponse } from "@/lib/types/market";

const mag7 = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"];

export function WatchlistGrid() {
  const watchlist = useWatchlistStore((s) => s.watchlist);
  const removeStock = useWatchlistStore((s) => s.removeStock);
  const addStock = useWatchlistStore((s) => s.addStock);
  const [quotes, setQuotes] = useState<Record<string, QuoteResponse>>({});

  useEffect(() => {
    if (!watchlist.length) return;
    void (async () => {
      const entries = await Promise.all(
        watchlist.map(async (item) => {
          const res = await fetch(`/api/quote/${item.symbol}`, { cache: "force-cache" });
          if (!res.ok) return null;
          return [item.symbol, (await res.json()) as QuoteResponse] as const;
        })
      );
      setQuotes(Object.fromEntries(entries.filter((e): e is readonly [string, QuoteResponse] => e !== null)));
    })();
  }, [watchlist]);

  if (!watchlist.length) {
    return (
      <div className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-2xl p-4 text-center sm:p-8">
        <p className="mb-4 text-sm text-slate-300 sm:text-base">No favorites yet. Quick-add a Magnificent Seven stock:</p>
        <div className="flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
          {mag7.map((symbol) => (
            <button key={symbol} onClick={() => addStock({ symbol })} className="btn-premium">+ {symbol}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {watchlist.map((item) => {
        const q = quotes[item.symbol];
        return (
          <article key={item.symbol} className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-2xl p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{q?.name ?? item.name ?? item.symbol}</h3>
                <p className="truncate text-xs text-slate-400">{item.symbol}</p>
              </div>
              <span className="text-xs uppercase text-slate-300">{q?.insight.trend ?? "-"}</span>
            </div>
            <p className="mt-2 text-xl font-semibold">{q ? `$${q.latestPrice.toFixed(2)}` : "Loading..."}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button onClick={() => removeStock(item.symbol)} className="btn-premium w-full border-rose-300/30 text-rose-200 sm:w-auto">Remove</button>
              <Link href={`/stocks/${item.symbol}`} className="btn-premium w-full text-center sm:w-auto">View Detail</Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
