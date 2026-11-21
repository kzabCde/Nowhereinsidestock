"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuoteResponse, QuoteSnapshot } from "@/lib/types/market";

type View = "summary" | "technical" | "detail";
type QuoteFor<V extends View> = V extends "summary" ? QuoteSnapshot : QuoteResponse;
type QuoteMap<T> = Record<string, T | undefined>;
const clientBatchSize = 4;

export function useMarketQuotes<V extends View>(symbols: string[], view: V, intervalMs?: number) {
  const key = [...new Set(symbols)].sort().join(",");
  const [quotes, setQuotes] = useState<QuoteMap<QuoteFor<V>>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [refreshing, setRefreshing] = useState(false);
  const active = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (active.current || !key || document.hidden) return;
    const controller = new AbortController();
    active.current = controller;
    setRefreshing(true);
    const requested = key.split(",");
    try {
      for (let index = 0; index < requested.length && !controller.signal.aborted; index += clientBatchSize) {
        const results = await Promise.all(requested.slice(index, index + clientBatchSize).map(async (symbol) => {
          try {
            const response = await fetch(`/api/quote/${encodeURIComponent(symbol)}?view=${view}`, { signal: controller.signal });
            const body = await response.json();
            if (!response.ok) throw new Error(body.message ?? "Market data unavailable");
            return { symbol, quote: body as QuoteFor<V> };
          } catch (reason) {
            return { symbol, error: reason instanceof Error ? reason.message : "Market data unavailable" };
          }
        }));
        if (controller.signal.aborted) return;
        setQuotes((previous) => {
          const next = Object.fromEntries(Object.entries(previous).filter(([symbol]) => requested.includes(symbol)));
          for (const { symbol, quote } of results) {
            if (quote) next[symbol] = quote;
            else if (next[symbol]) next[symbol] = { ...next[symbol], freshness: { ...next[symbol]!.freshness, stale: true } };
          }
          return next;
        });
        setErrors((previous) => ({ ...previous, ...Object.fromEntries(results.map(({ symbol, error }) => [symbol, error])) }));
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setRefreshing(false);
      }
    }
  }, [key, view]);

  useEffect(() => {
    const load = () => void refresh();
    const initial = window.setTimeout(load, 0);
    const interval = intervalMs ? window.setInterval(load, intervalMs) : undefined;
    document.addEventListener("visibilitychange", load);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", load);
      active.current?.abort();
      active.current = null;
    };
  }, [refresh, intervalMs]);

  return { quotes, errors, refreshing: Boolean(key) && refreshing, refresh };
}
