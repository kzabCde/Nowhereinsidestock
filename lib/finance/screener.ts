import type { RankingStock, RankingType } from "../types/market.ts";

export const NUMERIC_FILTERS = {
  minPrice: "latestPrice", maxPrice: "latestPrice", minChange: "changePercent", maxChange: "changePercent",
  minVolume: "volume", minMarketCap: "marketCap", maxMarketCap: "marketCap",
  minRsi: "rsi", maxRsi: "rsi", maxVolatility: "volatility", maxPe: "pe", minYield: "dividendYield"
} as const;

type NumericField = keyof typeof NUMERIC_FILTERS;
export type ScreenerFilters = Record<NumericField, string> & {
  currency: string; sector: string; industry: string; trend: string; macdState: string; ma200Position: string; query: string;
};
export type ScreenerSort = "provider" | "symbol" | "change" | "volume" | "marketCap" | "price" | "momentum" | "volatility";

export const EMPTY_FILTERS: ScreenerFilters = {
  minPrice: "", maxPrice: "", minChange: "", maxChange: "", minVolume: "", minMarketCap: "", maxMarketCap: "",
  minRsi: "", maxRsi: "", maxVolatility: "", maxPe: "", minYield: "",
  currency: "", sector: "", industry: "", trend: "", macdState: "", ma200Position: "", query: ""
};

export function screenerDataNeeded(filters: ScreenerFilters, sort: ScreenerSort) {
  return {
    technical: Boolean(filters.minRsi || filters.maxRsi || filters.maxVolatility || filters.trend || filters.macdState ||
      filters.ma200Position || sort === "volatility" || sort === "momentum"),
    fundamental: Boolean(filters.sector || filters.industry || filters.maxPe || filters.minYield)
  };
}

const sortBy: Record<Exclude<ScreenerSort, "provider" | "symbol">, keyof RankingStock> = {
  change: "changePercent", volume: "volume", marketCap: "marketCap", price: "latestPrice",
  momentum: "momentumScore", volatility: "volatility"
};

const bySymbol = (left: RankingStock, right: RankingStock) => left.symbol.localeCompare(right.symbol, "en");
const numeric = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function sortMetric(rows: RankingStock[], key: keyof RankingStock, direction: 1 | -1) {
  return [...rows].sort((left, right) => {
    const a = left[key];
    const b = right[key];
    if (numeric(a) && numeric(b)) return direction * (a - b) || bySymbol(left, right);
    if (numeric(a)) return -1;
    if (numeric(b)) return 1;
    return bySymbol(left, right);
  });
}

export function screenCandidates(rows: RankingStock[], filters: ScreenerFilters, sort: ScreenerSort) {
  const fail = (error: "invalid_filter" | "currency_required") => ({ stocks: [], missing: 0, error });
  const bounds = Object.entries(NUMERIC_FILTERS).flatMap(([field, metric]) => {
    const active = filters[field as NumericField]?.trim();
    return active ? [{ field, metric, threshold: Number(active) }] : [];
  });
  if (bounds.some(({ field, threshold }) => !Number.isFinite(threshold) ||
    (!/Change$/.test(field) && threshold < 0) || (/Rsi$/.test(field) && threshold > 100))) return fail("invalid_filter");
  for (const [min, max] of [["minPrice", "maxPrice"], ["minChange", "maxChange"], ["minRsi", "maxRsi"], ["minMarketCap", "maxMarketCap"]] as const) {
    if (filters[min]?.trim() && filters[max]?.trim() && Number(filters[min]) > Number(filters[max])) return fail("invalid_filter");
  }

  const currencies = new Set(rows.map(({ currency }) => currency).filter(Boolean));
  const moneyFilter = sort === "price" || sort === "marketCap" || bounds.some(({ metric }) => metric === "latestPrice" || metric === "marketCap");
  if (moneyFilter && currencies.size > 1 && !filters.currency) return fail("currency_required");
  let missing = 0;
  const query = filters.query.trim().toLowerCase();
  const fields = ["sector", "industry", "trend", "macdState", "ma200Position"] as const;
  const stocks = rows.filter((row) => {
    if (filters.currency && filters.currency !== row.currency) return false;
    if (query && !`${row.symbol} ${row.name}`.toLowerCase().includes(query)) return false;
    if ((moneyFilter && !row.currency) || bounds.some(({ metric }) => !numeric(row[metric])) ||
      fields.some((key) => filters[key].trim() && !row[key])) {
      missing += 1;
      return false;
    }
    return bounds.every(({ metric, field, threshold }) => {
      const value = row[metric] as number;
      return field.startsWith("min") ? value >= threshold : value <= threshold;
    }) && fields.every((key) => !filters[key].trim() || String(row[key]).toLowerCase().includes(filters[key].trim().toLowerCase()));
  });
  return {
    stocks: sort === "provider" ? stocks : sort === "symbol" ? stocks.toSorted(bySymbol) : sortMetric(stocks, sortBy[sort], sort === "volatility" ? 1 : -1),
    missing, error: undefined
  };
}

function rankingMetric(type: RankingType): keyof RankingStock {
  return type === "strongest-momentum" ? "momentumScore" :
    type === "lowest-volatility" ? "volatility" :
    type === "most-active" || type === "highest-volume" ? "volume" :
    type === "highest-market-cap" ? "marketCap" : "changePercent";
}

export function rankingMetricAvailable(type: RankingType, row: RankingStock) {
  const metric = rankingMetric(type);
  return numeric(row[metric]) && (metric !== "marketCap" || row.currency === "USD");
}

export function rankCandidates(type: RankingType, rows: RankingStock[]) {
  const metric = rankingMetric(type);
  const available = rows.filter((row) => rankingMetricAvailable(type, row));
  const matching = type === "top-gainers" || type === "top-losers" ? available.filter((row) =>
    type === "top-gainers" ? row.changePercent! > 0 : row.changePercent! < 0) : available;
  return sortMetric(matching, metric, type === "top-losers" || type === "lowest-volatility" ? 1 : -1);
}
