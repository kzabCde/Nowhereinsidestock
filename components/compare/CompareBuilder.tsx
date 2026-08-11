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
import { PageHeader } from "@/components/ui/PageHeader";
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
      <PageHeader
        eyebrow={t("compare.eyebrow")}
        title={t("compare.title")}
        description={t("compare.description")}
        meta={<span className="badge-neutral">2–4 {locale === "th" ? "หลักทรัพย์" : "securities"}</span>}
      />

      <SectionCard className="space-y-5">
        <div className="relative z-[1] flex flex-col gap-2 border-b border-white/[0.055] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="section-kicker">{locale === "th" ? "ชุดเปรียบเทียบ" : "Comparison set"}</p><h2 className="mt-1.5 text-lg font-semibold text-white">{locale === "th" ? "เลือกหุ้นและช่วงเวลาที่ต้องการวิเคราะห์" : "Select securities and the analysis horizon"}</h2></div>
          <span className="text-xs text-slate-600">{selected.length}/4 {locale === "th" ? "รายการที่เลือก" : "selected"}</span>
        </div>
        <CompareSearchBar query={query} onChange={setQuery} loading={searchLoading} />
        <CompareSearchResults results={searchResults} loading={searchLoading} query={query} onAdd={addSymbol} />
        <CompareDropZone selected={selected} onRemove={removeSymbol} onDropSymbol={addSymbol} onClearAll={() => { setSelected([]); setResult(null); }} />
        <div className="flex flex-col gap-3 border-t border-white/[0.055] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/[0.06] bg-black/10 p-1">
            {RANGES.map((item) => (
              <button key={item} onClick={() => { setRange(item); if (result) void fetchResult(item); }} className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${range === item ? "bg-accent/[0.12] text-accent shadow-[0_1px_0_rgba(255,255,255,.04)_inset]" : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-300"}`}>{item}</button>
            ))}
          </div>
          <button disabled={selected.length < 2 || loadingResult} onClick={() => void fetchResult()} className="btn-primary w-full sm:w-auto">{t("compare.showResult")}</button>
        </div>
      </SectionCard>

      {selected.length < 2 && <SectionCard variant="quiet" className="text-center text-sm text-slate-500">{t("compare.selectAtLeast")}</SectionCard>}
      {loadingResult && <LoadingSkeleton label={t("compare.loading")} />}
      {resultError && <ErrorState message={resultError} />}
      {result && !loadingResult && (
        <div className="space-y-6">
          <CompareSummaryCards summary={summary} />
          <CompareResultChart series={result.series} />
          <CompareMetricsTable series={result.series} />
          <CompareCorrelationMatrix series={result.series} />
        </div>
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
