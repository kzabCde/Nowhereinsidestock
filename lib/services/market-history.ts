import { tradingDateFormatter } from "@/lib/finance/trading-dates";
import type { Candle } from "@/lib/types/market";
import type { providerCandles } from "./yahoo";

type DailyHistory = Awaited<ReturnType<typeof providerCandles>>["value"];

export function describeDailyHistory(result?: DailyHistory, now = new Date()) {
  const tradingDate = tradingDateFormatter(result?.meta?.exchangeTimezoneName);
  const today = tradingDate(now);
  const end = result?.meta?.currentTradingPeriod?.regular?.end;
  const completedSession = end && now >= end ? today : tradingDate(new Date(now.getTime() - 86400000));
  return { tradingDate, today, completedSession };
}

export const normalizeCandles = (
  quotes: Array<{ date: Date; open: number | null; close: number | null; high: number | null; low: number | null; volume: number | null }>,
  tradingDate: (date: Date) => string
): Candle[] => quotes.flatMap(({ date, open, close, high, low, volume }) => {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime()) || open == null || close == null || high == null || low == null) return [];
  if ([open, close, high, low].some((price) => !Number.isFinite(price) || price <= 0) || low > Math.min(open, close) || high < Math.max(open, close)) return [];
  return [{ date: tradingDate(date), open, close, high, low, volume: volume != null && Number.isFinite(volume) && volume >= 0 ? volume : null }];
}).sort((left, right) => left.date.localeCompare(right.date));
