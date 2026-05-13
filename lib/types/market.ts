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
  candles: Candle[];
  indicators: {
    sma20: Array<number | null>;
    ema20: Array<number | null>;
    rsi14: Array<number | null>;
    macd: Array<number | null>;
    signal: Array<number | null>;
  };
  insight: MarketInsight;
};

export type SearchItem = {
  symbol: string;
  shortname?: string;
  exchDisp?: string;
};
