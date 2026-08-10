export type Candle = {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
};

export type ChartRange = "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y";

export type MarketInsight = {
  trend: "bullish" | "bearish" | "neutral";
  momentum: "strong" | "moderate" | "weak";
  momentumScore: number;
  rsiSignal: "overbought" | "oversold" | "neutral";
  macdSignal: "buy" | "sell" | "neutral";
  volatility: number;
};

export type PriceZone = {
  level: number;
  lower: number;
  upper: number;
  touches: number;
  strength: "weak" | "medium" | "strong";
  type: "support" | "resistance";
};

export type MovingAverageStatus = "above" | "below" | "neutral" | "insufficient";

export type MovingAverageCrossSignal = "golden_cross" | "death_cross" | "none" | "insufficient";

export type MovingAverages = {
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  priceVsMA20: MovingAverageStatus;
  priceVsMA50: MovingAverageStatus;
  priceVsMA200: MovingAverageStatus;
  crossSignal: MovingAverageCrossSignal;
};

export type ValuationMetrics = {
  trailingEps?: number;
  forwardEps?: number;
  trailingPE?: number;
  forwardPE?: number;
  bookValue?: number;
  dividendRate?: number;
};

export type QuoteResponse = {
  symbol: string;
  name?: string;
  exchange?: string;
  currency?: string;
  sector?: string;
  industry?: string;
  latestPrice: number;
  changePercent: number;
  previousClose?: number;
  marketTime?: string;
  lastUpdated: string;
  candles: Candle[];
  indicators: {
    sma20: Array<number | null>;
    sma50: Array<number | null>;
    sma200: Array<number | null>;
    ema20: Array<number | null>;
    rsi14: Array<number | null>;
    macd: Array<number | null>;
    signal: Array<number | null>;
  };
  insight: MarketInsight;
  movingAverages: MovingAverages;
  supportResistance: {
    supports: PriceZone[];
    resistances: PriceZone[];
    message?: string;
  };
  valuationMetrics: ValuationMetrics;
};

export type SearchItem = {
  symbol: string;
  name?: string;
  exchange?: string;
  type?: string;
  shortname?: string;
  exchDisp?: string;
  quoteType?: string;
};

export type RankingType =
  | "top-gainers"
  | "top-losers"
  | "most-active"
  | "highest-market-cap"
  | "highest-volume"
  | "strongest-momentum"
  | "lowest-volatility"
  | "magnificent-seven"
  | "thai-stocks"
  | "ai-tech";

export type RankingScope = "market-screener" | "curated-universe";

export type RankingStock = {
  rank: number;
  symbol: string;
  name: string;
  currency?: string;
  latestPrice: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  trend: "uptrend" | "downtrend" | "sideway";
  momentumScore?: number | null;
  volatility?: number | null;
};

export type RankingResponse = {
  rankingType: RankingType;
  title: string;
  stocks: RankingStock[];
  fetchedAt: string;
  source: "Yahoo Finance";
  scope: RankingScope;
  scopeLabel: string;
};
