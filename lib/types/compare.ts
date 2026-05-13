export type CompareTimeframe = "1M" | "6M" | "1Y" | "5Y";

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

export type CompareSeriesPoint = {
  date: string;
  normalized: number;
  close: number;
};

export type CompareStockResult = {
  symbol: string;
  name: string;
  points: CompareSeriesPoint[];
  metrics: CompareMetric;
  error?: string;
};

export type WinnerSummary = {
  bestPerformer: string;
  lowestVolatility: string;
  strongestMomentum: string;
  mostStable: string;
  highestVolume: string;
};
