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
  totalReturn: number;
  volatility: number;
  trend: "uptrend" | "downtrend" | "sideway";
  rsiSignal?: string;
  macdSignal?: string;
  averageVolume?: number;
};

export type CompareSeries = {
  symbol: string;
  name?: string;
  points: ComparePoint[];
  metrics: CompareMetrics;
};

export type CompareApiResponse = {
  symbols: string[];
  range: CompareRange;
  series: CompareSeries[];
};

// Legacy compatibility types
export type CompareMetric = {
  symbol: string;
  name: string;
  latestPrice: number;
  percentChange: number;
  totalReturn: number;
  volatility: number;
  averageVolume: number;
  rsi: number;
  macdSignal: "buy" | "sell" | "neutral";
  trendDirection: "bullish" | "bearish" | "neutral";
  momentumScore: number;
};
export type CompareSeriesPoint = { date: string; normalized: number; close: number };
export type CompareStockResult = { symbol: string; name: string; points: CompareSeriesPoint[]; metrics: CompareMetric; error?: string };
export type WinnerSummary = { bestPerformer: string; lowestVolatility: string; strongestMomentum: string; mostStable: string; highestVolume: string };
