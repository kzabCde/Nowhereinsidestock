"use client";

import { useEffect, useMemo, useState } from "react";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { useMarketStore } from "@/lib/store/useMarketStore";

export default function HomePage() {
  const [input, setInput] = useState("AAPL");
  const { data, loading, error, fetchData } = useMarketStore();

  useEffect(() => {
    void fetchData("AAPL");
  }, [fetchData]);

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
    <main className="mx-auto min-h-screen max-w-7xl p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">NowhereInsideStock</h1>
          <p className="text-sm text-slate-400">See the trend. Read the signal.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void fetchData(input.toUpperCase());
          }}
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 uppercase outline-none" placeholder="AAPL" />
          <button className="rounded-xl bg-accent px-4 py-2 font-semibold text-black hover:opacity-90">Analyze</button>
        </form>
      </header>

      {loading && <div className="h-96 animate-pulse rounded-2xl bg-white/5" />}
      {error && <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-danger">{error}</div>}
      {data && !loading && (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {insights.map((item) => (
              <InsightCard key={item.label} label={item.label} value={item.value} tone={item.tone} />
            ))}
          </div>
          <PriceChart data={data} />
        </section>
      )}
    </main>
  );
}
