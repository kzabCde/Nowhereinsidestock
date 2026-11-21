import { ema, macd, rsi, sma } from "./technical.ts";
import type { Candle, ChartRange, MovingAverageCrossSignal, MovingAverages } from "../types/market.ts";

export const ANALYTICS_DAYS = 400;
export const CHART_RANGES = {
  "1M": { days: 30, interval: "1d" },
  "3M": { days: 90, interval: "1d" },
  "6M": { days: 180, interval: "1d" },
  "1Y": { days: 365, interval: "1d" },
  "3Y": { days: 365 * 3, interval: "1wk" },
  "5Y": { days: 365 * 5, interval: "1wk" }
} as const;

type Series = Array<number | null>;

function crossSignal(ma50: Series, ma200: Series): MovingAverageCrossSignal {
  const previous50 = ma50.at(-2);
  const previous200 = ma200.at(-2);
  const current50 = ma50.at(-1);
  const current200 = ma200.at(-1);
  if (previous50 == null || previous200 == null || current50 == null || current200 == null) return "insufficient";
  if (previous50 <= previous200 && current50 > current200) return "golden_cross";
  if (previous50 >= previous200 && current50 < current200) return "death_cross";
  return "none";
}

function dailyIndicators(closes: number[]) {
  const result = macd(closes);
  return {
    sma20: sma(closes, 20), sma50: sma(closes, 50), sma200: sma(closes, 200),
    ema20: ema(closes, 20), rsi14: rsi(closes, 14), macd: result.line, signal: result.signal
  };
}

function movingAverages(price: number, series: ReturnType<typeof dailyIndicators>): MovingAverages {
  const ma20 = series.sma20.at(-1) ?? null;
  const ma50 = series.sma50.at(-1) ?? null;
  const ma200 = series.sma200.at(-1) ?? null;
  const position = (average: number | null) => average == null ? "insufficient" : price > average ? "above" : price < average ? "below" : "neutral";
  return { ma20, ma50, ma200, priceVsMA20: position(ma20), priceVsMA50: position(ma50), priceVsMA200: position(ma200), crossSignal: crossSignal(series.sma50, series.sma200) };
}

// Week labels and overlays use the last available observation in the trading week.
function weekStart(date: string) {
  const utc = new Date(date.slice(0, 10));
  utc.setUTCDate(utc.getUTCDate() - (utc.getUTCDay() + 6) % 7);
  return utc.toISOString().slice(0, 10);
}

export function buildDailySeries(history: Candle[], range: ChartRange, today: string, price: number, completedSession = today) {
  const cutoff = (days: number) => new Date(Date.parse(today) - days * 86400000).toISOString().slice(0, 10);
  const source = [...new Map(history.map((candle) => [candle.date.slice(0, 10), candle])).values()]
    .sort((left, right) => left.date.localeCompare(right.date));
  const calculationCandles = source.filter((candle) => candle.date >= cutoff(ANALYTICS_DAYS) && candle.date.slice(0, 10) <= completedSession);
  const calculation = dailyIndicators(calculationCandles.map((candle) => candle.close));
  const display = CHART_RANGES[range];
  const chart = new Map<string, { candle: Candle; index: number }>();
  source.forEach((candle, index) => {
    if (candle.date < cutoff(display.days)) return;
    const key = display.interval === "1wk" ? weekStart(candle.date) : candle.date.slice(0, 10);
    const previous = chart.get(key)?.candle;
    chart.set(key, {
      index,
      candle: previous ? {
        ...candle, open: previous.open, low: Math.min(previous.low, candle.low),
        high: Math.max(previous.high, candle.high), volume: previous.volume == null || candle.volume == null ? null : previous.volume + candle.volume
      } : candle
    });
  });
  const chartRows = [...chart.values()];
  const full = dailyIndicators(source.map((candle) => candle.close));
  const indicators = {
    sma20: chartRows.map(({ index }) => full.sma20[index]),
    sma50: chartRows.map(({ index }) => full.sma50[index]),
    sma200: chartRows.map(({ index }) => full.sma200[index]),
    ema20: chartRows.map(({ index }) => full.ema20[index]),
    rsi14: chartRows.map(({ index }) => full.rsi14[index]),
    macd: chartRows.map(({ index }) => full.macd[index]),
    signal: chartRows.map(({ index }) => full.signal[index])
  };
  return {
    candles: chartRows.map(({ candle }) => candle), indicators, calculation,
    analytics: { interval: "1d" as const, lookbackDays: ANALYTICS_DAYS, candles: calculationCandles, asOf: calculationCandles.at(-1)?.date, rsi14: calculation.rsi14.at(-1) ?? null },
    chart: { range, interval: display.interval, indicatorInterval: "1d" as const },
    movingAverages: movingAverages(price, calculation)
  };
}
