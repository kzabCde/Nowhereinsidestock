"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";

type StockSearchSuggestion = { symbol: string; name?: string; exchange?: string; type?: string };
type SearchResponse = { results?: StockSearchSuggestion[]; stale?: boolean };
export type RealtimeStockSearchProps = { placeholder?: string; onSelect?: (symbol: string) => void; mode?: "navigate" | "callback"; layout?: "dropdown" | "inline"; maxResults?: number };
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;

function isSuggestion(value: unknown): value is StockSearchSuggestion {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.symbol === "string" && (item.name === undefined || typeof item.name === "string") && (item.exchange === undefined || typeof item.exchange === "string") && (item.type === undefined || typeof item.type === "string");
}
function parseSearchResponse(value: unknown, maxResults = 8): StockSearchSuggestion[] {
  if (!value || typeof value !== "object") return [];
  const response = value as SearchResponse;
  return Array.isArray(response.results) ? response.results.filter(isSuggestion).slice(0, maxResults) : [];
}

export function RealtimeStockSearch({ placeholder, onSelect, mode = "navigate", layout = "dropdown", maxResults = 8 }: RealtimeStockSearchProps) {
  const router = useRouter();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<{ query: string; results: StockSearchSuggestion[]; stale?: boolean; failed?: boolean }>();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { locale, t } = useI18n();
  const trimmedQuery = query.trim();
  const showDropdown = isOpen && trimmedQuery.length >= MIN_QUERY_LENGTH;

  const current = response?.query === trimmedQuery ? response : undefined;
  const results = current?.results ?? [];
  const isLoading = showDropdown && !current;
  const error = current?.failed ? t("search.error") : null;
  const activeIndex = results.length ? Math.max(0, Math.min(highlightedIndex, results.length - 1)) : -1;

  useEffect(() => {
    if (!showDropdown) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search request failed");
        const body = (await response.json()) as SearchResponse;
        const results = parseSearchResponse(body, maxResults);
        if (!controller.signal.aborted) setResponse({ query: trimmedQuery, results, stale: body.stale });
      } catch {
        if (!controller.signal.aborted) setResponse({ query: trimmedQuery, results: [], failed: true });
      }
    }, DEBOUNCE_MS);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [maxResults, showDropdown, trimmedQuery]);

  useEffect(() => {
    if (!showDropdown || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeIndex, showDropdown]);
  useEffect(() => { optionRefs.current = optionRefs.current.slice(0, results.length); }, [results.length]);
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) { setIsOpen(false); setHighlightedIndex(-1); }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectSymbol = (symbol: string) => {
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (!normalizedSymbol) return;
    setQuery(normalizedSymbol); setIsOpen(false); setHighlightedIndex(-1); onSelect?.(normalizedSymbol);
    if (mode === "navigate") router.push(`/stocks/${encodeURIComponent(normalizedSymbol)}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && layout !== "inline") { event.preventDefault(); setIsOpen(false); setHighlightedIndex(-1); return; }
    if (event.key === "ArrowDown") { event.preventDefault(); setIsOpen(true); setHighlightedIndex((current) => results.length === 0 ? -1 : current >= results.length - 1 ? 0 : current + 1); return; }
    if (event.key === "ArrowUp") { event.preventDefault(); setIsOpen(true); setHighlightedIndex((current) => results.length === 0 ? -1 : current <= 0 ? results.length - 1 : current - 1); return; }
    if (event.key === "Enter") { event.preventDefault(); const selected = results[activeIndex] ?? results[0]; if (selected) selectSymbol(selected.symbol); }
  };

  const resultList = showDropdown ? (
    <div id={listboxId} role="listbox" className={layout === "inline" ? "mt-2 w-full min-w-0 text-left" : "absolute left-0 right-0 z-30 mt-2 w-full min-w-0 overflow-x-hidden rounded-2xl border border-[#d6b36a]/14 bg-[#100e0a]/98 p-2 text-left shadow-elevated backdrop-blur-xl"}>
      {isLoading && <div className="px-3 py-3 text-sm text-slate-400">{locale === "th" ? "กำลังค้นหา…" : "Loading suggestions…"}</div>}
      {!isLoading && error && <div className="px-3 py-3 text-sm text-danger">{error}</div>}
      {!isLoading && !error && results.length === 0 && trimmedQuery.length >= MIN_QUERY_LENGTH && <div className="px-3 py-3 text-sm text-slate-500">{t("search.noResults")}</div>}
      {current?.stale && <p className="px-3 py-2 text-xs text-warning">{locale === "th" ? "ผลค้นหาล่าสุดที่มี" : "Showing last available suggestions."}</p>}
      {!error && results.length > 0 && (
        <div className={`min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain motion-safe:scroll-smooth pr-1 [scrollbar-color:rgba(214,179,106,0.28)_transparent] [scrollbar-width:thin] ${layout === "inline" ? "max-h-[420px]" : "max-h-[220px]"}`}>
          {results.map((item, index) => {
            const isHighlighted = index === activeIndex;
            const label = item.name ?? (locale === "th" ? "ไม่ทราบชื่อบริษัท" : "Unknown company");
            return (
              <button key={item.symbol} ref={(element) => { optionRefs.current[index] = element; }} id={`${listboxId}-${index}`} type="button" role="option" aria-selected={isHighlighted} onMouseEnter={() => setHighlightedIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => selectSymbol(item.symbol)} className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-all ${isHighlighted ? "border-accent/20 bg-accent/[0.08] text-[#fff8e7]" : "border-transparent text-slate-200 hover:border-[#d6b36a]/10 hover:bg-[#fff8e7]/[0.025]"}`}>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold tracking-wide text-[#fff8e7]">{item.symbol}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{label}</span></span>
                <span className="flex max-w-[42%] shrink-0 flex-col items-end gap-1 text-[9px] uppercase tracking-[0.12em] text-[#8f7b55] sm:flex-row sm:items-center">{item.exchange && <span className="max-w-full truncate rounded-full border border-[#d6b36a]/12 bg-[#d6b36a]/[0.035] px-2 py-1">{item.exchange}</span>}{item.type && <span className="max-w-full truncate rounded-full border border-[#d6b36a]/12 bg-[#d6b36a]/[0.035] px-2 py-1">{item.type}</span>}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <input aria-label={t("search.title")} maxLength={80} value={query} onChange={(event) => { setQuery(event.target.value); setHighlightedIndex(-1); setIsOpen(true); }} onFocus={() => setIsOpen(true)} onKeyDown={handleKeyDown} role="combobox" aria-autocomplete="list" aria-expanded={showDropdown} aria-controls={listboxId} aria-activedescendant={showDropdown && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined} className="h-12 w-full min-w-0 rounded-xl border border-[#d6b36a]/14 bg-[#0d0c09]/90 px-4 text-sm font-medium uppercase text-[#fff8e7] outline-none transition-all placeholder:font-normal placeholder:normal-case placeholder:text-slate-600 focus:border-accent/50 focus:bg-[#12100c] focus:ring-2 focus:ring-accent/10 sm:px-4 sm:text-base" placeholder={placeholder ?? t("search.placeholder")} autoComplete="off" spellCheck={false} />
      {layout === "inline" ? resultList : showDropdown ? resultList : null}
    </div>
  );
}
