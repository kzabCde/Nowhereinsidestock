export type Candle = {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
};

export type MarketInsight = {
  trend: "bullish" | "bearish" | "neutral";
  momentum: "strong" | "moderate" | "weak";
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
  companyDescription?: string;
  sector?: string;
  industry?: string;
  website?: string;
  fullTimeEmployees?: number;
  latestPrice: number;
  changePercent: number;
  previousClose?: number;
  marketTime?: string;
  lastUpdated: string;
  candles: Candle[];
  indicators: {
    sma20: Array<number | null>;
    ema20: Array<number | null>;
    rsi14: Array<number | null>;
    macd: Array<number | null>;
    signal: Array<number | null>;
  };
  insight: MarketInsight;
  supportResistance: {
    supports: PriceZone[];
    resistances: PriceZone[];
    message?: string;
  };
  valuationMetrics: ValuationMetrics;
};

export type SearchItem = {
  symbol: string;
  shortname?: string;
  exchDisp?: string;
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

export type RankingStock = {
  rank: number;
  symbol: string;
  name: string;
  latestPrice: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  trend: "uptrend" | "downtrend" | "sideway";
};

export type RankingResponse = {
  rankingType: RankingType;
  title: string;
  stocks: RankingStock[];
  fetchedAt: string;
  source: "Yahoo Finance";
};
