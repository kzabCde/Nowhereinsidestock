export type SectorId =
  | "technology"
  | "communication-services"
  | "consumer-cyclical"
  | "consumer-defensive"
  | "financial-services"
  | "healthcare"
  | "industrials"
  | "energy"
  | "utilities"
  | "real-estate"
  | "basic-materials";

export type SectorStockQuote = {
  symbol: string;
  name: string;
  latestPrice: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  trend: "uptrend" | "downtrend" | "sideway";
  exchange?: string;
  sector?: string;
};

export type SectorInfo = {
  id: SectorId;
  name: string;
  description: string;
};

export type SectorSort =
  | "marketcap-desc"
  | "marketcap-asc"
  | "price-desc"
  | "price-asc"
  | "change-desc"
  | "change-asc"
  | "volume-desc"
  | "volume-asc"
  | "symbol-asc"
  | "symbol-desc";
