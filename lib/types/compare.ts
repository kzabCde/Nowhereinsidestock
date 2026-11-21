export type CompareRange = "1M" | "6M" | "1Y" | "5Y";
export type CompareTimeframe = CompareRange;

export type ComparePoint = {
  date: string;
  close: number;
  normalized: number;
  percentChange: number;
};

export type CompareMetrics = {
  latestPrice: number;
  currency?: string;
  percentChange?: number;
  previousClose?: number | null;
  marketTime?: string | null;
  lastUpdated?: string;
  totalReturn: number;
  volatility: number | null;
  trend: "uptrend" | "downtrend" | "sideway" | null;
  rsiSignal?: string;
  macdSignal?: string;
  averageVolume?: number | null;
  momentumScore?: number | null;
  maxDrawdown?: number;
  sharpeRatio?: number;
  sortinoRatio?: number;
};

export type CompareSeries = {
  symbol: string;
  name?: string;
  points: ComparePoint[];
  metrics: CompareMetrics;
  stale?: boolean;
};

export type CompareApiResponse = {
  symbols: string[];
  range: CompareRange;
  series: CompareSeries[];
  baselineDate?: string;
  endDate?: string;
};
