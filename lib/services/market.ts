import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";
import { ema, macd, normalizedMomentum, rsi, sma, volatility } from "@/lib/indicators/technical";
import type {
  Candle,
  ChartRange,
  MovingAverageCrossSignal,
  MovingAverages,
  MovingAverageStatus,
  PriceZone,
  QuoteResponse,
  RankingResponse,
  RankingScope,
  RankingStock,
  RankingType,
  SearchItem
} from "@/lib/types/market";

const yahooFinance = new YahooFinance();
const DEFAULT_CHART_RANGE: ChartRange = "6M";
const QUOTE_CACHE_SECONDS = 30;

type ChartInterval = "1d" | "1wk";
type ChartRangeConfig = { days: number; interval: ChartInterval };

const CHART_RANGE_CONFIG: Record<ChartRange, ChartRangeConfig> = {
  "1M": { days: 30, interval: "1d" },
  "3M": { days: 90, interval: "1d" },
  "6M": { days: 180, interval: "1d" },
  "1Y": { days: 365, interval: "1d" },
  "3Y": { days: 1095, interval: "1wk" },
  "5Y": { days: 1825, interval: "1wk" }
};

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

const RANKING_TITLES: Record<RankingType, string> = {
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

export function parseChartRange(value: string | null | undefined): ChartRange {
  if (value === "1M" || value === "3M" || value === "6M" || value === "1Y" || value === "3Y" || value === "5Y") return value;
  return DEFAULT_CHART_RANGE;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

async function withRetry<T>(operation: () => Promise<T>, label: string, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
}

const comparePriceToAverage = (price: number, average: number | null): MovingAverageStatus => {
  if (average == null) return "insufficient";
  if (price > average) return "above";
  if (price < average) return "below";
  return "neutral";
};

const getLatestValue = (values: Array<number | null>): number | null => values.at(-1) ?? null;

const getCrossSignal = (ma50: Array<number | null>, ma200: Array<number | null>): MovingAverageCrossSignal => {
  const latestIndex = Math.min(ma50.length, ma200.length) - 1;
  if (latestIndex <= 0) return "insufficient";

  const currentMa50 = ma50[latestIndex] ?? null;
  const currentMa200 = ma200[latestIndex] ?? null;
  const previousMa50 = ma50[latestIndex - 1] ?? null;
  const previousMa200 = ma200[latestIndex - 1] ?? null;
  if (currentMa50 == null || currentMa200 == null || previousMa50 == null || previousMa200 == null) return "insufficient";
  if (previousMa50 <= previousMa200 && currentMa50 > currentMa200) return "golden_cross";
  if (previousMa50 >= previousMa200 && currentMa50 < currentMa200) return "death_cross";
  return "none";
};

const buildMovingAverages = (
  price: number,
  ma20Series: Array<number | null>,
  ma50Series: Array<number | null>,
  ma200Series: Array<number | null>
): MovingAverages => ({
  ma20: getLatestValue(ma20Series),
  ma50: getLatestValue(ma50Series),
  ma200: getLatestValue(ma200Series),
  priceVsMA20: comparePriceToAverage(price, getLatestValue(ma20Series)),
  priceVsMA50: comparePriceToAverage(price, getLatestValue(ma50Series)),
  priceVsMA200: comparePriceToAverage(price, getLatestValue(ma200Series)),
  crossSignal: getCrossSignal(ma50Series, ma200Series)
});

const getTrend = (sma20Value: number | null, ema20Value: number | null, close: number) => {
  if (sma20Value == null || ema20Value == null) return "neutral" as const;
  if (close > sma20Value && close > ema20Value) return "bullish" as const;
  if (close < sma20Value && close < ema20Value) return "bearish" as const;
  return "neutral" as const;
};

const normalizeCandles = (
  quotes: Array<{ date?: Date; open?: number | null; close?: number | null; high?: number | null; low?: number | null; volume?: number | null }> | undefined
): Candle[] => {
  if (!quotes?.length) return [];
  return quotes
    .filter((c) => c.date instanceof Date && c.close != null && c.high != null && c.low != null)
    .map((c) => ({
      date: c.date instanceof Date ? c.date.toISOString() : new Date(0).toISOString(),
      open: c.open ?? c.close ?? 0,
      high: c.high ?? 0,
      low: c.low ?? 0,
      close: c.close ?? 0,
      volume: c.volume ?? 0
    }));
};

type SwingPoint = { price: number; volume: number; index: number };
type ZoneType = "support" | "resistance";

const getStrength = (score: number): "weak" | "medium" | "strong" => (score >= 6 ? "strong" : score >= 3 ? "medium" : "weak");

const extractSwings = (candles: Candle[], type: ZoneType): SwingPoint[] => {
  const points: SwingPoint[] = [];
  for (let i = 2; i < candles.length - 2; i += 1) {
    const prev2 = candles[i - 2];
    const prev1 = candles[i - 1];
    const current = candles[i];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    if (!prev2 || !prev1 || !current || !next1 || !next2) continue;
    const isSwing = type === "support"
      ? current.low < prev2.low && current.low < prev1.low && current.low < next1.low && current.low < next2.low
      : current.high > prev2.high && current.high > prev1.high && current.high > next1.high && current.high > next2.high;
    if (isSwing) points.push({ price: type === "support" ? current.low : current.high, volume: current.volume, index: i });
  }
  return points;
};

const buildZones = (points: SwingPoint[], latestPrice: number, candlesLength: number, type: ZoneType): PriceZone[] => {
  const tolerance = Math.max(latestPrice * 0.015, Number.EPSILON);
  const sorted = [...points].sort((a, b) => a.price - b.price);
  const clusters: Array<{ points: SwingPoint[]; center: number }> = [];

  for (const point of sorted) {
    const target = clusters.find((cluster) => Math.abs(point.price - cluster.center) <= tolerance);
    if (target) {
      target.points.push(point);
      target.center = target.points.reduce((sum, item) => sum + item.price, 0) / target.points.length;
    } else {
      clusters.push({ points: [point], center: point.price });
    }
  }

  const maxVolume = points.reduce((acc, point) => Math.max(acc, point.volume), 1);
  const zones = clusters.map((cluster): PriceZone & { score: number } => {
    const touches = cluster.points.length;
    const weightedRecency = cluster.points.reduce((acc, point) => acc + (point.index + 1) / candlesLength, 0) / touches;
    const weightedVolume = cluster.points.reduce((acc, point) => acc + point.volume / maxVolume, 0) / touches;
    const score = touches + weightedRecency * 1.5 + weightedVolume * 1.25;
    const level = cluster.points.reduce((acc, point) => acc + point.price, 0) / touches;
    return { type, level, lower: Math.max(level - tolerance, 0), upper: level + tolerance, touches, strength: getStrength(score), score };
  });

  return zones
    .filter((zone) => (type === "support" ? zone.level <= latestPrice * 1.02 : zone.level >= latestPrice * 0.98))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...zone }) => zone);
};

async function fetchQuoteWithIndicatorsUncached(symbol: string, range: ChartRange): Promise<QuoteResponse> {
  const normalizedSymbol = symbol.trim().toUpperCase();
  if (!normalizedSymbol) throw new Error("Stock symbol is required");

  const now = new Date();
  const rangeConfig = CHART_RANGE_CONFIG[range];
  const from = new Date(now);
  from.setDate(now.getDate() - rangeConfig.days);

  const [result, quote, profile] = await Promise.all([
    withRetry(() => yahooFinance.chart(normalizedSymbol, { period1: from, period2: now, interval: rangeConfig.interval }), "chart"),
    withRetry(() => yahooFinance.quote(normalizedSymbol), "quote"),
    withRetry(
      () => yahooFinance.quoteSummary(normalizedSymbol, { modules: ["assetProfile", "defaultKeyStatistics", "summaryDetail"] }),
      "quote summary"
    )
  ]);

  const quoteFields = quote as Record<string, unknown>;
  const assetProfile = profile.assetProfile as Record<string, unknown> | undefined;
  const defaultKeyStatistics = profile.defaultKeyStatistics as Record<string, unknown> | undefined;
  const summaryDetail = profile.summaryDetail as Record<string, unknown> | undefined;
  const candles = normalizeCandles(result?.quotes);
  if (candles.length === 0 && quote.regularMarketPrice == null) throw new Error(`No market data available for ${normalizedSymbol}`);

  const closes = candles.map((c) => c.close);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const ema20 = ema(closes, 20);
  const rsi14 = rsi(closes, 14);
  const { line: macdLine, signal } = macd(closes);

  const latest = closes.length - 1;
  const lastChartClose = candles[latest]?.close ?? quote.regularMarketPrice ?? 0;
  const prev = candles[latest - 1]?.close ?? lastChartClose;
  const latestPrice = quote.regularMarketPrice ?? lastChartClose;
  const latestClose = closes[latest] ?? latestPrice;
  const latestRsi = rsi14[latest] ?? 50;
  const latestMacd = macdLine[latest] ?? null;
  const latestSignal = signal[latest] ?? null;
  const momentumScore = normalizedMomentum(latestMacd, latestSignal, latestPrice);
  const changePercent = quote.regularMarketChangePercent ?? (prev === 0 ? 0 : ((lastChartClose - prev) / prev) * 100);
  const movingAverages = buildMovingAverages(latestPrice, sma20, sma50, sma200);

  const supportResistance = candles.length < 30
    ? { supports: [] as PriceZone[], resistances: [] as PriceZone[], message: "ข้อมูลรายวันน้อยกว่า 30 แท่ง จึงยังประเมินโซนที่ควรจับตาไม่ได้" }
    : {
        supports: buildZones(extractSwings(candles, "support"), latestPrice, candles.length, "support"),
        resistances: buildZones(extractSwings(candles, "resistance"), latestPrice, candles.length, "resistance")
      };

  return {
    symbol: normalizedSymbol,
    name: asString(result.meta?.longName) ?? asString(quoteFields.longName) ?? asString(quoteFields.shortName),
    exchange: asString(result.meta?.exchangeName) ?? asString(quoteFields.fullExchangeName) ?? asString(quoteFields.exchange),
    currency: asString(quoteFields.currency) ?? asString(result.meta?.currency) ?? "USD",
    sector: asString(assetProfile?.sector),
    industry: asString(assetProfile?.industry),
    latestPrice,
    changePercent,
    previousClose: quote.regularMarketPreviousClose,
    marketTime: quote.regularMarketTime ? new Date(quote.regularMarketTime * 1000).toISOString() : undefined,
    lastUpdated: new Date().toISOString(),
    candles,
    indicators: { sma20, sma50, sma200, ema20, rsi14, macd: macdLine, signal },
    insight: {
      trend: getTrend(sma20[latest] ?? null, ema20[latest] ?? null, latestClose),
      momentum: momentumScore >= 0.75 ? "strong" : momentumScore >= 0.25 ? "moderate" : "weak",
      momentumScore,
      rsiSignal: latestRsi > 70 ? "overbought" : latestRsi < 30 ? "oversold" : "neutral",
      macdSignal: latestMacd == null || latestSignal == null ? "neutral" : latestMacd > latestSignal ? "buy" : latestMacd < latestSignal ? "sell" : "neutral",
      volatility: volatility(closes, rangeConfig.interval === "1wk" ? 52 : 252)
    },
    movingAverages,
    supportResistance,
    valuationMetrics: {
      trailingEps: asNumber(quoteFields.trailingEps) ?? asNumber(defaultKeyStatistics?.trailingEps),
      forwardEps: asNumber(quoteFields.forwardEps) ?? asNumber(defaultKeyStatistics?.forwardEps),
      trailingPE: asNumber(quoteFields.trailingPE) ?? asNumber(summaryDetail?.trailingPE),
      forwardPE: asNumber(quoteFields.forwardPE) ?? asNumber(defaultKeyStatistics?.forwardPE),
      bookValue: asNumber(quoteFields.bookValue) ?? asNumber(defaultKeyStatistics?.bookValue),
      dividendRate: asNumber(quoteFields.dividendRate) ?? asNumber(summaryDetail?.dividendRate)
    }
  };
}

const fetchQuoteCached = unstable_cache(fetchQuoteWithIndicatorsUncached, ["quote-with-indicators-v3"], {
  revalidate: QUOTE_CACHE_SECONDS
});

export async function fetchQuoteWithIndicators(symbol: string, range: ChartRange = DEFAULT_CHART_RANGE): Promise<QuoteResponse> {
  return fetchQuoteCached(symbol.trim().toUpperCase(), range);
}

function normalizeSearchQuotes(quotes: unknown): SearchItem[] {
  if (!Array.isArray(quotes)) return [];
  const results: SearchItem[] = [];
  const seenSymbols = new Set<string>();

  for (const rawItem of quotes) {
    if (!rawItem || typeof rawItem !== "object") continue;
    const item = rawItem as Record<string, unknown>;
    const symbol = asString(item.symbol)?.trim().toUpperCase();
    const shortname = asString(item.shortname) ?? asString(item.shortName);
    const longname = asString(item.longname) ?? asString(item.longName);
    const exchDisp = asString(item.exchDisp) ?? asString(item.exchange);
    const quoteType = asString(item.quoteType) ?? asString(item.typeDisp);
    if (asString(item.index) && item.index !== "quotes") continue;
    if (item.isYahooFinance === false || !symbol || seenSymbols.has(symbol)) continue;

    seenSymbols.add(symbol);
    results.push({ symbol, name: shortname ?? longname, exchange: exchDisp, type: quoteType, shortname, exchDisp, quoteType });
    if (results.length >= 12) break;
  }
  return results;
}

async function searchSymbolsFromYahooEndpoint(query: string): Promise<SearchItem[]> {
  const params = new URLSearchParams({
    q: query,
    quotesCount: "12",
    newsCount: "0",
    listsCount: "0",
    enableFuzzyQuery: "false",
    quotesQueryId: "tss_match_phrase_query",
    multiQuoteQueryId: "multi_quote_single_token_query",
    enableCb: "false",
    enableNavLinks: "false",
    enableEnhancedTrivialQuery: "true"
  });
  const response = await withRetry(
    () => fetch(`https://query2.finance.yahoo.com/v1/finance/search?${params.toString()}`, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 NowhereInsideStock/1.0" }, cache: "no-store" }),
    "Yahoo search endpoint"
  );
  if (!response.ok) return [];
  const data: unknown = await response.json();
  return data && typeof data === "object" ? normalizeSearchQuotes((data as Record<string, unknown>).quotes) : [];
}

export async function searchSymbols(query: string): Promise<SearchItem[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  try {
    const data = await withRetry(() => yahooFinance.search(normalizedQuery, { quotesCount: 12, newsCount: 0, enableCb: false, enableNavLinks: false }), "Yahoo search");
    const results = normalizeSearchQuotes(data.quotes);
    if (results.length > 0) return results;
  } catch (error) {
    console.error("yahooFinance.search failed; trying Yahoo search endpoint fallback", error);
  }
  return searchSymbolsFromYahooEndpoint(normalizedQuery);
}

function toTrend(value: number | null): "uptrend" | "downtrend" | "sideway" {
  if (value == null) return "sideway";
  if (value > 0.2) return "uptrend";
  if (value < -0.2) return "downtrend";
  return "sideway";
}

function toRankingStock(item: Record<string, unknown>): RankingStock | null {
  const symbol = asString(item.symbol);
  if (!symbol) return null;
  const changePercent = asNumber(item.regularMarketChangePercent) ?? null;
  return {
    rank: 0,
    symbol,
    name: asString(item.shortName) ?? asString(item.longName) ?? symbol,
    currency: asString(item.currency),
    latestPrice: asNumber(item.regularMarketPrice) ?? null,
    changePercent,
    volume: asNumber(item.regularMarketVolume) ?? null,
    marketCap: asNumber(item.marketCap) ?? null,
    trend: toTrend(changePercent)
  };
}

function byRanking(type: RankingType, items: RankingStock[]): RankingStock[] {
  switch (type) {
    case "top-gainers":
    case "magnificent-seven":
    case "thai-stocks":
    case "ai-tech":
      return [...items].sort((a, b) => (b.changePercent ?? Number.NEGATIVE_INFINITY) - (a.changePercent ?? Number.NEGATIVE_INFINITY));
    case "top-losers":
      return [...items].sort((a, b) => (a.changePercent ?? Number.POSITIVE_INFINITY) - (b.changePercent ?? Number.POSITIVE_INFINITY));
    case "most-active":
    case "highest-volume":
      return [...items].sort((a, b) => (b.volume ?? Number.NEGATIVE_INFINITY) - (a.volume ?? Number.NEGATIVE_INFINITY));
    case "highest-market-cap":
      return [...items].sort((a, b) => (b.marketCap ?? Number.NEGATIVE_INFINITY) - (a.marketCap ?? Number.NEGATIVE_INFINITY));
    case "strongest-momentum":
      return [...items].sort((a, b) => (b.momentumScore ?? Number.NEGATIVE_INFINITY) - (a.momentumScore ?? Number.NEGATIVE_INFINITY));
    case "lowest-volatility":
      return [...items].sort((a, b) => (a.volatility ?? Number.POSITIVE_INFINITY) - (b.volatility ?? Number.POSITIVE_INFINITY));
  }
}

async function fetchPredefinedScreener(type: RankingType): Promise<RankingStock[]> {
  const screenerId = MARKET_SCREENER_IDS[type];
  if (!screenerId) return [];
  const params = new URLSearchParams({ formatted: "false", lang: "en-US", region: "US", scrIds: screenerId, count: "25", start: "0" });
  const response = await withRetry(
    () => fetch(`https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?${params.toString()}`, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 NowhereInsideStock/1.0" }, cache: "no-store" }),
    `Yahoo screener ${screenerId}`
  );
  if (!response.ok) return [];
  const data: unknown = await response.json();
  if (!data || typeof data !== "object") return [];
  const finance = (data as Record<string, unknown>).finance;
  if (!finance || typeof finance !== "object") return [];
  const result = (finance as Record<string, unknown>).result;
  if (!Array.isArray(result) || !result[0] || typeof result[0] !== "object") return [];
  const quotes = (result[0] as Record<string, unknown>).quotes;
  if (!Array.isArray(quotes)) return [];
  return quotes.map((item) => (item && typeof item === "object" ? toRankingStock(item as Record<string, unknown>) : null)).filter((item): item is RankingStock => item != null);
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

async function enrichRankingAnalytics(items: RankingStock[]): Promise<RankingStock[]> {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 120);
  return mapWithConcurrency(items, 4, async (item) => {
    try {
      const result = await withRetry(() => yahooFinance.chart(item.symbol, { period1: from, period2: now, interval: "1d" }), `analytics ${item.symbol}`);
      const closes = normalizeCandles(result.quotes).map((candle) => candle.close);
      const macdResult = macd(closes);
      const latestIndex = closes.length - 1;
      return {
        ...item,
        volatility: volatility(closes),
        momentumScore: normalizedMomentum(macdResult.line[latestIndex] ?? null, macdResult.signal[latestIndex] ?? null, closes[latestIndex] ?? item.latestPrice ?? 0)
      };
    } catch {
      return { ...item, volatility: null, momentumScore: null };
    }
  });
}

async function fetchCuratedRanking(type: RankingType): Promise<RankingStock[]> {
  const quote = await withRetry(
    () => yahooFinance.quote(RANKING_POOLS[type], { fields: ["symbol", "shortName", "longName", "currency", "regularMarketPrice", "regularMarketChangePercent", "regularMarketVolume", "marketCap"] }),
    `ranking ${type}`
  );
  const raw = Array.isArray(quote) ? quote : [quote];
  let items = raw.map((item) => toRankingStock(item as unknown as Record<string, unknown>)).filter((item): item is RankingStock => item != null);
  if (type === "strongest-momentum" || type === "lowest-volatility") items = await enrichRankingAnalytics(items);
  return items;
}

const fetchRankingCached = unstable_cache(async (type: RankingType): Promise<RankingResponse> => {
  let scope: RankingScope = "curated-universe";
  let items: RankingStock[] = [];

  if (MARKET_SCREENER_IDS[type]) {
    try {
      items = await fetchPredefinedScreener(type);
      if (items.length > 0) scope = "market-screener";
    } catch (error) {
      console.error(`Market screener failed for ${type}; using curated fallback`, error);
    }
  }

  if (items.length === 0) items = await fetchCuratedRanking(type);
  const ranked = byRanking(type, items).slice(0, 10).map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    rankingType: type,
    title: RANKING_TITLES[type],
    stocks: ranked,
    fetchedAt: new Date().toISOString(),
    source: "Yahoo Finance",
    scope,
    scopeLabel: scope === "market-screener" ? "Yahoo market-wide predefined screener" : "Curated symbol universe"
  };
}, ["ranking-v3"], { revalidate: 60 });

export async function fetchRanking(type: RankingType): Promise<RankingResponse> {
  return fetchRankingCached(type);
}
