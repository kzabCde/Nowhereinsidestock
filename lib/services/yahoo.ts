import YahooFinance from "yahoo-finance2";
import { createMarketCache, createMarketTransport } from "./market-cache";
import { MarketDataError, normalizeMarketError, normalizeSymbol } from "./market-errors";

// Recognize HTTP status before the SDK converts provider JSON errors into plain errors.
const providerFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (response.status === 429 || response.status >= 500) {
    void response.body?.cancel().catch(() => {});
    throw normalizeMarketError({ status: response.status });
  }
  return response;
};
const yahoo = new YahooFinance();
const request = createMarketTransport();
const cache = {
  quote: { ttlMs: 30_000, staleMs: 15 * 60_000 },
  candles: { ttlMs: 300_000, staleMs: 24 * 60 * 60_000 },
  fundamentals: { ttlMs: 3600_000, staleMs: 24 * 60 * 60_000 },
  search: { ttlMs: 120_000, staleMs: 15 * 60_000 },
  screener: { ttlMs: 120_000, staleMs: 15 * 60_000 }
};

const history = (symbol: string, days: number, signal: AbortSignal) => {
  const now = new Date();
  const from = new Date(now.getTime() - days * 86400000);
  return yahoo.chart(symbol, { period1: from, period2: now, interval: "1d" }, { fetch: providerFetch, fetchOptions: { signal } });
};
const fundamentals = (symbol: string, signal: AbortSignal) =>
  yahoo.quoteSummary(symbol, { modules: ["assetProfile", "defaultKeyStatistics", "summaryDetail"] }, { fetch: providerFetch, fetchOptions: { signal } });
const providerSearch = (query: string, signal: AbortSignal) =>
  yahoo.search(query, { quotesCount: 12, newsCount: 0, enableCb: false, enableNavLinks: false }, { fetch: providerFetch, fetchOptions: { signal } });

const cachedQuote = createMarketCache<Awaited<ReturnType<typeof yahoo.quote>>>(cache.quote);
const cachedCandles = createMarketCache<Awaited<ReturnType<typeof history>>>(cache.candles);
const cachedFundamentals = createMarketCache<Awaited<ReturnType<typeof fundamentals>>>(cache.fundamentals);
const cachedSearch = createMarketCache<Awaited<ReturnType<typeof providerSearch>>>(cache.search);
const cachedScreener = createMarketCache<unknown>(cache.screener, 24);

export function providerQuote(symbol: string) {
  return cachedQuote(normalizeSymbol(symbol), () => request(async (signal) => {
    const quote = await yahoo.quote(symbol, {}, { fetch: providerFetch, fetchOptions: { signal } });
    if (!quote) throw new MarketDataError("symbol_not_found");
    if (quote.regularMarketPrice == null || !Number.isFinite(quote.regularMarketPrice) || quote.regularMarketPrice <= 0) {
      throw new MarketDataError("provider_unavailable", "The provider returned no valid price.");
    }
    return quote;
  }));
}

export function providerCandles(symbol: string, days: number) {
  return cachedCandles(`${normalizeSymbol(symbol)}:${days}`, () => request((signal) => history(symbol, days, signal)));
}

export function providerFundamentals(symbol: string) {
  return cachedFundamentals(normalizeSymbol(symbol), () => request((signal) => fundamentals(symbol, signal)));
}

export function providerSearchResults(query: string) {
  return cachedSearch(query, () => request((signal) => providerSearch(query, signal)));
}

export function providerScreener(params: URLSearchParams) {
  return cachedScreener(params.toString(), () => request(async (signal) => {
    const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?${params}`, {
      signal, headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 NowhereInsideStock/1.0" }, cache: "no-store"
    });
    if (!response.ok) throw normalizeMarketError({ status: response.status });
    const result = (await response.json())?.finance;
    if (result?.error || !Array.isArray(result?.result?.[0]?.quotes)) throw new MarketDataError("provider_unavailable");
    return result.result[0].quotes;
  }));
}

export async function providerBatchQuotes(symbols: string[]) {
  return request((signal) => yahoo.quote(symbols, {}, { fetch: providerFetch, fetchOptions: { signal } }));
}
