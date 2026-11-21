"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
import { browserStorage } from "@/lib/client/browser-storage";
import type { CompareApiResponse, CompareRange, CompareSeries } from "@/lib/types/compare";

const savedCompare = browserStorage("compareSymbols");
const RANGES: CompareRange[] = ["1M", "6M", "1Y", "5Y"];
type SearchApiResponse = { results?: SearchSymbolItem[] };

function parseSearchResponse(value: unknown): SearchSymbolItem[] {
  if (!value || typeof value !== "object") return [];
  const data = value as SearchApiResponse;
  return Array.isArray(data.results) ? data.results : [];
}

function sanitizeSymbols(symbols: unknown) {
  if (!Array.isArray(symbols)) return [];
  return [...new Set(symbols.filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toUpperCase()).filter((value) => /^\^?[A-Z0-9][A-Z0-9.=-]{0,19}$/.test(value)))].slice(0, 4);
}

export function CompareBuilder() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [suggestionsStale, setSuggestionsStale] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchSymbolItem[]>([]);
  const [selection, setSelection] = useState<{ route: string; symbols: string[] }>();
  const urlList = searchParams.get("symbols") ?? "";
  const raw = useSyncExternalStore(savedCompare.subscribe, savedCompare.read, () => null);
  const selected = useMemo(() => {
    if (selection?.route === urlList) return selection.symbols;
    if (urlList) return sanitizeSymbols(urlList.split(","));
    try { return sanitizeSymbols(JSON.parse(raw ?? "[]")); } catch { return []; }
  }, [raw, selection, urlList]);
  const [range, setRange] = useState<CompareRange>("6M");
  const [loadingResult, setLoadingResult] = useState(false);
  const [result, setResult] = useState<CompareApiResponse | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const { locale, t } = useI18n();

  const activeComparison = useRef<AbortController | null>(null);
  useEffect(() => () => activeComparison.current?.abort(), []);

  function setSelected(symbols: string[]) {
    activeComparison.current?.abort();
    activeComparison.current = null;
    setLoadingResult(false);
    setResultError(null);
    setResult(null);
    setSelection({ route: urlList, symbols });
    savedCompare.write(JSON.stringify(symbols));
  }

  useEffect(() => {
    const controller = new AbortController();
    const id = setTimeout(async () => {
      setSearchError(false);
      setSuggestionsStale(false);
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Search unavailable");
        const data = await res.json() as SearchApiResponse & { stale?: boolean };
        if (controller.signal.aborted) return;
        setSearchResults(parseSearchResponse(data));
        setSuggestionsStale(data.stale === true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSearchResults([]);
        setSearchError(true);
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
    setSelected(sanitizeSymbols([...selected, normalized]));
  };

  const removeSymbol = (symbol: string) => setSelected(selected.filter((item) => item !== symbol));

  const fetchResult = async (targetRange: CompareRange = range) => {
    if (selected.length < 2 || selected.length > 4) return;
    activeComparison.current?.abort();
    const controller = new AbortController();
    activeComparison.current = controller;
    setLoadingResult(true);
    setResultError(null);
    try {
      const res = await fetch(`/api/compare?symbols=${encodeURIComponent(selected.join(","))}&range=${targetRange}`, { signal: controller.signal });
      const data = (await res.json()) as CompareApiResponse | { error: string };
      if (controller.signal.aborted) return;
      if (!res.ok || "error" in data) {
        setResultError("error" in data ? data.error : (locale === "th" ? "ไม่สามารถเปรียบเทียบหุ้นได้" : "Failed to compare symbols"));
      } else {
        setResult(data);
      }
    } catch {
      if (controller.signal.aborted) return;
      setResultError(locale === "th" ? "ไม่สามารถโหลดข้อมูลเปรียบเทียบได้" : "Unable to load comparison data.");
    } finally {
      if (activeComparison.current === controller) {
        activeComparison.current = null;
        setLoadingResult(false);
      }
    }
  };

  const visibleResult = result && result.symbols.join(",") === selected.join(",") ? result : null;
  const summary = useMemo(() => buildSummary(visibleResult?.series ?? []), [visibleResult]);

  return (
    <PageShell size="wide" className="space-y-6">
      <SectionCard>
        <p className="section-kicker">{t("compare.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{t("compare.title")}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{t("compare.description")}</p>
        <CompareSearchBar query={query} onChange={setQuery} loading={searchLoading} />
        {searchError ? <p role="status" className="mt-2 text-sm text-warning">{t("search.error")}</p> : <CompareSearchResults results={searchResults} loading={searchLoading} query={query} onAdd={addSymbol} />}
        {suggestionsStale && <p className="mt-2 text-xs text-warning">{locale === "th" ? "ผลค้นหาล่าสุดที่มี" : "Showing last available suggestions."}</p>}
        <CompareDropZone selected={selected} onRemove={removeSymbol} onDropSymbol={addSymbol} onClearAll={() => setSelected([])} />
        <div className="mt-4 flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <button key={item} aria-pressed={range === item} onClick={() => { setRange(item); if (visibleResult) void fetchResult(item); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${range === item ? "border-accent/50 bg-accent/10 text-accent" : "border-white/15 bg-white/[0.035] text-slate-300 hover:bg-white/[0.06]"}`}>{item}</button>
          ))}
        </div>
        <button disabled={selected.length < 2 || loadingResult} onClick={() => void fetchResult()} className="btn-premium mt-5 w-full sm:w-auto">{t("compare.showResult")}</button>
      </SectionCard>

      {selected.length < 2 && <SectionCard variant="quiet" className="text-center text-slate-300">{t("compare.selectAtLeast")}</SectionCard>}
      {loadingResult && (visibleResult ? <p role="status" className="text-sm text-slate-400">{t("compare.loading")}</p> : <LoadingSkeleton label={t("compare.loading")} />)}
      {resultError && <ErrorState message={resultError} />}
      {visibleResult && (
        <>
          {(resultError || visibleResult.series.some((item) => item.stale)) && <p role="status" className="text-sm text-warning">{locale === "th" ? "กำลังแสดงผลเปรียบเทียบล่าสุดที่มี" : "Showing the last available comparison."}</p>}
          <p className="text-xs text-slate-400">{visibleResult.range} · {visibleResult.baselineDate ?? "—"} – {visibleResult.endDate ?? "—"}</p>
          <CompareResultChart series={visibleResult.series} />
          <CompareMetricsTable series={visibleResult.series} />
          <CompareCorrelationMatrix series={visibleResult.series} />
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
    lowestVolatility: series.some((s) => s.metrics.volatility != null) ? by((s) => s.metrics.volatility ?? Infinity, "min").symbol : "—",
    strongestMomentum: series.some((s) => s.metrics.momentumScore != null) ? by((s) => s.metrics.momentumScore ?? -Infinity, "max").symbol : "—",
    mostStable: by((s) => s.metrics.maxDrawdown ?? Math.abs(s.metrics.totalReturn), "min").symbol
  };
}
