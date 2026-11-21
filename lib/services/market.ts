import { tradingDateFormatter } from "@/lib/finance/trading-dates";
import { createMarketCache } from "./market-cache";
import { providerBatchQuotes, providerCandles, providerFundamentals, providerQuote, providerScreener, providerSearchResults } from "./yahoo";
import { MarketDataError, normalizeSymbol } from "./market-errors";
import { loadQuoteParts } from "./quote-parts";
import { normalizeMarketTimeIso } from "@/lib/format/market-time";
import { ema, macd, normalizedMomentum, sma, volatility } from "@/lib/indicators/technical";
import { ANALYTICS_DAYS, CHART_RANGES, buildDailySeries } from "@/lib/indicators/daily-series";
import type {
  Candle,
  ChartRange,
  PriceZone,
  QuoteResponse,
  QuoteSnapshot,
  RankingResponse,
  RankingScope,
  RankingStock,
  RankingType,
  SearchItem
} from "@/lib/types/market";

const DEFAULT_CHART_RANGE: ChartRange = "6M";

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

const getTrend = (sma20Value: number | null, ema20Value: number | null, close: number) => {
  if (sma20Value == null || ema20Value == null) return "neutral" as const;
  if (close > sma20Value && close > ema20Value) return "bullish" as const;
  if (close < sma20Value && close < ema20Value) return "bearish" as const;
  return "neutral" as const;
};

const normalizeCandles = (
  quotes: Array<{ date: Date; open: number | null; close: number | null; high: number | null; low: number | null; volume: number | null }>,
  tradingDate: (date: Date) => string
): Candle[] => quotes.flatMap(({ date, open, close, high, low, volume }) => {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime()) || open == null || close == null || high == null || low == null) return [];
  if ([open, close, high, low].some((price) => !Number.isFinite(price) || price <= 0) || low > Math.min(open, close) || high < Math.max(open, close)) return [];
  return [{ date: tradingDate(date), open, close, high, low, volume: volume != null && Number.isFinite(volume) && volume >= 0 ? volume : null }];
});

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
    if (isSwing) points.push({ price: type === "support" ? current.low : current.high, volume: current.volume ?? 0, index: i });
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

function quoteSnapshot(symbol: string, snapshot: Awaited<ReturnType<typeof providerQuote>>): QuoteSnapshot {
  const { value: quote, retrievedAt, ageSeconds, stale } = snapshot;
  return {
    symbol, name: quote.longName ?? quote.shortName, exchange: quote.fullExchangeName ?? quote.exchange,
    currency: quote.currency, latestPrice: quote.regularMarketPrice!,
    changePercent: asNumber(quote.regularMarketChangePercent) ?? null,
    previousClose: asNumber(quote.regularMarketPreviousClose), marketTime: normalizeMarketTimeIso(quote.regularMarketTime),
    lastUpdated: retrievedAt, freshness: { source: "quote", marketState: quote.marketState, retrievedAt, ageSeconds, stale }
  };
}

export async function fetchQuoteSnapshot(symbol: string) {
  const normalized = normalizeSymbol(symbol);
  return quoteSnapshot(normalized, await providerQuote(normalized));
}

export async function fetchQuoteWithIndicators(symbol: string, range: ChartRange = DEFAULT_CHART_RANGE, includeFundamentals = true): Promise<QuoteResponse> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const now = new Date();
  const { days } = CHART_RANGES[range];
  const lookback = days > ANALYTICS_DAYS ? days + 345 : ANALYTICS_DAYS;
  const parts = await loadQuoteParts(providerQuote(normalizedSymbol), providerCandles(normalizedSymbol, lookback), includeFundamentals ? providerFundamentals(normalizedSymbol) : Promise.resolve(undefined));
  const result = parts.history?.value;
  const quote = parts.quote?.value;
  const profile = parts.profile?.value;
  const quoteFields = (quote ?? {}) as Record<string, unknown>;
  const assetProfile = profile?.assetProfile as Record<string, unknown> | undefined;
  const defaultKeyStatistics = profile?.defaultKeyStatistics as Record<string, unknown> | undefined;
  const summaryDetail = profile?.summaryDetail as Record<string, unknown> | undefined;
  const tradingDate = tradingDateFormatter(result?.meta?.exchangeTimezoneName);
  const today = tradingDate(now);
  const end = result?.meta?.currentTradingPeriod?.regular?.end;
  const yesterday = new Date(now.getTime() - 86400000);
  const completedSession = end && now >= end ? today : tradingDate(yesterday);
  const matchingHistory = !quote?.currency || !result?.meta?.currency || quote.currency === result.meta.currency;
  const history = matchingHistory ? normalizeCandles(result?.quotes ?? [], tradingDate) : [];
  const latestBar = history.at(-1);
  const latestPrice = quote?.regularMarketPrice ?? latestBar?.close;
  if (latestPrice == null) throw new MarketDataError("provider_unavailable");
  const prior = history.at(-2)?.close;
  const snapshot: QuoteSnapshot = parts.quote ? quoteSnapshot(normalizedSymbol, parts.quote) : {
    symbol: normalizedSymbol, name: result?.meta?.longName ?? result?.meta?.shortName,
    exchange: result?.meta?.fullExchangeName ?? result?.meta?.exchangeName, currency: result?.meta?.currency,
    latestPrice, changePercent: prior ? (latestPrice / prior - 1) * 100 : null, previousClose: prior,
    lastUpdated: parts.history!.retrievedAt,
    freshness: { source: "history", retrievedAt: parts.history!.retrievedAt, ageSeconds: parts.history!.ageSeconds, stale: true }
  };
  const unavailable: QuoteResponse["unavailable"] = [];
  if (includeFundamentals && (!profile || parts.profile?.stale)) unavailable.push("fundamentals");
  if (!history.length) unavailable.push("history");
  if (!quote) unavailable.push("quote");

  const { candles, chart, analytics, indicators, calculation, movingAverages } = buildDailySeries(history, range, today, latestPrice, completedSession);
  const calculationCandles = analytics.candles;
  const closes = calculationCandles.map((candle) => candle.close);
  const latestClose = closes.at(-1) ?? latestPrice;
  const latestRsi = calculation.rsi14.at(-1) ?? null;
  const latestMacd = calculation.macd.at(-1) ?? null;
  const latestSignal = calculation.signal.at(-1) ?? null;
  const momentumScore = normalizedMomentum(latestMacd, latestSignal, latestClose);

  const supportResistance = calculationCandles.length < 30
    ? { supports: [] as PriceZone[], resistances: [] as PriceZone[], message: "ข้อมูลรายวันน้อยกว่า 30 แท่ง จึงยังประเมินโซนที่ควรจับตาไม่ได้" }
    : {
        supports: buildZones(extractSwings(calculationCandles, "support"), latestPrice, calculationCandles.length, "support"),
        resistances: buildZones(extractSwings(calculationCandles, "resistance"), latestPrice, calculationCandles.length, "resistance")
      };

  return {
    ...snapshot,
    currency: snapshot.currency ?? result?.meta?.currency,
    sector: asString(assetProfile?.sector),
    industry: asString(assetProfile?.industry),
    unavailable,
    historyStale: parts.history?.stale ?? false,
    candles,
    chart,
    analytics,
    indicators,
    insight: {
      trend: getTrend(calculation.sma20.at(-1) ?? null, calculation.ema20.at(-1) ?? null, latestClose),
      momentum: momentumScore >= 0.75 ? "strong" : momentumScore >= 0.25 ? "moderate" : "weak",
      momentumScore,
      rsiSignal: latestRsi != null && latestRsi > 70 ? "overbought" : latestRsi != null && latestRsi < 30 ? "oversold" : "neutral",
      macdSignal: latestMacd == null || latestSignal == null ? "neutral" : latestMacd > latestSignal ? "buy" : latestMacd < latestSignal ? "sell" : "neutral",
      volatility: volatility(closes)
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

export async function searchSymbols(query: string) {
  const result = await providerSearchResults(query.trim().toUpperCase());
  if (!Array.isArray(result.value.quotes)) throw new MarketDataError("provider_unavailable");
  return { results: normalizeSearchQuotes(result.value.quotes), stale: result.stale, retrievedAt: result.retrievedAt };
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

async function fetchPredefinedScreener(type: RankingType) {
  const screenerId = MARKET_SCREENER_IDS[type];
  if (!screenerId) throw new MarketDataError("invalid_parameter");
  const params = new URLSearchParams({ formatted: "false", lang: "en-US", region: "US", scrIds: screenerId, count: "25", start: "0" });
  const result = await providerScreener(params);
  if (!Array.isArray(result.value)) throw new MarketDataError("provider_unavailable");
  return { ...result, value: result.value.map((item) => (item && typeof item === "object" ? toRankingStock(item as Record<string, unknown>) : null)).filter((item): item is RankingStock => item != null) };
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
  return mapWithConcurrency(items, 4, async (item) => {
    try {
      const { value: result } = await providerCandles(item.symbol, ANALYTICS_DAYS);
      const closes = normalizeCandles(result.quotes, tradingDateFormatter(result.meta.exchangeTimezoneName)).map((candle) => candle.close);
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
  const quote = await providerBatchQuotes(RANKING_POOLS[type]);
  const raw = Array.isArray(quote) ? quote : [quote];
  let items = raw.map((item) => toRankingStock(item as unknown as Record<string, unknown>)).filter((item): item is RankingStock => item != null);
  if (type === "strongest-momentum" || type === "lowest-volatility") items = await enrichRankingAnalytics(items);
  return items;
}

const cachedRanking = createMarketCache<RankingResponse>({ ttlMs: 60_000, staleMs: 15 * 60_000 }, 24);

async function loadRanking(type: RankingType): Promise<RankingResponse> {
  let scope: RankingScope = "curated-universe";
  let candidates: RankingStock[] | undefined;
  let fetchedAt = new Date().toISOString();
  let stale = false;
  let curatedFallback = false;
  if (MARKET_SCREENER_IDS[type]) {
    try {
      const data = await fetchPredefinedScreener(type);
      candidates = data.value;
      stale = data.stale;
      fetchedAt = data.retrievedAt;
      scope = "market-screener";
    } catch {
      curatedFallback = true;
    }
  }
  const items = candidates ?? await fetchCuratedRanking(type);
  const stocks = byRanking(type, items).slice(0, 10).map((item, index) => ({ ...item, rank: index + 1 }));
  return {
    rankingType: type,
    title: RANKING_TITLES[type],
    stocks,
    fetchedAt,
    source: "Yahoo Finance",
    scope,
    scopeLabel: scope === "market-screener" ? "Yahoo predefined U.S. screener" : "Curated symbol universe",
    stale,
    curatedFallback
  };
}

export async function fetchRanking(type: RankingType): Promise<RankingResponse> {
  const result = await cachedRanking(type, () => loadRanking(type));
  return { ...result.value, stale: result.stale || result.value.stale };
}
