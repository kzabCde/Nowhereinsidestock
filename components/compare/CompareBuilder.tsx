"use client";

import { useEffect, useMemo, useState } from "react";
import { CompareSearchBar } from "@/components/compare/CompareSearchBar";
import { CompareSearchResults, type SearchSymbolItem } from "@/components/compare/CompareSearchResults";
import { CompareDropZone } from "@/components/compare/CompareDropZone";
import { CompareResultChart } from "@/components/compare/CompareResultChart";
import { CompareMetricsTable } from "@/components/compare/CompareMetricsTable";
import { CompareSummaryCards } from "@/components/compare/CompareSummaryCards";
import type { CompareApiResponse, CompareRange, CompareSeries } from "@/lib/types/compare";

const RANGES: CompareRange[] = ["1M", "6M", "1Y", "5Y"];

export function CompareBuilder() {
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchSymbolItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [range, setRange] = useState<CompareRange>("6M");
  const [loadingResult, setLoadingResult] = useState(false);
  const [result, setResult] = useState<CompareApiResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("compareSymbols");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      const sanitized = parsed.map((s) => s.toUpperCase()).filter((s, i, arr) => s && arr.indexOf(s) === i).slice(0, 4);
      setSelected(sanitized);
    } catch {
      setSelected([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("compareSymbols", JSON.stringify(selected));
  }, [selected]);

  useEffect(() => {
    const id = setTimeout(async () => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as SearchSymbolItem[];
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  const addSymbol = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized || selected.includes(normalized) || selected.length >= 4) return;
    setSelected((prev) => [...prev, normalized]);
  };

  const removeSymbol = (symbol: string) => {
    setSelected((prev) => prev.filter((s) => s !== symbol));
  };

  const fetchResult = async (targetRange: CompareRange = range) => {
    if (selected.length < 2 || selected.length > 4) return;
    setLoadingResult(true);
    setResultError(null);
    try {
      const res = await fetch(`/api/compare?symbols=${selected.join(",")}&range=${targetRange}`, { cache: "no-store" });
      const data = (await res.json()) as CompareApiResponse | { error: string };
      if (!res.ok || "error" in data) {
        setResultError("error" in data ? data.error : "Failed to compare symbols");
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setResultError("Unable to load comparison data.");
      setResult(null);
    } finally {
      setLoadingResult(false);
    }
  };

  const summary = useMemo(() => buildSummary(result?.series ?? []), [result]);

  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <section className="printstream-shell pearl-border rounded-3xl p-4 sm:p-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Compare Builder</h1>
          <CompareSearchBar query={query} onChange={setQuery} loading={searchLoading} />
          <CompareSearchResults results={searchResults} loading={searchLoading} query={query} onAdd={addSymbol} />
          <CompareDropZone selected={selected} onRemove={removeSymbol} onDropSymbol={addSymbol} onClearAll={() => { setSelected([]); setResult(null); }} />
          <div className="mt-3 flex flex-wrap gap-2">
            {RANGES.map((item) => (
              <button key={item} onClick={() => { setRange(item); if (result) void fetchResult(item); }} className={`rounded-xl border px-3 py-1 text-xs ${range === item ? "border-cyan-300 text-cyan-200" : "border-white/20 text-slate-300"}`}>
                {item}
              </button>
            ))}
          </div>
          <button disabled={selected.length < 2 || loadingResult} onClick={() => void fetchResult()} className="btn-premium mt-4 disabled:cursor-not-allowed disabled:opacity-50">Result</button>
        </section>

        {loadingResult && <section className="printstream-shell pearl-border rounded-3xl p-6">Loading comparison result...</section>}
        {resultError && <section className="printstream-shell rounded-3xl border border-rose-300/40 p-6 text-rose-200">{resultError}</section>}
        {result && !loadingResult && (
          <>
            <CompareResultChart series={result.series} />
            <CompareMetricsTable series={result.series} />
            <CompareSummaryCards summary={summary} />
          </>
        )}
      </div>
    </main>
  );
}

function buildSummary(series: CompareSeries[]) {
  if (series.length === 0) return null;
  const by = (pick: (item: CompareSeries) => number, dir: "max" | "min") =>
    series.reduce((best, cur) => (dir === "max" ? (pick(cur) > pick(best) ? cur : best) : pick(cur) < pick(best) ? cur : best), series[0]);
  return {
    bestPerformer: by((s) => s.metrics.totalReturn, "max").symbol,
    lowestVolatility: by((s) => s.metrics.volatility, "min").symbol,
    strongestMomentum: by((s) => s.metrics.totalReturn - s.metrics.volatility, "max").symbol,
    mostStable: by((s) => Math.abs(s.metrics.totalReturn), "min").symbol
  };
}
