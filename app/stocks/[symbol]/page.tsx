"use client";

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

  const insights = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Trend", value: data.insight.trend, tone: data.insight.trend === "bullish" ? "positive" : data.insight.trend === "bearish" ? "negative" : "neutral" as const },
      { label: "Momentum", value: data.insight.momentum, tone: "neutral" as const },
      { label: "RSI", value: data.insight.rsiSignal, tone: "neutral" as const },
      { label: "MACD", value: data.insight.macdSignal, tone: "neutral" as const },
      { label: "Volatility", value: `${data.insight.volatility}%`, tone: "neutral" as const }
    ];
  }, [data]);

  if (!data) return <main className="p-6">Loading...</main>;
  return <main className="mx-auto max-w-6xl space-y-5 p-6"><div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"><h1 className="text-2xl font-bold">{data.name ?? data.symbol} ({data.symbol})</h1><p className="text-slate-300">${data.latestPrice.toFixed(2)} • {data.changePercent.toFixed(2)}%</p><div className="mt-3"><FavoriteButton stock={{ symbol: data.symbol, name: data.name, exchange: data.exchange, price: data.latestPrice, changePercent: data.changePercent }} /></div></div><div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">{insights.map((item) => <InsightCard key={item.label} label={item.label} value={item.value} tone={item.tone} />)}</div><PriceChart data={data} /><section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="mb-2 font-semibold">AI Insight</h2><p className="text-sm text-slate-300">Trend is {data.insight.trend}, momentum is {data.insight.momentum}, with {data.insight.rsiSignal} RSI and a {data.insight.macdSignal} MACD signal.</p></section></main>;
}
