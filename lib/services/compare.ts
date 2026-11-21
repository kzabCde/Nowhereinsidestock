import { providerCandles } from "./yahoo";
import { MarketDataError } from "./market-errors";
import { describeDailyHistory } from "./market-history";
import { ANALYTICS_DAYS } from "@/lib/indicators/daily-series";
import { directionalMomentum, ema, macd, rsi, sma } from "@/lib/indicators/technical";
import { priceByDate } from "@/lib/finance/trading-dates";
import type { CompareTimeframe } from "@/lib/types/compare";

const timeframeToDays: Record<CompareTimeframe, number> = { "1M": 30, "6M": 180, "1Y": 365, "5Y": 365 * 5 };

function trend(close: number, sma20: number | null, ema20: number | null) {
  if (sma20 == null || ema20 == null) return null;
  if (close > sma20 && close > ema20) return "uptrend" as const;
  if (close < sma20 && close < ema20) return "downtrend" as const;
  return "sideway" as const;
}

export async function fetchCompareStock(symbol: string, timeframe: CompareTimeframe) {
  const days = timeframeToDays[timeframe];
  const history = await providerCandles(symbol, Math.max(ANALYTICS_DAYS, days));
  const result = history.value;
  const now = new Date();
  const { tradingDate, completedSession } = describeDailyHistory(result, now);
  const cutoff = (lookback: number) => tradingDate(new Date(now.getTime() - lookback * 86400000));
  const observed = (result.quotes ?? []).flatMap(({ date, close, volume }) => {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime()) || close == null) return [];
    const day = tradingDate(date);
    return day <= completedSession ? [{ date: day, close, volume }] : [];
  });
  const shared = [...priceByDate(observed).values()];
  const displayStart = cutoff(days);
  const points = shared.filter(({ date }) => date >= displayStart);
  if (points.length < 2) throw new MarketDataError("insufficient_history", `${symbol} has insufficient historical data.`);

  const analyticsStart = cutoff(ANALYTICS_DAYS);
  const closes = shared.filter(({ date }) => date >= analyticsStart).map(({ close }) => close);
  const latestClose = points.at(-1)!.close;
  const previousClose = points.at(-2)!.close;
  const averages = macd(closes);
  const macdValue = averages.line.at(-1) ?? null;
  const signal = averages.signal.at(-1) ?? null;

  return {
    symbol,
    name: result.meta.longName ?? result.meta.shortName ?? symbol,
    points,
    metrics: {
      latestPrice: latestClose,
      currency: result.meta.currency,
      previousClose,
      percentChange: (latestClose / previousClose - 1) * 100,
      trend: trend(latestClose, sma(closes, 20).at(-1) ?? null, ema(closes, 20).at(-1) ?? null),
      rsiSignal: rsi(closes, 14).at(-1)?.toFixed(2),
      macdSignal: macdValue == null || signal == null ? undefined : macdValue > signal ? "buy" : macdValue < signal ? "sell" : "neutral",
      momentumScore: directionalMomentum(macdValue, signal, latestClose),
      lastUpdated: history.retrievedAt
    },
    stale: history.stale
  };
}
