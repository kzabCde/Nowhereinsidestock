"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import type { QuoteResponse } from "@/lib/types/market";

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol.toUpperCase();
  const [data, setData] = useState<QuoteResponse | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/quote/${symbol}`, { cache: "force-cache" });
      if (res.ok) setData((await res.json()) as QuoteResponse);
    })();
  }, [symbol]);

  const trendTone = useMemo(() => {
    if (!data) return "neutral" as const;
    if (data.insight.trend === "bullish") return "positive" as const;
    if (data.insight.trend === "bearish") return "negative" as const;
    return "neutral" as const;
  }, [data]);

  if (!data) return <main className="p-6">Loading...</main>;

  return (
    <main className="grid-overlay min-h-screen">
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <Link href="/" className="btn-premium inline-flex">← Back to Dashboard</Link>

        <section className="printstream-shell pearl-border rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm tracking-widest text-slate-400">{data.symbol}</p>
              <h1 className="text-3xl font-bold md:text-4xl">{data.name ?? data.symbol}</h1>
              <p className="mt-2 text-4xl font-extrabold">${data.latestPrice.toFixed(2)}</p>
              <p className={`mt-1 text-sm ${data.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{data.changePercent >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}%</p>
            </div>
            <div className="space-y-2">
              <span className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase">Trend: {data.insight.trend}</span>
              <div><FavoriteButton stock={{ symbol: data.symbol, name: data.name, exchange: data.exchange, price: data.latestPrice, changePercent: data.changePercent }} /></div>
            </div>
          </div>
        </section>

        <section className="printstream-shell pearl-border rounded-3xl p-4">
          <PriceChart data={data} />
        </section>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <InsightCard label="Trend" value={data.insight.trend.toUpperCase()} tone={trendTone} />
          <InsightCard label="Momentum" value={data.insight.momentum.toUpperCase()} tone="neutral" />
          <InsightCard label="RSI" value={data.insight.rsiSignal.toUpperCase()} tone="neutral" />
          <InsightCard label="MACD" value={data.insight.macdSignal.toUpperCase()} tone="neutral" />
          <InsightCard label="Volatility" value={`${data.insight.volatility}%`} tone="neutral" />
        </div>
      </div>
    </main>
  );
}
