"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CompareCorrelationMatrix } from "@/components/compare/CompareCorrelationMatrix";
import { CompareSearchBar } from "@/components/compare/CompareSearchBar";
import { CompareSearchResults, type SearchSymbolItem } from "@/components/compare/CompareSearchResults";
import { CompareDropZone } from "@/components/compare/CompareDropZone";
import { CompareResultChart } from "@/components/compare/CompareResultChart";
import { CompareMetricsTable } from "@/components/compare/CompareMetricsTable";
import { CompareSummaryCards } from "@/components/compare/CompareSummaryCards";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { CompareApiResponse, CompareRange, CompareSeries } from "@/lib/types/compare";

const RANGES: CompareRange[] = ["1M", "6M", "1Y", "5Y"];
type SearchApiResponse = { results?: SearchSymbolItem[] };

function parseSearchResponse(value: unknown): SearchSymbolItem[] {
  if (!value || typeof value !== "object") return [];
  const data = value as SearchApiResponse;
  return Array.isArray(data.results) ? data.results : [];
}

function sanitizeSymbols(symbols: string[]) {
  return symbols.map((s) => s.trim().toUpperCase()).filter((s, i, arr) => s && arr.indexOf(s) === i).slice(0, 4);
}

export function CompareBuilder() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchSymbolItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [range, setRange] = useState<CompareRange>("6M");
  const [loadingResult, setLoadingResult] = useState(false);
  const [result, setResult] = useState<CompareApiResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const { locale, t } = useI18n();

  useEffect(() => {
    const urlSymbols = sanitizeSymbols((searchParams.get("symbols") ?? "").split(","));
    if (urlSymbols.length > 0) {
      setSelected(urlSymbols);
      return;
    }
    const raw = localStorage.getItem("compareSymbols");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      setSelected(sanitizeSymbols(parsed));
    } catch {
      setSelected([]);
    }
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem("compareSymbols", JSON.stringify(selected));
  }, [selected]);

  useEffect(() => {
    const controller = new AbortController();
    const id = setTimeout(async () => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: controller.signal });
        if (!res.ok) {
          setSearchResults([]);
          return;
        }
        const data: unknown = await res.json();
        setSearchResults(parseSearchResponse(data));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [query]);

  const addSymbol = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized || selected.includes(normalized) || selected.length >= 4) return;
    setSelected((prev) => [...prev, normalized]);
  };

  const removeSymbol = (symbol: string) => setSelected((prev) => prev.filter((s) => s !== symbol));

  const fetchResult = async (targetRange: CompareRange = range) => {
    if (selected.length < 2 || selected.length > 4) return;
    setLoadingResult(true);
    setResultError(null);
    try {
      const res = await fetch(`/api/compare?symbols=${selected.join(",")}&range=${targetRange}`, { cache: "no-store" });
      const data = (await res.json()) as CompareApiResponse | { error: string };
      if (!res.ok || "error" in data) {
        setResultError("error" in data ? data.error : (locale === "th" ? "ไม่สามารถเปรียบเทียบหุ้นได้" : "Failed to compare symbols"));
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setResultError(locale === "th" ? "ไม่สามารถโหลดข้อมูลเปรียบเทียบได้" : "Unable to load comparison data.");
      setResult(null);
    } finally {
      setLoadingResult(false);
    }
  };

  const summary = useMemo(() => buildSummary(result?.series ?? []), [result]);

  return (
    <PageShell size="wide" className="space-y-6">
      <SectionCard>
        <p className="section-kicker">{t("compare.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{t("compare.title")}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{t("compare.description")}</p>
        <CompareSearchBar query={query} onChange={setQuery} loading={searchLoading} />
        <CompareSearchResults results={searchResults} loading={searchLoading} query={query} onAdd={addSymbol} />
        <CompareDropZone selected={selected} onRemove={removeSymbol} onDropSymbol={addSymbol} onClearAll={() => { setSelected([]); setResult(null); }} />
        <div className="mt-4 flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <button key={item} onClick={() => { setRange(item); if (result) void fetchResult(item); }} className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${range === item ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-50" : "border-white/15 bg-white/[0.035] text-slate-300 hover:bg-white/[0.06]"}`}>{item}</button>
          ))}
        </div>
        <button disabled={selected.length < 2 || loadingResult} onClick={() => void fetchResult()} className="btn-premium mt-5 w-full sm:w-auto">{t("compare.showResult")}</button>
      </SectionCard>

      {selected.length < 2 && <SectionCard variant="quiet" className="text-center text-slate-300">{t("compare.selectAtLeast")}</SectionCard>}
      {loadingResult && <LoadingSkeleton label={t("compare.loading")} />}
      {resultError && <ErrorState message={resultError} />}
      {result && !loadingResult && (
        <>
          <CompareResultChart series={result.series} />
          <CompareMetricsTable series={result.series} />
          <CompareCorrelationMatrix series={result.series} />
          <CompareSummaryCards summary={summary} />
        </>
      )}
    </PageShell>
  );
}

function buildSummary(series: CompareSeries[]) {
  if (series.length === 0) return null;
  const by = (pick: (item: CompareSeries) => number, dir: "max" | "min") => series.reduce((best, cur) => (dir === "max" ? (pick(cur) > pick(best) ? cur : best) : pick(cur) < pick(best) ? cur : best), series[0]);
  return {
    bestPerformer: by((s) => s.metrics.totalReturn, "max").symbol,
    lowestVolatility: by((s) => s.metrics.volatility, "min").symbol,
    strongestMomentum: by((s) => s.metrics.momentumScore ?? 0, "max").symbol,
    mostStable: by((s) => s.metrics.maxDrawdown ?? Math.abs(s.metrics.totalReturn), "min").symbol
  };
}
