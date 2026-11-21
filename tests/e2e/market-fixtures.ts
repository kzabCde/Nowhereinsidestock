import type { Page } from "@playwright/test";
import { alignPerformance } from "../../lib/finance/trading-dates";
import { buildDailySeries } from "../../lib/indicators/daily-series";
import type { ChartRange, QuoteResponse, RankingStock } from "../../lib/types/market";

const prices: Record<string, number> = { AAPL: 110, MSFT: 220, "PTT.BK": 38, NVDA: 115, AMZN: 195, GOOGL: 150, META: 580, TSLA: 300 };
const names: Record<string, string> = { AAPL: "Apple Inc.", MSFT: "Microsoft Corporation", "PTT.BK": "PTT Public Company" };
const retrievedAt = "2026-01-19T15:00:00Z";

function fixtureQuote(symbol: string, range: ChartRange, value = prices[symbol] ?? 100, minute = 0): QuoteResponse {
  const currency = symbol.endsWith(".BK") ? "THB" : "USD";
  const history = Array.from({ length: 370 }, (_, index) => new Date(Date.UTC(2025, 0, index + 1)))
    .filter((date, index) => date.getUTCDay() !== 0 && date.getUTCDay() !== 6 && !(symbol.endsWith(".BK") && index % 17 === 0))
    .map((date, index) => {
      const close = value * (0.75 + index / 1100 + 0.04 * Math.sin(index / 5));
      return { date: date.toISOString().slice(0, 10), open: close - 1, high: close + 1, low: close - 2, close, volume: 1_000_000 + index * 100 };
    });
  const day = history.at(-1)!.date;
  return {
    ...buildDailySeries(history, range, day, value),
    symbol, name: names[symbol] ?? symbol, currency, exchange: currency === "THB" ? "SET" : "Nasdaq",
    latestPrice: value, changePercent: 2.25, previousClose: value / 1.0225,
    marketTime: `2026-01-19T15:${String(minute).padStart(2, "0")}:00Z`, lastUpdated: retrievedAt,
    freshness: { source: "quote", retrievedAt, ageSeconds: 0, stale: false, marketState: "REGULAR" },
    historyStale: false, unavailable: [],
    insight: { trend: "bullish", momentum: "moderate", momentumScore: 0.45, rsiSignal: "neutral", macdSignal: "buy", volatility: 18 },
    supportResistance: { supports: [], resistances: [] },
    valuationMetrics: { trailingEps: 8, trailingPE: 25, bookValue: 12 },
    fundamentalsRetrievedAt: retrievedAt
  };
}

export async function mockMarket(page: Page) {
  const market = { aapl: 110, minute: 0, failDetail: false, quotes: 0, chartRequests: 0 };
  await page.route(/\/api\/(quote|stocks)\//, async (route) => {
    const url = new URL(route.request().url());
    const symbol = decodeURIComponent(url.pathname.split("/").at(-1)!);
    const range = (url.searchParams.get("range") ?? "6M") as ChartRange;
    const view = url.searchParams.get("view");
    if (view === "chart") market.chartRequests += 1;
    else market.quotes += 1;
    if (symbol === "NONE") return route.fulfill({ status: 404, json: { code: "symbol_not_found", message: "Symbol not found" } });
    if (market.failDetail && view === "detail") return route.fulfill({ status: 503, json: { code: "provider_unavailable", message: "Provider temporarily unavailable" } });
    const quote = fixtureQuote(symbol, range, symbol === "AAPL" ? market.aapl : undefined, market.minute);
    if (view === "chart") {
      const { chart, candles, indicators, currency, historyStale } = quote;
      return route.fulfill({ json: { symbol, chart, candles, indicators, currency, historyStale } });
    }
    if (view === "summary") {
      const { symbol, name, latestPrice, currency, changePercent, marketTime, lastUpdated, freshness } = quote;
      return route.fulfill({ json: { symbol, name, latestPrice, currency, changePercent, marketTime, lastUpdated, freshness } });
    }
    await route.fulfill({ json: quote });
  });

  await page.route(/\/api\/search\?/, (route) => {
    const query = new URL(route.request().url()).searchParams.get("q")?.toUpperCase();
    const results = Object.entries(names).filter(([symbol, name]) => query && `${symbol} ${name.toUpperCase()}`.includes(query))
      .map(([symbol, name]) => ({ symbol, name, type: "Equity" }));
    return route.fulfill({ json: { results } });
  });

  function stock(symbol: string, rank: number): RankingStock {
    const snapshot = fixtureQuote(symbol, "1M");
    return {
      rank, symbol, name: names[symbol] ?? symbol, latestPrice: prices[symbol], currency: snapshot.currency,
      changePercent: snapshot.changePercent, trend: "uptrend", sector: "Technology",
      marketCap: 1_000_000_000, volume: 1_500_000, marketTime: snapshot.marketTime, rsi: 27,
      volatility: 18, macdState: "buy", ma200Position: "above", pe: 11, dividendYield: 2.5
    };
  }

  await page.route(/\/api\/screener\?/, (route) => {
    const url = new URL(route.request().url());
    const universe = url.searchParams.get("universe") ?? "top-gainers";
    const symbols = universe === "custom" ? (url.searchParams.get("symbols") ?? "").split(/[\s,]+/).filter(Boolean) : ["AAPL", "MSFT"];
    return route.fulfill({ json: {
      universe, scope: universe === "custom" ? "user-defined" : "market-screener",
      stocks: symbols.map((symbol, index) => stock(symbol, index + 1)),
      candidateCount: symbols.length, incompleteCount: 0, fetchedAt: retrievedAt, source: "Yahoo Finance", stale: false, curatedFallback: false
    } });
  });

  await page.route("**/api/rankings/*", (route) => route.fulfill({ json: {
    rankingType: "top-gainers", title: "Top Gainers", stocks: [stock("AAPL", 1), stock("MSFT", 2)],
    fetchedAt: retrievedAt, source: "Yahoo Finance", scope: "market-screener", scopeLabel: "Yahoo predefined U.S. screener",
    candidateCount: 2, missingMetricCount: 0
  } }));

  await page.route(/\/api\/compare\?/, (route) => {
    const url = new URL(route.request().url());
    const symbols = (url.searchParams.get("symbols") ?? "").split(",");
    const range = (url.searchParams.get("range") ?? "6M") as ChartRange;
    const quotes = symbols.map((symbol) => fixtureQuote(symbol, range));
    const aligned = alignPerformance(quotes.map(({ candles }) => candles))!;
    return route.fulfill({ json: {
      symbols, range, baselineDate: aligned.start, endDate: aligned.end, series: quotes.map((quote, index) => ({
        symbol: quote.symbol, name: quote.name, points: aligned.points[index], metrics: {
          latestPrice: quote.latestPrice, currency: quote.currency, totalReturn: aligned.points[index].at(-1)!.percentChange,
          volatility: 18, trend: "uptrend", averageVolume: 1_000_000, rsiSignal: "45", macdSignal: "buy",
          maxDrawdown: 8, sharpeRatio: 0.7, sortinoRatio: 1.2, momentumScore: 0.5
        }
      }))
    } });
  });

  return market;
}
