export type DatedPrice = { date: string; close: number };

export function tradingDateFormatter(timeZone = "UTC") {
  return new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format;
}

export function priceByDate<T extends DatedPrice>(points: T[]): Map<string, T> {
  const dated = new Map<string, T>();
  for (const point of points) {
    const date = point.date.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(point.date)) && Number.isFinite(point.close) && point.close > 0) {
      dated.set(date, { ...point, date });
    }
  }
  return new Map([...dated].sort(([left], [right]) => left.localeCompare(right)));
}

export function commonTradingDates<T extends DatedPrice>(series: ReadonlyArray<ReadonlyMap<string, T>>): string[] {
  return [...(series[0]?.keys() ?? [])].filter((date) => series.every((points) => points.has(date)));
}

export function alignPerformance<T extends DatedPrice>(series: T[][]) {
  const dated = series.map(priceByDate);
  const overlap = commonTradingDates(dated);
  if (overlap.length < 2) return null;
  const start = overlap[0];
  const end = overlap[overlap.length - 1];
  return {
    start,
    end,
    points: dated.map((points) => {
      const baseline = points.get(start)!.close;
      return [...points.values()].filter(({ date }) => date >= start && date <= end).map((point) => {
        const normalized = point.close / baseline * 100;
        return { ...point, normalized, percentChange: normalized - 100 };
      });
    })
  };
}
