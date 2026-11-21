import { commonTradingDates, priceByDate, type DatedPrice } from "./trading-dates.ts";
export type { DatedPrice } from "./trading-dates.ts";

export function correlationStatistics(left: DatedPrice[], right: DatedPrice[]) {
  const leftPrices = priceByDate(left);
  const rightPrices = priceByDate(right);
  const dates = commonTradingDates([leftPrices, rightPrices]);
  const pairs = dates.slice(1).map((date, index) => {
    const previous = dates[index];
    return [
      leftPrices.get(date)!.close / leftPrices.get(previous)!.close - 1,
      rightPrices.get(date)!.close / rightPrices.get(previous)!.close - 1
    ];
  });
  const samples = pairs.length;
  if (samples < 3) return { value: null, samples };
  const meanLeft = pairs.reduce((sum, [value]) => sum + value, 0) / pairs.length;
  const meanRight = pairs.reduce((sum, [, value]) => sum + value, 0) / pairs.length;
  let covariance = 0;
  let leftVariance = 0;
  let rightVariance = 0;

  for (const [leftValue, rightValue] of pairs) {
    const leftDelta = leftValue - meanLeft;
    const rightDelta = rightValue - meanRight;
    covariance += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }

  const denominator = Math.sqrt(leftVariance * rightVariance);
  return { value: denominator > 0 ? Math.round(covariance / denominator * 1000) / 1000 : null, samples };
}

export function pearsonCorrelation(left: DatedPrice[], right: DatedPrice[]): number | null {
  return correlationStatistics(left, right).value;
}

export function buildCorrelationMatrix(series: Array<{ symbol: string; points: DatedPrice[] }>) {
  return series.map((row) => {
    const pairs = series.map((column) => [column.symbol, correlationStatistics(row.points, column.points)] as const);
    return {
      symbol: row.symbol,
      values: Object.fromEntries(pairs.map(([symbol, result]) => [symbol, result.value])),
      samples: Object.fromEntries(pairs.map(([symbol, result]) => [symbol, result.samples]))
    };
  });
}
