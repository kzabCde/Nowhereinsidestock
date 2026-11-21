import { providerCandles } from "./yahoo";
import { MarketDataError } from "./market-errors";
import { ANALYTICS_DAYS } from "@/lib/indicators/daily-series";
import { maxDrawdown, sharpeRatio, sortinoRatio } from "@/lib/finance/risk";
import { ema, macd, normalizedMomentum, rsi, sma, volatility } from "@/lib/indicators/technical";
import { priceByDate, tradingDateFormatter } from "@/lib/finance/trading-dates";
import type { CompareMetric, CompareStockResult, CompareTimeframe, WinnerSummary } from "@/lib/types/compare";

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

export async function fetchCompareStock(symbol: string, timeframe: CompareTimeframe): Promise<CompareStockResult> {
  const timeframeDays = timeframeToDays[timeframe];
  const history = await providerCandles(symbol, timeframeDays > ANALYTICS_DAYS ? timeframeDays + 345 : ANALYTICS_DAYS);
  const result = history.value;
  const tradingDate = tradingDateFormatter(result.meta?.exchangeTimezoneName);
  const observed = (result.quotes ?? []).flatMap((quote) => {
    if (!(quote.date instanceof Date) || !Number.isFinite(quote.date.getTime()) || quote.close == null) return [];
    return [{ date: tradingDate(quote.date), close: quote.close, volume: quote.volume }];
  });
  const cutoff = tradingDate(new Date(Date.now() - timeframeDays * 86400000));
  const quotes = [...priceByDate(observed).values()].filter(({ date }) => date >= cutoff);
  if (quotes.length < 3) throw new MarketDataError("insufficient_history", `${symbol} has insufficient historical data.`);

  const closes = quotes.map((quote) => quote.close);
  const volumes = quotes.flatMap(({ volume }) => volume != null && Number.isFinite(volume) && volume >= 0 ? [volume] : []);
  const firstClose = closes[0];
  const latestClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];
  const rsi14 = rsi(closes, 14);
  const macdResult = macd(closes);
  const sma20 = sma(closes, 20);
  const ema20 = ema(closes, 20);
  const latestRsi = rsi14.at(-1) ?? null;
  const latestMacd = macdResult.line[macdResult.line.length - 1] ?? null;
  const latestSignal = macdResult.signal[macdResult.signal.length - 1] ?? null;

  const points = quotes.map(({ date, close }) => ({ date, normalized: close / firstClose * 100, close }));

  const metrics: CompareMetric = {
    symbol: symbol.toUpperCase(),
    name: (result.meta?.longName as string | undefined) ?? symbol.toUpperCase(),
    latestPrice: latestClose,
    currency: result.meta?.currency,
    percentChange: round(((latestClose - prevClose) / prevClose) * 100),
    totalReturn: round(((latestClose - firstClose) / firstClose) * 100),
    volatility: volatility(closes),
    averageVolume: volumes.length ? round(volumes.reduce((acc, cur) => acc + cur, 0) / volumes.length) : null,
    rsi: latestRsi,
    macdSignal: latestMacd == null || latestSignal == null ? "neutral" : latestMacd > latestSignal ? "buy" : latestMacd < latestSignal ? "sell" : "neutral",
    trendDirection: getTrend(latestClose, sma20[sma20.length - 1], ema20[ema20.length - 1]),
    momentumScore: normalizedMomentum(latestMacd, latestSignal, latestClose),
    maxDrawdown: maxDrawdown(closes),
    sharpeRatio: sharpeRatio(closes),
    sortinoRatio: sortinoRatio(closes)
  };

  return { symbol: symbol.toUpperCase(), name: metrics.name, points, metrics, stale: history.stale, retrievedAt: history.retrievedAt };

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
    highestVolume: by((m) => m.averageVolume ?? -Infinity, "max").symbol
  };
}
