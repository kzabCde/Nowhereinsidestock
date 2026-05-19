import yahooFinance from "yahoo-finance2";
import type { SectorId, SectorInfo, SectorSort, SectorStockQuote } from "@/lib/types/sectors";

const PAGE_SIZE = 10;

const SECTORS: Record<SectorId, SectorInfo & { yahooLabel: string; fallbackSymbols: string[] }> = {
  technology: { id: "technology", name: "Technology", description: "Software, hardware, and semiconductor companies.", yahooLabel: "Technology", fallbackSymbols: ["AAPL","MSFT","NVDA","AVGO","ORCL","ADBE","CRM","CSCO","AMD","INTC","QCOM","TXN","AMAT","MU","NOW","SNOW","PLTR","UBER","SHOP","PANW"] },
  "communication-services": { id: "communication-services", name: "Communication Services", description: "Media, telecom, and internet communication businesses.", yahooLabel: "Communication Services", fallbackSymbols: ["GOOGL","META","NFLX","DIS","TMUS","VZ","T","CMCSA","CHTR","WBD","EA","TTWO","BIDU","SPOT","ROKU","SNAP","PINS","PARA","FOXA","LYV"] },
  "consumer-cyclical": { id: "consumer-cyclical", name: "Consumer Cyclical", description: "Retail and discretionary spending companies.", yahooLabel: "Consumer Cyclical", fallbackSymbols: ["AMZN","TSLA","HD","MCD","NKE","SBUX","BKNG","LOW","TJX","GM","F","RCL","CCL","MAR","HLT","LULU","ROST","CMG","AZO","EBAY"] },
  "consumer-defensive": { id: "consumer-defensive", name: "Consumer Defensive", description: "Staples and defensive consumer products companies.", yahooLabel: "Consumer Defensive", fallbackSymbols: ["WMT","COST","PG","KO","PEP","PM","MO","CL","KMB","GIS","KHC","MDLZ","KR","DG","DLTR","HSY","SYY","EL","CHD","ADM"] },
  "financial-services": { id: "financial-services", name: "Financial Services", description: "Banks, insurers, and diversified financial firms.", yahooLabel: "Financial Services", fallbackSymbols: ["BRK-B","JPM","BAC","WFC","C","GS","MS","BLK","SPGI","AXP","SCHW","PGR","AIG","MET","ALL","BK","USB","TFC","COF","CB"] },
  healthcare: { id: "healthcare", name: "Healthcare", description: "Pharma, biotech, and healthcare providers.", yahooLabel: "Healthcare", fallbackSymbols: ["LLY","JNJ","UNH","MRK","ABBV","PFE","TMO","ABT","DHR","BMY","AMGN","GILD","CVS","ISRG","REGN","VRTX","HCA","SYK","MDT","BSX"] },
  industrials: { id: "industrials", name: "Industrials", description: "Manufacturing, transport, and industrial services.", yahooLabel: "Industrials", fallbackSymbols: ["GE","CAT","DE","RTX","BA","LMT","HON","UPS","UNP","CSX","NSC","MMM","ETN","PH","GD","EMR","NOC","WM","ITW","ROK"] },
  energy: { id: "energy", name: "Energy", description: "Oil, gas, and renewable energy companies.", yahooLabel: "Energy", fallbackSymbols: ["XOM","CVX","COP","SLB","EOG","MPC","PSX","VLO","OXY","KMI","WMB","HAL","BKR","DVN","FANG","HES","APA","EQT","PXD","CTRA"] },
  utilities: { id: "utilities", name: "Utilities", description: "Electric, gas, and water utility providers.", yahooLabel: "Utilities", fallbackSymbols: ["NEE","DUK","SO","D","AEP","EXC","SRE","XEL","PEG","ED","WEC","EIX","AWK","ES","ETR","FE","PPL","DTE","CMS","AEE"] },
  "real-estate": { id: "real-estate", name: "Real Estate", description: "REITs and property-related companies.", yahooLabel: "Real Estate", fallbackSymbols: ["PLD","AMT","EQIX","SPG","O","WELL","PSA","CCI","DLR","VICI","AVB","EQR","EXR","MAA","INVH","UDR","BXP","ARE","CBRE","KIM"] },
  "basic-materials": { id: "basic-materials", name: "Basic Materials", description: "Chemicals, metals, mining, and raw materials.", yahooLabel: "Basic Materials", fallbackSymbols: ["LIN","SHW","FCX","NEM","APD","ECL","NUE","DOW","DD","CTVA","PPG","VMC","MLM","ALB","IFF","MOS","CF","IP","PKG","BALL"] }
};

const SORT_CONFIG: Record<SectorSort, { sortField: string; sortType: "ASC" | "DESC" }> = {
  "marketcap-desc": { sortField: "intradaymarketcap", sortType: "DESC" }, "marketcap-asc": { sortField: "intradaymarketcap", sortType: "ASC" },
  "price-desc": { sortField: "intradayprice", sortType: "DESC" }, "price-asc": { sortField: "intradayprice", sortType: "ASC" },
  "change-desc": { sortField: "percentchange", sortType: "DESC" }, "change-asc": { sortField: "percentchange", sortType: "ASC" },
  "volume-desc": { sortField: "dayvolume", sortType: "DESC" }, "volume-asc": { sortField: "dayvolume", sortType: "ASC" },
  "symbol-asc": { sortField: "ticker", sortType: "ASC" }, "symbol-desc": { sortField: "ticker", sortType: "DESC" }
};

type YahooQuote = {
  symbol?: string; shortName?: string; longName?: string; regularMarketPrice?: number; regularMarketChangePercent?: number; regularMarketVolume?: number; marketCap?: number; fullExchangeName?: string; exchange?: string; sector?: string;
};

type ScreenerPayload = { finance?: { result?: Array<{ quotes?: YahooQuote[] }> } };

function mapQuote(q: YahooQuote, sectorName: string): SectorStockQuote | null {
  if (typeof q.symbol !== "string" || q.symbol.length === 0) return null;
  const change = typeof q.regularMarketChangePercent === "number" ? q.regularMarketChangePercent : null;
  return {
    symbol: q.symbol,
    name: typeof q.shortName === "string" ? q.shortName : typeof q.longName === "string" ? q.longName : q.symbol,
    latestPrice: typeof q.regularMarketPrice === "number" ? q.regularMarketPrice : null,
    changePercent: change,
    volume: typeof q.regularMarketVolume === "number" ? q.regularMarketVolume : null,
    marketCap: typeof q.marketCap === "number" ? q.marketCap : null,
    trend: change === null ? "sideway" : change > 0 ? "uptrend" : change < 0 ? "downtrend" : "sideway",
    exchange: typeof q.fullExchangeName === "string" ? q.fullExchangeName : typeof q.exchange === "string" ? q.exchange : undefined,
    sector: typeof q.sector === "string" ? q.sector : sectorName
  };
}

export function getSectorInfo(sectorId: string): SectorInfo | null { return (SECTORS as Record<string, SectorInfo | undefined>)[sectorId] ?? null; }
export function isSectorSort(value: string): value is SectorSort { return value in SORT_CONFIG; }

export async function fetchSectorStocks(sectorId: SectorId, page: number, sort: SectorSort): Promise<{ stocks: SectorStockQuote[]; note?: string; source: "screener" | "fallback"; }> {
  const sector = SECTORS[sectorId];
  const start = (page - 1) * PAGE_SIZE;
  const sortCfg = SORT_CONFIG[sort];

  try {
    const response = await fetch("https://query2.finance.yahoo.com/v1/finance/screener", { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" }, cache: "no-store", body: JSON.stringify({ offset: start, size: PAGE_SIZE, sortField: sortCfg.sortField, sortType: sortCfg.sortType, quoteType: "EQUITY", query: { operator: "AND", operands: [{ operator: "EQ", operands: ["sector", sector.yahooLabel] }] }, userId: "", userIdType: "guid" }) });
    if (!response.ok) throw new Error(`Screener HTTP ${response.status}`);
    const payload = (await response.json()) as ScreenerPayload;
    const quotes = payload.finance?.result?.[0]?.quotes ?? [];
    const stocks = quotes.map((q) => mapQuote(q, sector.name)).filter((q): q is SectorStockQuote => q !== null);
    if (stocks.length > 0) return { stocks, source: "screener", note: "Market data from Yahoo Finance" };
  } catch {
    // Fall through to stable fallback
  }

  const pageSymbols = sector.fallbackSymbols.slice(start, start + PAGE_SIZE);
  const quoteResults = await Promise.all(pageSymbols.map(async (symbol) => {
    try {
      const quote = await yahooFinance.quote(symbol);
      return quote;
    } catch {
      return null;
    }
  }));

  const fallbackStocks = quoteResults
    .map((q) => (q ? mapQuote(q, sector.name) : null))
    .filter((q): q is SectorStockQuote => q !== null);

  return {
    stocks: fallbackStocks,
    source: "fallback",
    note: "Market data from Yahoo Finance"
  };
}
