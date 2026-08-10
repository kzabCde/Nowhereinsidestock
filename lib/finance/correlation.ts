export type DatedPrice = { date: string; close: number };

function returnsByDate(points: DatedPrice[]): Map<string, number> {
  const output = new Map<string, number>();
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous.close > 0 && current.close > 0) output.set(current.date, current.close / previous.close - 1);
  }
  return output;
}

export function pearsonCorrelation(left: DatedPrice[], right: DatedPrice[]): number | null {
  const leftReturns = returnsByDate(left);
  const rightReturns = returnsByDate(right);
  const pairs: Array<[number, number]> = [];

  for (const [date, leftReturn] of leftReturns) {
    const rightReturn = rightReturns.get(date);
    if (rightReturn != null) pairs.push([leftReturn, rightReturn]);
  }

  if (pairs.length < 3) return null;
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
  if (denominator === 0) return null;
  return Math.round((covariance / denominator) * 1000) / 1000;
}

export function buildCorrelationMatrix(series: Array<{ symbol: string; points: DatedPrice[] }>): Array<{ symbol: string; values: Record<string, number | null> }> {
  return series.map((row) => ({
    symbol: row.symbol,
    values: Object.fromEntries(
      series.map((column) => [column.symbol, row.symbol === column.symbol ? 1 : pearsonCorrelation(row.points, column.points)])
    )
  }));
}
