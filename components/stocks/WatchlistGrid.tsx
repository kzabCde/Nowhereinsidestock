"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWatchlistStore } from "@/store/watchlist-store";
import type { QuoteResponse } from "@/lib/types/market";

export function WatchlistGrid() {
  const watchlist = useWatchlistStore((s) => s.watchlist);
  const removeStock = useWatchlistStore((s) => s.removeStock);
  const [quotes, setQuotes] = useState<Record<string, QuoteResponse>>({});

  useEffect(() => {
    if (!watchlist.length) return;
    const load = async () => {
      const entries = await Promise.all(watchlist.map(async (item) => { const res = await fetch(`/api/quote/${item.symbol}`, { cache: "no-store" }); if (!res.ok) return null; return [item.symbol, (await res.json()) as QuoteResponse] as const; }));
      setQuotes(Object.fromEntries(entries.filter((e): e is readonly [string, QuoteResponse] => e !== null)));
    };
    void load();
  }, [watchlist]);

  if (!watchlist.length) return <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">No stocks in watchlist yet.</div>;

  return <div className="space-y-2">{watchlist.map((item) => { const q = quotes[item.symbol]; const change = q?.changePercent ?? item.changePercent ?? 0; return <article key={item.symbol} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.symbol}</p><p className="text-sm text-slate-300">{q ? `$${q.latestPrice.toFixed(2)}` : "Loading..."}</p><p className={`text-xs ${change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{change.toFixed(2)}%</p></div><div className="flex gap-2"><Link href={`/stocks/${item.symbol}`} className="btn-premium">View</Link><button onClick={() => removeStock(item.symbol)} className="btn-premium">Remove</button></div></article>; })}</div>;
}
