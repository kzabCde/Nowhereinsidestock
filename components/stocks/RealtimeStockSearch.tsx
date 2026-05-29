"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { SearchItem } from "@/lib/types/market";

type RealtimeStockSearchProps = {
  placeholder?: string;
  onSelect?: (symbol: string) => void;
};

type SearchResponse = {
  results: SearchItem[];
};

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;

function isSearchItem(value: unknown): value is SearchItem {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.symbol === "string" &&
    (record.name === undefined || typeof record.name === "string") &&
    (record.exchange === undefined || typeof record.exchange === "string") &&
    (record.quoteType === undefined || typeof record.quoteType === "string")
  );
}

function parseSearchResponse(value: unknown): SearchResponse {
  if (typeof value !== "object" || value === null) return { results: [] };
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.results)) return { results: [] };
  return { results: record.results.filter(isSearchItem) };
}

export function RealtimeStockSearch({ placeholder = "Search stock symbol...", onSelect }: RealtimeStockSearchProps) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(0);
  }, []);

  const selectSymbol = useCallback(
    (symbol: string) => {
      const cleanSymbol = symbol.trim().toUpperCase();
      if (!cleanSymbol) return;
      abortRef.current?.abort();
      setQuery("");
      setResults([]);
      setError(null);
      setLoading(false);
      closeDropdown();

      if (onSelect) {
        onSelect(cleanSymbol);
        return;
      }

      router.push(`/stocks/${encodeURIComponent(cleanSymbol)}`);
    },
    [closeDropdown, onSelect, router]
  );

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) closeDropdown();
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [closeDropdown]);

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setResults([]);
      setError(null);
      setLoading(false);
      closeDropdown();
      return;
    }

    abortRef.current?.abort();
    setIsOpen(true);
    setLoading(true);
    setError(null);

    const timeoutId = window.setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      void fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("Search failed");
          const data: unknown = await response.json();
          setResults(parseSearchResponse(data).results);
          setHighlightedIndex(0);
        })
        .catch((searchError: unknown) => {
          if (searchError instanceof DOMException && searchError.name === "AbortError") return;
          setResults([]);
          setError("Search is unavailable. Please try again.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      abortRef.current?.abort();
    };
  }, [closeDropdown, trimmedQuery]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex((current) => (results.length === 0 ? 0 : (current + 1) % results.length));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex((current) => (results.length === 0 ? 0 : (current - 1 + results.length) % results.length));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[highlightedIndex] ?? results[0];
      if (selected) selectSymbol(selected.symbol);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
    }
  };

  const showDropdown = isOpen && trimmedQuery.length >= MIN_QUERY_LENGTH;
  const showEmpty = !loading && !error && results.length === 0;

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value.toUpperCase());
          setIsOpen(true);
        }}
        onFocus={() => {
          if (trimmedQuery.length >= MIN_QUERY_LENGTH) setIsOpen(true);
        }}
        onKeyDown={onKeyDown}
        aria-autocomplete="list"
        aria-controls={showDropdown ? listboxId : undefined}
        aria-expanded={showDropdown}
        className="h-14 w-full min-w-0 rounded-2xl border border-white/20 bg-black/50 px-4 text-base uppercase outline-none transition placeholder:normal-case placeholder:text-slate-500 focus:border-cyan-300 sm:px-5 sm:text-lg"
        placeholder={placeholder}
        type="search"
      />

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 w-full min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div id={listboxId} role="listbox" className="max-h-80 overflow-y-auto p-2">
            {loading && <p className="px-3 py-3 text-sm text-slate-300">Searching...</p>}
            {error && <p className="px-3 py-3 text-sm text-rose-300">{error}</p>}
            {showEmpty && <p className="px-3 py-3 text-sm text-slate-400">No results found.</p>}
            {!error &&
              results.map((item, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={`${item.symbol}-${item.exchange ?? "exchange"}`}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectSymbol(item.symbol)}
                    className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${
                      isHighlighted ? "border border-cyan-300/40 bg-white/10" : "border border-transparent hover:bg-white/5"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{item.symbol}</span>
                      <span className="block truncate text-xs text-slate-300">{item.name || "Unknown company"}</span>
                    </span>
                    <span className="max-w-[38%] shrink-0 truncate rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-400">
                      {item.exchange || item.quoteType || "Market"}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
