function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function simpleReturns(prices: number[]): number[] {
  const output: number[] = [];
  for (let i = 1; i < prices.length; i += 1) {
    const previous = prices[i - 1];
    const current = prices[i];
    if (previous > 0 && current > 0) output.push(current / previous - 1);
  }
  return output;
}

export function maxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;
  let peak = prices[0];
  let worst = 0;
  for (const price of prices) {
    if (price > peak) peak = price;
    if (peak <= 0) continue;
    const drawdown = (price - peak) / peak;
    if (drawdown < worst) worst = drawdown;
  }
  return round(Math.abs(worst) * 100);
}

function sampleStd(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function sharpeRatio(prices: number[], riskFreeAnnual = 0, periodsPerYear = 252): number {
  const returns = simpleReturns(prices);
  if (returns.length < 2) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const annualVolatility = sampleStd(returns) * Math.sqrt(periodsPerYear);
  if (annualVolatility === 0) return 0;
  return round((mean * periodsPerYear - riskFreeAnnual) / annualVolatility);
}

export function sortinoRatio(prices: number[], targetAnnual = 0, periodsPerYear = 252): number {
  const returns = simpleReturns(prices);
  if (returns.length < 2) return 0;
  const targetPeriod = targetAnnual / periodsPerYear;
  const excess = returns.map((value) => value - targetPeriod);
  const meanExcess = excess.reduce((sum, value) => sum + value, 0) / excess.length;
  const downsideSquares = excess.filter((value) => value < 0).map((value) => value ** 2);
  if (downsideSquares.length === 0) return 0;
  const downsideDeviation = Math.sqrt(downsideSquares.reduce((sum, value) => sum + value, 0) / downsideSquares.length) * Math.sqrt(periodsPerYear);
  if (downsideDeviation === 0) return 0;
  return round((meanExcess * periodsPerYear) / downsideDeviation);
}
