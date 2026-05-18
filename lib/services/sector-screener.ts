import type { SectorId, SectorInfo, SectorSort, SectorStockQuote } from "@/lib/types/sectors";

const SECTORS: Record<SectorId, SectorInfo & { yahooLabel: string }> = {
  technology: { id: "technology", name: "Technology", description: "Software, hardware, and semiconductor companies.", yahooLabel: "Technology" },
  "communication-services": { id: "communication-services", name: "Communication Services", description: "Media, telecom, and internet communication businesses.", yahooLabel: "Communication Services" },
  "consumer-cyclical": { id: "consumer-cyclical", name: "Consumer Cyclical", description: "Retail and discretionary spending companies.", yahooLabel: "Consumer Cyclical" },
  "consumer-defensive": { id: "consumer-defensive", name: "Consumer Defensive", description: "Staples and defensive consumer products companies.", yahooLabel: "Consumer Defensive" },
  "financial-services": { id: "financial-services", name: "Financial Services", description: "Banks, insurers, and diversified financial firms.", yahooLabel: "Financial Services" },
  healthcare: { id: "healthcare", name: "Healthcare", description: "Pharma, biotech, and healthcare providers.", yahooLabel: "Healthcare" },
  industrials: { id: "industrials", name: "Industrials", description: "Manufacturing, transport, and industrial services.", yahooLabel: "Industrials" },
  energy: { id: "energy", name: "Energy", description: "Oil, gas, and renewable energy companies.", yahooLabel: "Energy" },
  utilities: { id: "utilities", name: "Utilities", description: "Electric, gas, and water utility providers.", yahooLabel: "Utilities" },
  "real-estate": { id: "real-estate", name: "Real Estate", description: "REITs and property-related companies.", yahooLabel: "Real Estate" },
  "basic-materials": { id: "basic-materials", name: "Basic Materials", description: "Chemicals, metals, mining, and raw materials.", yahooLabel: "Basic Materials" }
};

const SORT_CONFIG: Record<SectorSort, { sortField: string; sortType: "ASC" | "DESC" }> = {
  "marketcap-desc": { sortField: "intradaymarketcap", sortType: "DESC" },
  "marketcap-asc": { sortField: "intradaymarketcap", sortType: "ASC" },
  "price-desc": { sortField: "intradayprice", sortType: "DESC" },
  "price-asc": { sortField: "intradayprice", sortType: "ASC" },
  "change-desc": { sortField: "percentchange", sortType: "DESC" },
  "change-asc": { sortField: "percentchange", sortType: "ASC" },
  "volume-desc": { sortField: "dayvolume", sortType: "DESC" },
  "volume-asc": { sortField: "dayvolume", sortType: "ASC" },
  "symbol-asc": { sortField: "ticker", sortType: "ASC" },
  "symbol-desc": { sortField: "ticker", sortType: "DESC" }
};

type YahooQuote = { symbol?: string; shortName?: string; longName?: string; regularMarketPrice?: number; regularMarketChangePercent?: number; regularMarketVolume?: number; marketCap?: number; fullExchangeName?: string; exchange?: string; sector?: string; };

export function getSectorInfo(sectorId: string): SectorInfo | null {
  return (SECTORS as Record<string, SectorInfo | undefined>)[sectorId] ?? null;
}

export function isSectorSort(value: string): value is SectorSort { return value in SORT_CONFIG; }

export async function fetchSectorStocks(sectorId: SectorId, page: number, pageSize: number, sort: SectorSort): Promise<{ stocks: SectorStockQuote[]; note?: string; }> {
  const sector = SECTORS[sectorId];
  const start = (page - 1) * pageSize;
  const sortCfg = SORT_CONFIG[sort];

  const response = await fetch("https://query2.finance.yahoo.com/v1/finance/screener", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
    body: JSON.stringify({
      offset: start,
      size: pageSize,
      sortField: sortCfg.sortField,
      sortType: sortCfg.sortType,
      quoteType: "EQUITY",
      query: { operator: "AND", operands: [{ operator: "EQ", operands: ["sector", sector.yahooLabel] }] },
      userId: "",
      userIdType: "guid"
    })
  });

  if (!response.ok) throw new Error("Yahoo screener request failed");
  const payload = (await response.json()) as { finance?: { result?: Array<{ quotes?: YahooQuote[] }> } };
  const quotes = payload.finance?.result?.[0]?.quotes ?? [];

  const stocks = quotes.map((item) => {
    const change = typeof item.regularMarketChangePercent === "number" ? item.regularMarketChangePercent : null;
    return {
      symbol: item.symbol ?? "",
      name: item.shortName ?? item.longName ?? item.symbol ?? "Unknown",
      latestPrice: typeof item.regularMarketPrice === "number" ? item.regularMarketPrice : null,
      changePercent: change,
      volume: typeof item.regularMarketVolume === "number" ? item.regularMarketVolume : null,
      marketCap: typeof item.marketCap === "number" ? item.marketCap : null,
      trend: change === null ? "sideway" : change > 0 ? "uptrend" : change < 0 ? "downtrend" : "sideway",
      exchange: item.fullExchangeName ?? item.exchange,
      sector: item.sector ?? sector.name
    } satisfies SectorStockQuote;
  }).filter((item) => item.symbol.length > 0);

  return { stocks, note: "Sorting may apply to the currently loaded page depending on data provider support." };
}
