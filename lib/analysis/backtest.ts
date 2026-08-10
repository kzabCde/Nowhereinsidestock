import type { Candle } from "@/lib/types/market";
import { maxDrawdown } from "@/lib/finance/risk";

export type BacktestTrade = {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  returnPercent: number;
};

export type BacktestResult = {
  shortPeriod: number;
  longPeriod: number;
  trades: BacktestTrade[];
  totalReturn: number;
  buyAndHoldReturn: number;
  winRate: number;
  maxDrawdown: number;
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function rollingAverage(values: number[], period: number): Array<number | null> {
  const result: Array<number | null> = Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    sum += values[index];
    if (index >= period) sum -= values[index - period];
    if (index + 1 >= period) result[index] = sum / period;
  }
  return result;
}

export function backtestMovingAverageCross(candles: Candle[], shortPeriod = 20, longPeriod = 50): BacktestResult {
  if (shortPeriod <= 0 || longPeriod <= shortPeriod || candles.length < longPeriod + 1) {
    return { shortPeriod, longPeriod, trades: [], totalReturn: 0, buyAndHoldReturn: 0, winRate: 0, maxDrawdown: 0 };
  }

  const closes = candles.map((candle) => candle.close);
  const shortMa = rollingAverage(closes, shortPeriod);
  const longMa = rollingAverage(closes, longPeriod);
  const trades: BacktestTrade[] = [];
  const equityCurve = [1];
  let entry: { date: string; price: number } | null = null;
  let equity = 1;

  for (let index = longPeriod; index < candles.length; index += 1) {
    const previousShort = shortMa[index - 1];
    const previousLong = longMa[index - 1];
    const currentShort = shortMa[index];
    const currentLong = longMa[index];
    if (previousShort == null || previousLong == null || currentShort == null || currentLong == null) continue;

    const candle = candles[index];
    if (!entry && previousShort <= previousLong && currentShort > currentLong) {
      entry = { date: candle.date, price: candle.close };
      continue;
    }

    if (entry && previousShort >= previousLong && currentShort < currentLong) {
      const tradeReturn = candle.close / entry.price - 1;
      equity *= 1 + tradeReturn;
      equityCurve.push(equity);
      trades.push({
        entryDate: entry.date,
        entryPrice: entry.price,
        exitDate: candle.date,
        exitPrice: candle.close,
        returnPercent: round(tradeReturn * 100)
      });
      entry = null;
    }
  }

  if (entry) {
    const last = candles[candles.length - 1];
    const tradeReturn = last.close / entry.price - 1;
    equity *= 1 + tradeReturn;
    equityCurve.push(equity);
    trades.push({
      entryDate: entry.date,
      entryPrice: entry.price,
      exitDate: last.date,
      exitPrice: last.close,
      returnPercent: round(tradeReturn * 100)
    });
  }

  const wins = trades.filter((trade) => trade.returnPercent > 0).length;
  const firstClose = closes[0] ?? 0;
  const lastClose = closes.at(-1) ?? firstClose;

  return {
    shortPeriod,
    longPeriod,
    trades,
    totalReturn: round((equity - 1) * 100),
    buyAndHoldReturn: firstClose > 0 ? round((lastClose / firstClose - 1) * 100) : 0,
    winRate: trades.length > 0 ? round((wins / trades.length) * 100) : 0,
    maxDrawdown: maxDrawdown(equityCurve)
  };
}
