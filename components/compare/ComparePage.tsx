"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompareSeries, CompareStockResult, CompareTimeframe, WinnerSummary } from "@/lib/types/compare";
import { NormalizedCompareChart } from "@/components/compare/NormalizedCompareChart";
import { CompareInput } from "@/components/compare/CompareInput";
import { SelectedStockChips } from "@/components/compare/SelectedStockChips";
import { CompareTimeframeTabs } from "@/components/compare/CompareTimeframeTabs";
import { CompareMetricsTable } from "@/components/compare/CompareMetricsTable";
import { CompareWinnerSummary } from "@/components/compare/CompareWinnerSummary";

const presets = {
  "Magnificent Seven": ["AAPL", "MSFT", "NVDA", "AMZN"],
  "AI Stocks": ["NVDA", "AMD", "MSFT", "GOOGL"],
  "EV Stocks": ["TSLA", "RIVN", "NIO"],
  "Thai Stocks": ["PTT.BK", "AOT.BK", "CPALL.BK"]
} as const;

type Props = { initialSymbols: string[]; timeframe: CompareTimeframe; results: CompareStockResult[]; summary: WinnerSummary | null };

type SearchItem = { symbol: string; shortname?: string; exchDisp?: string };

export function ComparePage({ initialSymbols, timeframe, results, summary }: Props) {
  const [symbolInput, setSymbolInput] = useState("");
  const [symbols, setSymbols] = useState<string[]>(initialSymbols);
  const [search, setSearch] = useState<SearchItem[]>([]);

  useEffect(() => {
    localStorage.setItem("compareSymbols", JSON.stringify(symbols));
  }, [symbols]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (symbolInput.length < 2) return;
      void fetch(`/api/search?q=${encodeURIComponent(symbolInput)}`).then(async (r) => setSearch((await r.json()) as SearchItem[]));
    }, 250);
    return () => clearTimeout(id);
  }, [symbolInput]);

  const addSymbol = (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value || symbols.includes(value) || symbols.length >= 4) return;
    const next = [...symbols, value];
    setSymbols(next);
    window.location.href = `/compare?symbols=${next.join(",")}&timeframe=${timeframe}`;
  };

  const removeSymbol = (target: string) => {
    const next = symbols.filter((s) => s !== target);
    setSymbols(next);
    window.location.href = `/compare?symbols=${next.join(",")}&timeframe=${timeframe}`;
  };

  const validResults = useMemo<CompareSeries[]>(
    () =>
      results
        .filter((r) => !r.error)
        .map((r) => ({
          symbol: r.symbol,
          name: r.name,
          points: r.points.map((point) => ({
            date: point.date,
            close: point.close,
            normalized: point.normalized,
            percentChange: point.normalized - 100
          })),
          metrics: {
            latestPrice: r.metrics.latestPrice,
            totalReturn: r.metrics.totalReturn,
            volatility: r.metrics.volatility,
            trend: r.metrics.trendDirection === "bullish" ? "uptrend" : r.metrics.trendDirection === "bearish" ? "downtrend" : "sideway",
            rsiSignal: r.metrics.rsi.toFixed(2),
            macdSignal: r.metrics.macdSignal,
            averageVolume: r.metrics.averageVolume
          }
        })),
    [results]
  );

  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Compare Stocks</h1>
          <p className="text-sm text-slate-300 sm:text-base">Add 2-4 stock symbols and compare performance side by side.</p>
          <SelectedStockChips symbols={symbols} onRemove={removeSymbol} />
          <CompareInput value={symbolInput} onChange={setSymbolInput} onAdd={() => addSymbol(symbolInput)} results={search} onPick={addSymbol} />
          <div className="mt-3 flex flex-wrap gap-2">{Object.entries(presets).map(([name, list]) => <button key={name} onClick={() => { const next = Array.from(new Set(list)).slice(0, 4); setSymbols(next); window.location.href = `/compare?symbols=${next.join(",")}&timeframe=${timeframe}`; }} className="rounded-xl border border-white/20 px-3 py-1 text-xs">{name}</button>)}</div>
          <CompareTimeframeTabs symbols={symbols} timeframe={timeframe} />
        </section>

        {symbols.length < 2 ? <section className="printstream-shell rounded-2xl p-8 text-center text-slate-300">Select at least 2 stocks to compare.</section> : (
          <>
            <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-3 sm:p-4"><NormalizedCompareChart series={validResults} /></section>
            <CompareMetricsTable series={validResults} />
            {summary && <CompareWinnerSummary summary={summary} />}
          </>
        )}
      </div>
    </main>
  );
}
