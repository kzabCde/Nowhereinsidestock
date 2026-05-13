import yahooFinance from "yahoo-finance2";
import { ema, macd, rsi, sma, volatility } from "@/lib/indicators/technical";
import type { Candle, QuoteResponse } from "@/lib/types/market";

const getTrend = (sma20: number | null, ema20: number | null, close: number) => {
  if (!sma20 || !ema20) return "neutral" as const;
  if (close > sma20 && close > ema20) return "bullish" as const;
  if (close < sma20 && close < ema20) return "bearish" as const;
  return "neutral" as const;
};

export async function fetchQuoteWithIndicators(symbol: string): Promise<QuoteResponse> {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 180);

  const historical = await yahooFinance.historical(symbol, { period1: from, period2: now, interval: "1d" });

  const candles: Candle[] = historical
    .filter((c) => c.close && c.high && c.low && c.volume)
    .map((c) => ({
      date: c.date.toISOString().slice(0, 10),
      close: Number(c.close),
      high: Number(c.high),
      low: Number(c.low),
      volume: Number(c.volume)
    }));

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

  return {
    symbol: symbol.toUpperCase(),
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
