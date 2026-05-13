"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { ThaiStockSummary } from "@/components/stocks/ThaiStockSummary";
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


  const thaiTrend = useMemo(() => {
    if (!data) return "sideway" as const;
    if (data.insight.trend === "bullish") return "uptrend" as const;
    if (data.insight.trend === "bearish") return "downtrend" as const;
    return "sideway" as const;
  }, [data]);

  const trendTone = useMemo(() => {
    if (!data) return "neutral" as const;
    if (data.insight.trend === "bullish") return "positive" as const;
    if (data.insight.trend === "bearish") return "negative" as const;
    return "neutral" as const;
  }, [data]);

  if (!data) return <main className="p-4 sm:p-6">Loading...</main>;

  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <Link href="/" className="btn-premium inline-flex">← Back to Dashboard</Link>

        <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm tracking-widest text-slate-400">{data.symbol}</p>
              <h1 className="truncate text-3xl font-bold sm:text-4xl">{data.name ?? data.symbol}</h1>
              <p className="mt-2 text-3xl font-extrabold sm:text-4xl">${data.latestPrice.toFixed(2)}</p>
              <p className={`mt-1 text-sm ${data.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{data.changePercent >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}%</p>
            </div>
            <div className="space-y-2">
              <span className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase">Trend: {data.insight.trend}</span>
              <div><FavoriteButton stock={{ symbol: data.symbol, name: data.name, exchange: data.exchange, price: data.latestPrice, changePercent: data.changePercent }} /></div>
            </div>
          </div>
        </section>

        <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-3 sm:p-4">
          <PriceChart data={data} />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ThaiStockSummary
            symbol={data.symbol}
            name={data.name}
            latestPrice={data.latestPrice}
            changePercent={data.changePercent}
            trend={thaiTrend}
            momentum={data.insight.momentum}
            rsiSignal={data.insight.rsiSignal}
            macdSignal={data.insight.macdSignal}
            volatility={data.insight.volatility}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <InsightCard label="Trend" value={data.insight.trend.toUpperCase()} tone={trendTone} />
            <InsightCard label="Momentum" value={data.insight.momentum.toUpperCase()} tone="neutral" />
            <InsightCard label="RSI" value={data.insight.rsiSignal.toUpperCase()} tone="neutral" />
            <InsightCard label="MACD" value={data.insight.macdSignal.toUpperCase()} tone="neutral" />
            <InsightCard label="Volatility" value={`${data.insight.volatility}%`} tone="neutral" />
          </div>
        </section>
      </div>
    </main>
  );
}
