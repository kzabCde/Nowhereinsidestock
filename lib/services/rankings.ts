import { createMarketCache } from "./market-cache";
import { describeDailyHistory, normalizeCandles } from "./market-history";
import { MarketDataError, normalizeSymbol } from "./market-errors";
import { providerBatchQuotes, providerCandles, providerFundamentals, providerScreener } from "./yahoo";
import { normalizeMarketTimeIso } from "@/lib/format/market-time";
import { ANALYTICS_DAYS, buildDailySeries } from "@/lib/indicators/daily-series";
import { directionalMomentum, volatility } from "@/lib/indicators/technical";
import { rankCandidates, rankingMetricAvailable } from "@/lib/finance/screener";
import type { RankingResponse, RankingStock, RankingType, ScreenerResponse, ScreenerUniverse } from "@/lib/types/market";

const RANKING_POOLS: Record<RankingType, string[]> = {
  "top-gainers": ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD", "AVGO", "NFLX", "PLTR", "JPM", "V", "MA", "COST"],
  "top-losers": ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AMD", "AVGO", "NFLX", "PLTR", "JPM", "V", "MA", "COST"],
  "most-active": ["AAPL", "TSLA", "NVDA", "AMD", "PLTR", "AMZN", "META", "SOFI", "F", "BAC", "NIO", "INTC", "CCL", "PFE", "T"],
  "highest-market-cap": ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "BRK-B", "JPM", "WMT", "LLY", "XOM", "V", "MA", "AVGO"],
  "highest-volume": ["AAPL", "TSLA", "NVDA", "AMD", "PLTR", "AMZN", "META", "SOFI", "F", "BAC", "NIO", "INTC", "CCL", "PFE", "T"],
  "strongest-momentum": ["NVDA", "TSLA", "AMD", "PLTR", "META", "AMZN", "AVGO", "CRM", "MSFT", "AAPL", "NFLX", "ORCL", "PANW", "CRWD", "SNOW"],
  "lowest-volatility": ["KO", "PEP", "PG", "JNJ", "WMT", "MCD", "COST", "BRK-B", "V", "MA", "UNH", "ABBV", "MRK", "HD", "CVS"],
  "magnificent-seven": ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"],
  "thai-stocks": ["PTT.BK", "PTTEP.BK", "AOT.BK", "CPALL.BK", "ADVANC.BK", "KBANK.BK", "SCB.BK", "BBL.BK", "SCC.BK", "BDMS.BK"],
  "ai-tech": ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMD", "AVGO", "ORCL", "CRM", "PLTR", "ARM", "TSM", "ASML"]
};

export const RANKING_TITLES: Record<RankingType, string> = {
  "top-gainers": "Top Gainers",
  "top-losers": "Top Losers",
  "most-active": "Most Active",
  "highest-market-cap": "Highest Market Cap",
  "highest-volume": "Highest Volume",
  "strongest-momentum": "Strongest Momentum",
  "lowest-volatility": "Lowest Volatility",
  "magnificent-seven": "Magnificent Seven Ranking",
  "thai-stocks": "Thai Stocks Ranking",
  "ai-tech": "AI / Tech Ranking"
};

const MARKET_SCREENER_IDS: Partial<Record<RankingType, string>> = {
  "top-gainers": "day_gainers",
  "top-losers": "day_losers",
  "most-active": "most_actives",
  "highest-volume": "most_actives",
  "highest-market-cap": "largest_market_cap"
};

const currencyUnits = (value: unknown) => typeof value === "string" && value.length >= 3 ? value : undefined;
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const nonnegative = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
const positive = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
const text = (value: unknown) => typeof value === "string" && value.trim() ? value : undefined;

function fromQuote(item: unknown): RankingStock | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  let symbol: string;
  try { symbol = normalizeSymbol(text(row.symbol) ?? ""); } catch { return null; }
  const dividend = nonnegative(row.trailingAnnualDividendYield);
  return {
    rank: 0, symbol, name: text(row.shortName) ?? text(row.longName) ?? symbol, currency: currencyUnits(row.currency),
    latestPrice: positive(row.regularMarketPrice), changePercent: number(row.regularMarketChangePercent),
    volume: nonnegative(row.regularMarketVolume), marketCap: positive(row.marketCap), trend: null,
    sector: text(row.sector), industry: text(row.industry), pe: positive(row.trailingPE),
    dividendYield: dividend == null ? null : dividend * 100,
    marketTime: normalizeMarketTimeIso(row.regularMarketTime as Date | number | string | undefined)
  };
}

function candidates(rows: unknown[]): RankingStock[] {
  const valid = rows.map(fromQuote).filter((row): row is RankingStock => row != null);
  return [...new Map(valid.map((row) => [row.symbol, row])).values()];
}

async function loadUniverse(universe: ScreenerUniverse, symbols: string[]): Promise<ScreenerResponse> {
  const screenerId = universe === "custom" ? undefined : MARKET_SCREENER_IDS[universe];
  let curatedFallback = false;
  if (screenerId) {
    try {
      const query = new URLSearchParams({ formatted: "false", lang: "en-US", region: "US", scrIds: screenerId, count: "25", start: "0" });
      const snapshot = await providerScreener(query);
      if (!Array.isArray(snapshot.value)) throw new MarketDataError("provider_unavailable");
      const stocks = candidates(snapshot.value);
      if (snapshot.value.length > 0 && !stocks.length) throw new MarketDataError("provider_unavailable");
      return { universe, scope: "market-screener", source: "Yahoo Finance", stocks, candidateCount: snapshot.value.length,
        fetchedAt: snapshot.retrievedAt, stale: snapshot.stale, curatedFallback, incompleteCount: snapshot.value.length - stocks.length };
    } catch {
      curatedFallback = true;
    }
  }

  const requested = universe === "custom" ? symbols : RANKING_POOLS[universe];
  const snapshot = await providerBatchQuotes(requested);
  const stocks = candidates(snapshot.value).filter((row) => requested.includes(row.symbol));
  if (requested.length && !stocks.length) {
    throw new MarketDataError(universe === "custom" ? "symbol_not_found" : "provider_unavailable");
  }
  return { universe, scope: universe === "custom" ? "user-defined" : "curated-universe", source: "Yahoo Finance", stocks,
    candidateCount: requested.length, fetchedAt: snapshot.retrievedAt, stale: snapshot.stale, curatedFallback,
    incompleteCount: requested.length - stocks.length };
}

async function technicals(item: RankingStock): Promise<Partial<RankingStock>> {
  const snapshot = await providerCandles(item.symbol, ANALYTICS_DAYS);
  const chart = snapshot.value;
  const { tradingDate, today, completedSession } = describeDailyHistory(chart);
  const history = normalizeCandles(chart.quotes, tradingDate);
  const { analytics, calculation, movingAverages } = buildDailySeries(history, "1M", today, item.latestPrice ?? NaN, completedSession);
  const closes = analytics.candles.map(({ close }) => close);
  const close = closes.at(-1);
  const sma = calculation.sma20.at(-1);
  const ema = calculation.ema20.at(-1);
  const macd = calculation.macd.at(-1) ?? null;
  const signal = calculation.signal.at(-1) ?? null;
  const comparable = item.latestPrice != null && item.currency != null && item.currency === chart.meta.currency;
  return {
    trend: close == null || sma == null || ema == null ? null : close > sma && close > ema ? "uptrend" : close < sma && close < ema ? "downtrend" : "sideway",
    rsi: analytics.rsi14,
    macdState: macd == null || signal == null ? null : macd > signal ? "buy" : macd < signal ? "sell" : "neutral",
    ma200Position: comparable && movingAverages.ma200 != null ? movingAverages.priceVsMA200 as "above" | "below" | "neutral" : null,
    momentumScore: close == null ? null : directionalMomentum(macd, signal, close),
    volatility: closes.length >= 61 ? volatility(closes.slice(-61)) : null,
    technicalDate: analytics.asOf,
    stale: snapshot.stale
  };
}

async function profiles(item: RankingStock): Promise<Partial<RankingStock>> {
  const snapshot = await providerFundamentals(item.symbol);
  const data = snapshot.value;
  const yieldFraction = nonnegative(data.summaryDetail?.dividendYield);
  return {
    sector: item.sector ?? data.assetProfile?.sector,
    industry: item.industry ?? data.assetProfile?.industry,
    pe: item.pe ?? positive(data.summaryDetail?.trailingPE),
    dividendYield: item.dividendYield ?? (yieldFraction == null ? null : yieldFraction * 100),
    stale: snapshot.stale
  };
}

async function enrich(stocks: RankingStock[], technical: boolean, fundamental: boolean) {
  if (!technical && !fundamental) return { stocks, failures: 0 };
  const output = stocks.slice();
  const deadline = Date.now() + 18000;
  let next = 0;
  let failures = 0;
  const runners = Array.from({ length: Math.min(stocks.length, 4) }, async () => {
    while (next < stocks.length && Date.now() < deadline) {
      const index = next++;
      const item = stocks[index];
      const [tech, fund] = await Promise.allSettled([technical ? technicals(item) : {}, fundamental ? profiles(item) : {}]);
      if (tech.status === "rejected" || fund.status === "rejected") failures += 1;
      const technicalData: Partial<RankingStock> = tech.status === "fulfilled" ? tech.value : {};
      const companyData: Partial<RankingStock> = fund.status === "fulfilled" ? fund.value : {};
      output[index] = { ...item, ...technicalData, ...companyData, stale: technicalData.stale || companyData.stale };
    }
  });
  await Promise.all(runners);
  return { stocks: output, failures: failures + stocks.length - next };
}

const cachedUniverses = createMarketCache<ScreenerResponse>({ ttlMs: 60_000, staleMs: 15 * 60_000 }, 40);

export async function fetchScreener(universe: ScreenerUniverse, symbols: string[], technical: boolean, fundamental: boolean) {
  const key = [universe, ...symbols.toSorted(), technical, fundamental].join(":");
  const snapshot = await cachedUniverses(key, async () => {
    const data = await loadUniverse(universe, symbols);
    const result = await enrich(data.stocks, technical, fundamental);
    return { ...data, stocks: result.stocks, incompleteCount: data.incompleteCount + result.failures };
  });
  return { ...snapshot.value, stale: snapshot.stale || snapshot.value.stale || snapshot.value.stocks.some(({ stale }) => stale) };
}

export async function fetchRanking(type: RankingType): Promise<RankingResponse> {
  const needsTechnical = type === "strongest-momentum" || type === "lowest-volatility";
  const data = await fetchScreener(type, [], needsTechnical, false);
  const ranked = rankCandidates(type, data.stocks);
  return {
    rankingType: type, title: RANKING_TITLES[type],
    stocks: ranked.slice(0, 10).map((item, index) => ({ ...item, rank: index + 1 })),
    fetchedAt: data.fetchedAt, source: data.source,
    scope: data.scope === "market-screener" ? "market-screener" : "curated-universe",
    scopeLabel: data.scope === "market-screener" ? "Yahoo predefined U.S. screener" : "Curated symbol universe",
    stale: data.stale, curatedFallback: data.curatedFallback, candidateCount: data.candidateCount,
    missingMetricCount: data.candidateCount - data.stocks.filter((item) => rankingMetricAvailable(type, item)).length
  };
}
