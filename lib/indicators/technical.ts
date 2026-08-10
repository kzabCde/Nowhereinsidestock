const round = (value: number) => Math.round(value * 100) / 100;

const emptySeries = (length: number): Array<number | null> => Array(length).fill(null);

export const sma = (prices: number[], period: number): Array<number | null> => {
  if (!Number.isInteger(period) || period <= 0 || prices.length === 0) return emptySeries(prices.length);

  let rollingSum = 0;
  return prices.map((price, index) => {
    rollingSum += price;
    if (index >= period) rollingSum -= prices[index - period];
    if (index + 1 < period) return null;
    return round(rollingSum / period);
  });
};

export const ema = (prices: number[], period: number): Array<number | null> => {
  const result = emptySeries(prices.length);
  if (!Number.isInteger(period) || period <= 0 || prices.length < period) return result;

  const multiplier = 2 / (period + 1);
  let previousEma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = round(previousEma);

  for (let i = period; i < prices.length; i += 1) {
    previousEma = (prices[i] - previousEma) * multiplier + previousEma;
    result[i] = round(previousEma);
  }

  return result;
};

export const rsi = (prices: number[], period: number): Array<number | null> => {
  const output = emptySeries(prices.length);
  if (!Number.isInteger(period) || period <= 0 || prices.length <= period) return output;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = prices[i] - prices[i - 1];
    gains += Math.max(diff, 0);
    losses += Math.max(-diff, 0);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const toRsi = () => {
    if (avgGain === 0 && avgLoss === 0) return 50;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return round(100 - 100 / (1 + rs));
  };

  output[period] = toRsi();

  for (let i = period + 1; i < prices.length; i += 1) {
    const diff = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    output[i] = toRsi();
  }

  return output;
};

export const macd = (prices: number[]) => {
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const line: Array<number | null> = prices.map((_, index) => {
    const fast = ema12[index];
    const slow = ema26[index];
    return fast == null || slow == null ? null : round(fast - slow);
  });

  const firstMacdIndex = line.findIndex((value) => value != null);
  const signal: Array<number | null> = emptySeries(prices.length);
  if (firstMacdIndex >= 0) {
    const compactLine = line.slice(firstMacdIndex).filter((value): value is number => value != null);
    const compactSignal = ema(compactLine, 9);
    compactSignal.forEach((value, index) => {
      signal[firstMacdIndex + index] = value;
    });
  }

  return { line, signal };
};

export const volatility = (prices: number[], periodsPerYear = 252): number => {
  if (prices.length < 3 || periodsPerYear <= 0) return 0;

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i += 1) {
    const previous = prices[i - 1];
    const current = prices[i];
    if (previous <= 0 || current <= 0) continue;
    returns.push(Math.log(current / previous));
  }

  if (returns.length < 2) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (returns.length - 1);
  return round(Math.sqrt(variance) * Math.sqrt(periodsPerYear) * 100);
};

export const normalizedMomentum = (macdValue: number | null, signalValue: number | null, price: number): number => {
  if (macdValue == null || signalValue == null || !Number.isFinite(price) || price <= 0) return 0;
  return round((Math.abs(macdValue - signalValue) / price) * 100);
};
