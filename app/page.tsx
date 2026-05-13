"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import { useMarketStore } from "@/lib/store/useMarketStore";
import type { SearchItem } from "@/lib/types/market";

export default function HomePage() {
  const [input, setInput] = useState("AAPL");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const { data, loading, error, fetchData } = useMarketStore();

  useEffect(() => { void fetchData("AAPL"); }, [fetchData]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 350);
    return () => clearTimeout(t);
  }, [input]);
  useEffect(() => {
    if (debounced.length < 2) return setResults([]);
    void (async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`);
      if (res.ok) setResults((await res.json()) as SearchItem[]);
    })();
  }, [debounced]);

  const insights = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Trend", value: data.insight.trend.toUpperCase(), tone: data.insight.trend === "bullish" ? "positive" : data.insight.trend === "bearish" ? "negative" : "neutral" },
      { label: "Momentum", value: data.insight.momentum.toUpperCase(), tone: data.insight.momentum === "strong" ? "positive" : "neutral" },
      { label: "RSI Signal", value: data.insight.rsiSignal.toUpperCase(), tone: data.insight.rsiSignal === "overbought" ? "negative" : data.insight.rsiSignal === "oversold" ? "positive" : "neutral" },
      { label: "MACD", value: data.insight.macdSignal.toUpperCase(), tone: data.insight.macdSignal === "buy" ? "positive" : data.insight.macdSignal === "sell" ? "negative" : "neutral" },
      { label: "Volatility", value: `${data.insight.volatility}%`, tone: "neutral" }
    ] as const;
  }, [data]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 p-6 lg:p-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">NowhereInsideStock</h1><p className="text-sm text-slate-400">See the trend. Read the signal.</p></div>
        <div className="flex gap-2"><Link href="/watchlist" className="rounded-xl bg-white/10 px-4 py-2">Watchlist</Link><form className="flex gap-2" onSubmit={(e) => {e.preventDefault(); void fetchData(input.toUpperCase());}}><input value={input} onChange={(e) => setInput(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 uppercase outline-none" placeholder="Search symbol" /><button className="rounded-xl bg-accent px-4 py-2 font-semibold text-black hover:opacity-90">Analyze</button></form></div>
      </header>

      {results.length > 0 && <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-3"><p className="mb-2 text-sm text-slate-400">Search Results</p><div className="grid gap-2 md:grid-cols-2">{results.map((item) => <div key={item.symbol} className="flex items-center justify-between rounded-xl bg-white/5 p-2"><div><p className="font-medium">{item.shortname ?? item.symbol}</p><p className="text-xs text-slate-400">{item.symbol} • {item.exchDisp ?? "-"}</p></div><div className="flex gap-2"><FavoriteButton stock={{ symbol: item.symbol, name: item.shortname, exchange: item.exchDisp }} /><Link href={`/stocks/${item.symbol}`} className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-semibold text-black">View</Link></div></div>)}</div></section>}

      <MagnificentSeven />
      {loading && <div className="h-96 animate-pulse rounded-2xl bg-white/5" />}
      {error && <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-danger">{error}</div>}
      {data && !loading && <section className="space-y-6"><div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">{insights.map((item) => <InsightCard key={item.label} label={item.label} value={item.value} tone={item.tone} />)}</div><PriceChart data={data} /></section>}
    </main>
  );
}
