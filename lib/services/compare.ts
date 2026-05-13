import { unstable_cache } from "next/cache";
import { ema, macd, rsi, sma, volatility } from "@/lib/indicators/technical";
import type { CompareMetric, CompareStockResult, CompareTimeframe, WinnerSummary } from "@/lib/types/compare";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const timeframeToDays: Record<CompareTimeframe, number> = { "1M": 30, "6M": 180, "1Y": 365, "5Y": 365 * 5 };

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function getTrend(close: number, sma20Value: number | null, ema20Value: number | null): "bullish" | "bearish" | "neutral" {
  if (sma20Value == null || ema20Value == null) return "neutral";
  if (close > sma20Value && close > ema20Value) return "bullish";
  if (close < sma20Value && close < ema20Value) return "bearish";
  return "neutral";
}

const fetchCached = unstable_cache(
  async (symbol: string, timeframe: CompareTimeframe) => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - timeframeToDays[timeframe]);

    const result = await yahooFinance.chart(symbol, { period1: from, period2: now, interval: "1d" });
    return result;
  },
  ["compare-stocks"],
  { revalidate: 300 }
);

export async function fetchCompareStock(symbol: string, timeframe: CompareTimeframe): Promise<CompareStockResult> {
  try {
    const result = await fetchCached(symbol, timeframe);
    const rawQuotes = (result.quotes ?? []) as Array<{ date?: Date; close?: number | null; volume?: number | null }>;
    const quotes = rawQuotes.filter((q) => q.date && q.close != null && q.volume != null);
    if (quotes.length < 30) {
      return { symbol, name: symbol, points: [], metrics: emptyMetric(symbol), error: "Not enough historical data" };
    }

    const closes = quotes.map((q) => q.close as number);
    const volumes = quotes.map((q) => q.volume as number);
    const firstClose = closes[0];
    const latestClose = closes[closes.length - 1];
    const prevClose = closes[closes.length - 2] ?? latestClose;
    const rsi14 = rsi(closes, 14);
    const macdResult = macd(closes);
    const sma20 = sma(closes, 20);
    const ema20 = ema(closes, 20);
    const latestRsi = rsi14[rsi14.length - 1] ?? 50;
    const latestMacd = macdResult.line[macdResult.line.length - 1] ?? 0;
    const latestSignal = macdResult.signal[macdResult.signal.length - 1] ?? 0;

    const points = quotes.map((q) => {
      const close = q.close as number;
      return {
        date: (q.date as Date).toISOString().slice(0, 10),
        normalized: round((close / firstClose) * 100),
        close: round(close)
      };
    });

    const metrics: CompareMetric = {
      symbol: symbol.toUpperCase(),
      name: (result.meta?.longName as string | undefined) ?? symbol.toUpperCase(),
      latestPrice: round(latestClose),
      percentChange: round(((latestClose - prevClose) / prevClose) * 100),
      totalReturn: round(((latestClose - firstClose) / firstClose) * 100),
      volatility: volatility(closes),
      averageVolume: round(volumes.reduce((acc, cur) => acc + cur, 0) / volumes.length),
      rsi: round(latestRsi),
      macdSignal: latestMacd > latestSignal ? "buy" : latestMacd < latestSignal ? "sell" : "neutral",
      trendDirection: getTrend(latestClose, sma20[sma20.length - 1], ema20[ema20.length - 1]),
      momentumScore: round(Math.abs(latestMacd - latestSignal) * 100)
    };

    return { symbol: symbol.toUpperCase(), name: metrics.name, points, metrics };
  } catch {
    return { symbol: symbol.toUpperCase(), name: symbol.toUpperCase(), points: [], metrics: emptyMetric(symbol), error: "Invalid symbol or data unavailable" };
  }
}

function emptyMetric(symbol: string): CompareMetric {
  return { symbol: symbol.toUpperCase(), name: symbol.toUpperCase(), latestPrice: 0, percentChange: 0, totalReturn: 0, volatility: 0, averageVolume: 0, rsi: 0, macdSignal: "neutral", trendDirection: "neutral", momentumScore: 0 };
}

export function buildWinnerSummary(metrics: CompareMetric[]): WinnerSummary {
  const by = (fn: (m: CompareMetric) => number, dir: "max" | "min") =>
    metrics.reduce((best, cur) => {
      if (dir === "max") return fn(cur) > fn(best) ? cur : best;
      return fn(cur) < fn(best) ? cur : best;
    }, metrics[0]);
  return {
    bestPerformer: by((m) => m.totalReturn, "max").symbol,
    lowestVolatility: by((m) => m.volatility, "min").symbol,
    strongestMomentum: by((m) => m.momentumScore, "max").symbol,
    mostStable: by((m) => Math.abs(m.percentChange), "min").symbol,
    highestVolume: by((m) => m.averageVolume, "max").symbol
  };
}
