"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWatchlistStore } from "@/store/watchlist-store";
import type { QuoteResponse } from "@/lib/types/market";

export function WatchlistGrid() {
  const watchlist = useWatchlistStore((s) => s.watchlist);
  const removeStock = useWatchlistStore((s) => s.removeStock);
  const [quotes, setQuotes] = useState<Record<string, QuoteResponse>>({});

  useEffect(() => {
    if (!watchlist.length) return;
    void (async () => {
      const entries = await Promise.all(
        watchlist.map(async (item) => {
          const res = await fetch(`/api/quote/${item.symbol}`, { cache: "force-cache" });
          if (!res.ok) return null;
          const quote = (await res.json()) as QuoteResponse;
          return [item.symbol, quote] as const;
        })
      );
      setQuotes(Object.fromEntries(entries.filter((e): e is readonly [string, QuoteResponse] => e !== null)));
    })();
  }, [watchlist]);

  if (!watchlist.length) {
    return <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-slate-400">Your watchlist is empty. Search stocks or quick-add Magnificent Seven from home.</div>;
  }

  return <div className="grid gap-3 md:grid-cols-2">{watchlist.map((item) => {
    const q = quotes[item.symbol];
    return <article key={item.symbol} className="rounded-xl border border-white/10 bg-slate-900/70 p-4"><div className="flex justify-between"><div><h3 className="font-semibold">{q?.name ?? item.name ?? item.symbol}</h3><p className="text-xs text-slate-400">{item.symbol}</p></div><span className="text-xs">{q?.insight.trend ?? "-"}</span></div><p className="mt-2 text-lg">{q ? `$${q.latestPrice.toFixed(2)}` : "Loading..."}</p><div className="mt-3 flex gap-2"><button onClick={() => removeStock(item.symbol)} className="rounded-full bg-rose-500/20 px-3 py-1 text-xs text-rose-300">Remove</button><Link href={`/stocks/${item.symbol}`} className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-semibold text-black">View Details</Link></div></article>;
  })}</div>;
}
