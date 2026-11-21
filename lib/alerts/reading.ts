import type { QuoteResponse, QuoteSnapshot } from "../types/market.ts";
import type { AlertReading } from "./evaluate.ts";

export function alertReading(quote: QuoteSnapshot | QuoteResponse | undefined): AlertReading {
  if (!quote) return {};
  return {
    price: {
      value: quote.latestPrice, currency: quote.currency, asOf: quote.marketTime,
      stale: quote.freshness.stale || quote.freshness.source !== "quote"
    },
    ...("analytics" in quote ? {
      daily: {
        rsi: quote.analytics.rsi14,
        cross: quote.movingAverages.crossSignal,
        date: quote.analytics.asOf,
        stale: quote.historyStale
      }
    } : {})
  };
}
