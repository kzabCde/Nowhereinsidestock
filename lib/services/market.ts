import YahooFinance from "yahoo-finance2";
import { ema, macd, rsi, sma, volatility } from "@/lib/indicators/technical";
import type { Candle, QuoteResponse, SearchItem } from "@/lib/types/market";

const yahooFinance = new YahooFinance();

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}


const getTrend = (sma20: number | null, ema20: number | null, close: number) => {
  if (!sma20 || !ema20) return "neutral" as const;
  if (close > sma20 && close > ema20) return "bullish" as const;
  if (close < sma20 && close < ema20) return "bearish" as const;
  return "neutral" as const;
};

const normalizeCandles = (quotes: Array<{ date?: Date; open?: number | null; close?: number | null; high?: number | null; low?: number | null; volume?: number | null }> | undefined): Candle[] => {
  if (!quotes?.length) return [];

  return quotes
    .filter((c) => c.date instanceof Date && c.close != null && c.high != null && c.low != null)
    .map((c) => {
      const safeDate = c.date instanceof Date ? c.date.toISOString() : new Date(0).toISOString();

      return {
        date: safeDate,
        open: c.open ?? c.close ?? 0,
        high: c.high ?? 0,
        low: c.low ?? 0,
        close: c.close ?? 0,
        volume: c.volume ?? 0
      };
    });
};

export async function fetchQuoteWithIndicators(symbol: string): Promise<QuoteResponse> {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 180);

  const result = await yahooFinance.chart(symbol, {
    period1: from,
    period2: now,
    interval: "1d"
  });

  const candles = normalizeCandles(result?.quotes);

  if (candles.length < 30) {
    throw new Error("Not enough data available for analysis");
  }

  const closes = candles.map((c) => c.close);
  const sma20 = sma(closes, 20);
  const ema20 = ema(closes, 20);
  const rsi14 = rsi(closes, 14);
  const { line: macdLine, signal } = macd(closes);

  const latest = closes.length - 1;
  const latestRsi = rsi14[latest] ?? 50;
  const latestMacd = macdLine[latest] ?? 0;
  const latestSignal = signal[latest] ?? 0;
  const close = candles[latest]?.close ?? 0;
  const prev = candles[latest - 1]?.close ?? close;

  return {
    symbol: symbol.toUpperCase(),
    name: asString(result.meta?.longName),
    exchange: asString(result.meta?.exchangeName),
    latestPrice: close,
    changePercent: prev === 0 ? 0 : ((close - prev) / prev) * 100,
    candles,
    indicators: { sma20, ema20, rsi14, macd: macdLine, signal },
    insight: {
      trend: getTrend(sma20[latest], ema20[latest], closes[latest]),
      momentum: Math.abs(latestMacd - latestSignal) > 1.2 ? "strong" : Math.abs(latestMacd - latestSignal) > 0.5 ? "moderate" : "weak",
      rsiSignal: latestRsi > 70 ? "overbought" : latestRsi < 30 ? "oversold" : "neutral",
      macdSignal: latestMacd > latestSignal ? "buy" : latestMacd < latestSignal ? "sell" : "neutral",
      volatility: volatility(closes)
    }
  };
}

export async function searchSymbols(query: string): Promise<SearchItem[]> {
  const data = await yahooFinance.search(query, {
    quotesCount: 8,
    newsCount: 0
  });

  const results: SearchItem[] = [];

  for (const rawItem of data.quotes) {
    const item = rawItem as Record<string, unknown>;

    const symbol = asString(item.symbol);

    if (!symbol) continue;

    results.push({
      symbol,
      shortname: asString(item.shortname),
      exchDisp: asString(item.exchDisp)
    });
  }

  return results;
}
