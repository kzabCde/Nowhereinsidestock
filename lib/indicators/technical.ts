const round = (value: number) => Math.round(value * 100) / 100;

export const sma = (prices: number[], period: number): Array<number | null> =>
  prices.map((_, index) => {
    if (index + 1 < period) return null;
    const slice = prices.slice(index + 1 - period, index + 1);
    return round(slice.reduce((acc, price) => acc + price, 0) / period);
  });

export const ema = (prices: number[], period: number): Array<number | null> => {
  const result: Array<number | null> = Array(prices.length).fill(null);
  const multiplier = 2 / (period + 1);
  let previousEma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period - 1; i < prices.length; i += 1) {
    previousEma = i === period - 1 ? previousEma : (prices[i] - previousEma) * multiplier + previousEma;
    result[i] = round(previousEma);
  }

  return result;
};

export const rsi = (prices: number[], period: number): Array<number | null> => {
  const output: Array<number | null> = Array(prices.length).fill(null);
  if (prices.length <= period) return output;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i += 1) {
    const diff = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    output[i] = round(100 - 100 / (1 + rs));
  }

  return output;
};

export const macd = (prices: number[]) => {
  const ema12 = ema(prices, 12).map((v) => v ?? 0);
  const ema26 = ema(prices, 26).map((v) => v ?? 0);
  const line = prices.map((_, i) => round(ema12[i] - ema26[i]));
  const signal = ema(line, 9);
  return { line, signal };
};

export const volatility = (prices: number[]) => {
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((acc, p) => acc + (p - mean) ** 2, 0) / prices.length;
  return round((Math.sqrt(variance) / mean) * 100);
};
