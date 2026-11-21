import type { Candle } from "../types/market.ts";
import { maxDrawdown, sharpeRatio } from "../finance/risk.ts";
import { volatility } from "../indicators/technical.ts";

export type BacktestOptions = { initialCapital?: number; feeBps?: number; slippageBps?: number };
type Entry = { signalDate: string; entryDate: string; entryPrice: number; quantity: number; invested: number };
export type BacktestTrade = Entry & { exitSignalDate: string; exitDate: string; exitPrice: number; returnPercent: number };
type BacktestRun = {
  start: string; end: string; bars: number;
  trades: BacktestTrade[];
  totalReturn: number; buyAndHoldReturn: number; winRate: number | null;
  maxDrawdown: number; exposure: number; volatility: number | null; sharpe: number | null;
  equityCurve: Array<{ date: string; equity: number; benchmark: number; drawdown: number }>;
  openPosition: (Entry & { value: number; unrealized: number }) | null;
};
export type BacktestResult = (BacktestRun & {
  status: "ok";
  shortPeriod: number; longPeriod: number; longestGapDays: number;
  inSample: BacktestRun | null; outOfSample: BacktestRun | null;
  sensitivity: Array<{ shortPeriod: number; totalReturn: number }>;
}) | {
  status: "invalid_parameters" | "invalid_bars" | "insufficient_history";
  shortPeriod: number; longPeriod: number; trades: [];
  totalReturn: null; buyAndHoldReturn: null; winRate: null; maxDrawdown: null;
};

const MIN_EVALUATION_BARS = 20;
const MS_PER_DAY = 86400000;
const round = (value: number) => Math.round(value * 100) / 100;

function rollingAverage(values: number[], period: number) {
  let sum = 0;
  return values.map((value, index) => {
    sum += value;
    if (index >= period) sum -= values[index - period];
    return index + 1 >= period ? sum / period : null;
  });
}

function evaluateWindow(
  candles: Candle[], shortMa: Array<number | null>, longMa: Array<number | null>, from: number, to: number,
  capital: number, feeRate: number, slippage: number
): BacktestRun {
  const trades: BacktestTrade[] = [];
  const equityCurve: BacktestRun["equityCurve"] = [];
  const benchmarkUnits = capital / (candles[from].open * (1 + slippage) * (1 + feeRate));
  let entry: Entry | null = null;
  let pending: { side: "buy" | "sell"; signalDate: string } | null = null;
  let cash = capital;
  let exposed = 0;
  let highest = capital;
  let wins = 0;

  for (let index = from; index < to; index += 1) {
    const bar = candles[index];
    if (pending?.side === "buy") {
      const entryPrice = bar.open * (1 + slippage);
      entry = { signalDate: pending.signalDate, entryDate: bar.date, entryPrice, quantity: cash / (entryPrice * (1 + feeRate)), invested: cash };
      cash = 0;
    } else if (pending?.side === "sell" && entry) {
      const exitPrice = bar.open * (1 - slippage);
      cash = entry.quantity * exitPrice * (1 - feeRate);
      const tradeReturn = cash / entry.invested - 1;
      if (tradeReturn > 0) wins += 1;
      trades.push({ ...entry, exitSignalDate: pending.signalDate, exitDate: bar.date, exitPrice, returnPercent: round(tradeReturn * 100) });
      entry = null;
    }
    pending = null;

    const equity = cash + (entry ? entry.quantity * bar.close : 0);
    if (entry) exposed += 1;
    highest = Math.max(highest, equity);
    equityCurve.push({ date: bar.date, equity, benchmark: benchmarkUnits * bar.close, drawdown: (highest - equity) / highest * 100 });

    const previousFast = shortMa[index - 1];
    const previousSlow = longMa[index - 1];
    const fast = shortMa[index];
    const slow = longMa[index];
    if (previousFast == null || previousSlow == null || fast == null || slow == null) continue;
    if (!entry && previousFast <= previousSlow && fast > slow) pending = { side: "buy", signalDate: bar.date };
    if (entry && previousFast >= previousSlow && fast < slow) pending = { side: "sell", signalDate: bar.date };
  }

  const final = equityCurve.at(-1)!;
  const marks = [capital, ...equityCurve.map(({ equity }) => equity)];
  const hasVariation = marks.some((mark) => mark !== capital);
  const bars = to - from;
  const positionValue = entry ? entry.quantity * candles[to - 1].close : 0;
  return {
    start: candles[from].date, end: candles[to - 1].date, bars, trades, equityCurve,
    totalReturn: round((final.equity / capital - 1) * 100),
    buyAndHoldReturn: round((final.benchmark / capital - 1) * 100),
    winRate: trades.length ? round(wins / trades.length * 100) : null,
    maxDrawdown: maxDrawdown(marks), exposure: round(exposed / bars * 100),
    volatility: bars >= MIN_EVALUATION_BARS ? volatility(marks) : null,
    sharpe: bars >= MIN_EVALUATION_BARS && hasVariation ? sharpeRatio(marks) : null,
    openPosition: entry ? { ...entry, value: positionValue, unrealized: positionValue - entry.invested } : null
  };
}

export function backtestMovingAverageCross(candles: Candle[], shortPeriod = 20, longPeriod = 50, options: BacktestOptions = {}): BacktestResult {
  const { initialCapital: capital = 10_000, feeBps = 0, slippageBps = 0 } = options;
  const fail = (status: "invalid_parameters" | "invalid_bars" | "insufficient_history"): BacktestResult => (
    { status, shortPeriod, longPeriod, trades: [], totalReturn: null, buyAndHoldReturn: null, winRate: null, maxDrawdown: null }
  );
  if (!Number.isInteger(shortPeriod) || !Number.isInteger(longPeriod) || shortPeriod < 2 || longPeriod <= shortPeriod || longPeriod > 250 ||
      !Number.isFinite(capital) || capital <= 0 || capital > 1e15 ||
      [feeBps, slippageBps].some((amount) => !Number.isFinite(amount) || amount < 0 || amount > 1000)) return fail("invalid_parameters");

  const history = [...candles].sort((left, right) => left.date.localeCompare(right.date));
  let longestGapDays = 0;
  let previous = -Infinity;
  for (const candle of history) {
    const day = Date.parse(candle.date.slice(0, 10));
    if (!Number.isFinite(day) || day <= previous ||
        [candle.open, candle.close, candle.high, candle.low].some((value) => !Number.isFinite(value) || value <= 0) ||
        candle.low > Math.min(candle.open, candle.close) || candle.high < Math.max(candle.open, candle.close)) return fail("invalid_bars");
    if (Number.isFinite(previous)) longestGapDays = Math.max(longestGapDays, (day - previous) / MS_PER_DAY);
    previous = day;
  }

  const count = history.length;
  if (count < Math.max(longPeriod + 2, MIN_EVALUATION_BARS)) return fail("insufficient_history");
  const closes = history.map(({ close }) => close);
  const short = rollingAverage(closes, shortPeriod);
  const long = rollingAverage(closes, longPeriod);
  const run = (from: number, to: number, fast = short) =>
    evaluateWindow(history, fast, long, from, to, capital, feeBps / 10000, slippageBps / 10000);
  const split = Math.floor(count * 0.7);
  const canSplit = split >= Math.max(longPeriod + 2, MIN_EVALUATION_BARS) && count - split >= MIN_EVALUATION_BARS;
  const sensitivity = [...new Set([Math.max(2, Math.floor(shortPeriod * 0.8)), Math.min(longPeriod - 1, Math.ceil(shortPeriod * 1.2))])]
    .filter((value) => value !== shortPeriod)
    .map((period) => ({ shortPeriod: period, totalReturn: run(0, count, rollingAverage(closes, period)).totalReturn }));

  return {
    ...run(0, count), status: "ok", shortPeriod, longPeriod, longestGapDays,
    inSample: canSplit ? run(0, split) : null, outOfSample: canSplit ? run(split, count) : null, sensitivity
  };
}
