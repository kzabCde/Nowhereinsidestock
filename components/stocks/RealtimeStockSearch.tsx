"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

type StockSearchSuggestion = {
  symbol: string;
  name?: string;
  exchange?: string;
  type?: string;
};

type SearchResponse = {
  results?: StockSearchSuggestion[];
};

export type RealtimeStockSearchProps = {
  placeholder?: string;
  onSelect?: (symbol: string) => void;
  mode?: "navigate" | "callback";
};

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 1;

function isSuggestion(value: unknown): value is StockSearchSuggestion {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;
  return (
    typeof item.symbol === "string" &&
    (item.name === undefined || typeof item.name === "string") &&
    (item.exchange === undefined || typeof item.exchange === "string") &&
    (item.type === undefined || typeof item.type === "string")
  );
}

function parseSearchResponse(value: unknown): StockSearchSuggestion[] {
  if (!value || typeof value !== "object") return [];

  const response = value as SearchResponse;
  if (!Array.isArray(response.results)) return [];

  return response.results.filter(isSuggestion).slice(0, 8);
}

export function RealtimeStockSearch({
  placeholder = "Search stock symbol...",
  onSelect,
  mode = "navigate"
}: RealtimeStockSearchProps) {
  const router = useRouter();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<StockSearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const trimmedQuery = query.trim();
  const showDropdown = isOpen && trimmedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [trimmedQuery]);

  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const data: unknown = await response.json();
        const suggestions = parseSearchResponse(data);
        setResults(suggestions);
        setHighlightedIndex(suggestions.length > 0 ? 0 : -1);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") return;
        setResults([]);
        setHighlightedIndex(-1);
        setError("Unable to load suggestions. Try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectSymbol = (symbol: string) => {
    const normalizedSymbol = symbol.trim().toUpperCase();
    if (!normalizedSymbol) return;

    setQuery(normalizedSymbol);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect?.(normalizedSymbol);

    if (mode === "navigate") {
      router.push(`/stocks/${encodeURIComponent(normalizedSymbol)}`);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((current) => {
        if (results.length === 0) return -1;
        return current >= results.length - 1 ? 0 : current + 1;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((current) => {
        if (results.length === 0) return -1;
        return current <= 0 ? results.length - 1 : current - 1;
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[highlightedIndex] ?? results[0];
      if (selected) selectSymbol(selected.symbol);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value.toUpperCase());
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-${highlightedIndex}` : undefined}
        className="h-14 w-full min-w-0 rounded-3xl border border-white/15 bg-black/35 px-4 text-base uppercase text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/60 focus:bg-black/45 focus:ring-2 focus:ring-cyan-200/15 sm:px-5 sm:text-lg"
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-2 max-h-80 w-full min-w-0 overflow-y-auto overflow-x-hidden rounded-3xl border border-white/15 bg-zinc-950/95 p-2 text-left shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          {isLoading && <div className="px-3 py-3 text-sm text-slate-300">Loading suggestions…</div>}

          {!isLoading && error && <div className="px-3 py-3 text-sm text-rose-300">{error}</div>}

          {!isLoading && !error && results.length === 0 && debouncedQuery.length >= MIN_QUERY_LENGTH && (
            <div className="px-3 py-3 text-sm text-slate-400">No matching stocks found.</div>
          )}

          {!error && results.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            const label = item.name ?? "Unknown company";

            return (
              <button
                key={item.symbol}
                id={`${listboxId}-${index}`}
                type="button"
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSymbol(item.symbol)}
                className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${
                  isHighlighted ? "bg-cyan-300/15 text-white" : "text-slate-100 hover:bg-white/10"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold tracking-wide text-white sm:text-base">{item.symbol}</span>
                  <span className="block truncate text-xs text-slate-400 sm:text-sm">{label}</span>
                </span>
                <span className="flex max-w-[42%] shrink-0 flex-col items-end gap-1 text-[0.65rem] uppercase tracking-wide text-slate-400 sm:flex-row sm:items-center sm:text-xs">
                  {item.exchange && <span className="max-w-full truncate rounded-full border border-white/10 px-2 py-1">{item.exchange}</span>}
                  {item.type && <span className="max-w-full truncate rounded-full border border-white/10 px-2 py-1">{item.type}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
