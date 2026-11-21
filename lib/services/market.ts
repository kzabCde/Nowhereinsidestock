import { describeDailyHistory, normalizeCandles } from "./market-history";
import { providerCandles, providerFundamentals, providerQuote, providerSearchResults } from "./yahoo";
import { MarketDataError, normalizeSymbol } from "./market-errors";
import { loadQuoteParts } from "./quote-parts";
import { normalizeMarketTimeIso } from "@/lib/format/market-time";
import { directionalMomentum, volatility } from "@/lib/indicators/technical";
import { ANALYTICS_DAYS, CHART_RANGES, buildDailySeries } from "@/lib/indicators/daily-series";
import type {
  Candle,
  ChartRange,
  PriceZone,
  QuoteResponse,
  QuoteChart,
  QuoteSnapshot,
  SearchItem
} from "@/lib/types/market";

const DEFAULT_CHART_RANGE: ChartRange = "6M";

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
  if (sma20Value == null || ema20Value == null) return null;
  if (close > sma20Value && close > ema20Value) return "bullish" as const;
  if (close < sma20Value && close < ema20Value) return "bearish" as const;
  return "neutral" as const;
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
    .filter((zone) => (type === "support" ? zone.level <= latestPrice : zone.level >= latestPrice))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ level, lower, upper, touches, strength, type }) => ({ level, lower, upper, touches, strength, type }));
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

function historyLookback(range: ChartRange) {
  const { days } = CHART_RANGES[range];
  return days > ANALYTICS_DAYS ? days + 345 : ANALYTICS_DAYS;
}

export async function fetchQuoteChart(symbol: string, range: ChartRange): Promise<QuoteChart> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const { value, stale } = await providerCandles(normalizedSymbol, historyLookback(range));
  const { tradingDate, today, completedSession } = describeDailyHistory(value);
  const history = normalizeCandles(value.quotes ?? [], tradingDate);
  const latest = history.at(-1);
  if (!latest) throw new MarketDataError("insufficient_history");
  const { candles, chart, indicators } = buildDailySeries(history, range, today, latest.close, completedSession);
  if (!candles.length) throw new MarketDataError("insufficient_history");
  return { symbol: normalizedSymbol, currency: value.meta.currency, candles, chart, indicators, historyStale: stale };
}

export async function fetchQuoteWithIndicators(symbol: string, range: ChartRange = DEFAULT_CHART_RANGE, includeFundamentals = true): Promise<QuoteResponse> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const now = new Date();
  const parts = await loadQuoteParts(providerQuote(normalizedSymbol), providerCandles(normalizedSymbol, historyLookback(range)), includeFundamentals ? providerFundamentals(normalizedSymbol) : Promise.resolve(undefined));
  const result = parts.history?.value;
  const quote = parts.quote?.value;
  const profile = parts.profile?.value;
  const quoteFields = (quote ?? {}) as Record<string, unknown>;
  const assetProfile = profile?.assetProfile as Record<string, unknown> | undefined;
  const defaultKeyStatistics = profile?.defaultKeyStatistics as Record<string, unknown> | undefined;
  const summaryDetail = profile?.summaryDetail as Record<string, unknown> | undefined;
  const { tradingDate, today, completedSession } = describeDailyHistory(result, now);
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

  const comparablePrice = snapshot.currency != null && snapshot.currency === result?.meta?.currency ? latestPrice : NaN;
  const { candles, chart, analytics, indicators, calculation, movingAverages } = buildDailySeries(history, range, today, comparablePrice, completedSession);
  const calculationCandles = analytics.candles;
  const closes = calculationCandles.map((candle) => candle.close);
  const latestClose = closes.at(-1) ?? latestPrice;
  const latestRsi = calculation.rsi14.at(-1) ?? null;
  const latestMacd = calculation.macd.at(-1) ?? null;
  const latestSignal = calculation.signal.at(-1) ?? null;
  const momentumScore = directionalMomentum(latestMacd, latestSignal, latestClose);

  const supportResistance = calculationCandles.length < 30 || !Number.isFinite(comparablePrice)
    ? { supports: [] as PriceZone[], resistances: [] as PriceZone[], message: "ข้อมูลรายวันน้อยกว่า 30 แท่ง จึงยังประเมินโซนที่ควรจับตาไม่ได้" }
    : {
        supports: buildZones(extractSwings(calculationCandles, "support"), latestPrice, calculationCandles.length, "support"),
        resistances: buildZones(extractSwings(calculationCandles, "resistance"), latestPrice, calculationCandles.length, "resistance")
      };

  return {
    ...snapshot,
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
      momentum: momentumScore == null ? null : Math.abs(momentumScore) >= 0.75 ? "strong" : Math.abs(momentumScore) >= 0.25 ? "moderate" : "weak",
      momentumScore,
      rsiSignal: latestRsi == null ? undefined : latestRsi > 70 ? "overbought" : latestRsi < 30 ? "oversold" : "neutral",
      macdSignal: latestMacd == null || latestSignal == null ? undefined : latestMacd > latestSignal ? "buy" : latestMacd < latestSignal ? "sell" : "neutral",
      volatility: closes.length >= 3 ? volatility(closes) : null
    },
    movingAverages,
    supportResistance,
    fundamentalsRetrievedAt: parts.profile?.retrievedAt,
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
