import YahooFinance from "yahoo-finance2";
import { ema, macd, rsi, sma, volatility } from "@/lib/indicators/technical";
import type { Candle, MovingAverageCrossSignal, MovingAverages, MovingAverageStatus, PriceZone, QuoteResponse, RankingResponse, RankingStock, RankingType, SearchItem } from "@/lib/types/market";

const yahooFinance = new YahooFinance();

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

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
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

  if (currentMa50 == null || currentMa200 == null || previousMa50 == null || previousMa200 == null) {
    return "insufficient";
  }

  if (previousMa50 <= previousMa200 && currentMa50 > currentMa200) return "golden_cross";
  if (previousMa50 >= previousMa200 && currentMa50 < currentMa200) return "death_cross";
  return "none";
};

const buildMovingAverages = (price: number, ma20Series: Array<number | null>, ma50Series: Array<number | null>, ma200Series: Array<number | null>): MovingAverages => {
  const ma20 = getLatestValue(ma20Series);
  const ma50 = getLatestValue(ma50Series);
  const ma200 = getLatestValue(ma200Series);

  return {
    ma20,
    ma50,
    ma200,
    priceVsMA20: comparePriceToAverage(price, ma20),
    priceVsMA50: comparePriceToAverage(price, ma50),
    priceVsMA200: comparePriceToAverage(price, ma200),
    crossSignal: getCrossSignal(ma50Series, ma200Series)
  };
};

const getTrend = (sma20: number | null, ema20: number | null, close: number) => {
  if (!sma20 || !ema20) return "neutral" as const;
  if (close > sma20 && close > ema20) return "bullish" as const;
  if (close < sma20 && close < ema20) return "bearish" as const;
  return "neutral" as const;
};

const normalizeCandles = (quotes: Array<{ date?: Date; open?: number | null; close?: number | null; high?: number | null; low?: number | null; volume?: number | null }> | undefined): Candle[] => {
  if (!quotes?.length) return [];

  return quotes
    .filter((c) => c.date instanceof Date && c.close != null && c.high != null && c.low != null)
    .map((c) => {
      const safeDate = c.date instanceof Date ? c.date.toISOString() : new Date(0).toISOString();

      return {
        date: safeDate,
        open: c.open ?? c.close ?? 0,
        high: c.high ?? 0,
        low: c.low ?? 0,
        close: c.close ?? 0,
        volume: c.volume ?? 0
      };
    });
};

type SwingPoint = {
  price: number;
  volume: number;
  index: number;
};

type ZoneType = "support" | "resistance";

const getStrength = (score: number): "weak" | "medium" | "strong" => {
  if (score >= 6) return "strong";
  if (score >= 3) return "medium";
  return "weak";
};

const extractSwings = (candles: Candle[], type: ZoneType): SwingPoint[] => {
  const points: SwingPoint[] = [];
  for (let i = 2; i < candles.length - 2; i += 1) {
    const prev2 = candles[i - 2];
    const prev1 = candles[i - 1];
    const current = candles[i];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    if (!prev2 || !prev1 || !current || !next1 || !next2) continue;

    if (
      type === "support"
        ? current.low < prev2.low && current.low < prev1.low && current.low < next1.low && current.low < next2.low
        : current.high > prev2.high && current.high > prev1.high && current.high > next1.high && current.high > next2.high
    ) {
      points.push({
        price: type === "support" ? current.low : current.high,
        volume: current.volume,
        index: i
      });
    }
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
      const sum = target.points.reduce((acc, item) => acc + item.price, 0);
      target.center = sum / target.points.length;
    } else {
      clusters.push({ points: [point], center: point.price });
    }
  }

  const maxVolume = points.reduce((acc, point) => Math.max(acc, point.volume), 1);

  const zones = clusters.map((cluster): PriceZone & { score: number } => {
    const touches = cluster.points.length;
    const weightedRecency = cluster.points.reduce((acc, point) => acc + ((point.index + 1) / candlesLength), 0) / touches;
    const weightedVolume = cluster.points.reduce((acc, point) => acc + point.volume / maxVolume, 0) / touches;
    const score = touches + weightedRecency * 1.5 + weightedVolume * 1.25;
    const level = cluster.points.reduce((acc, point) => acc + point.price, 0) / touches;

    return {
      type,
      level,
      lower: Math.max(level - tolerance, 0),
      upper: level + tolerance,
      touches,
      strength: getStrength(score),
      score
    };
  });

  const filtered = zones.filter((zone) => (type === "support" ? zone.level <= latestPrice * 1.02 : zone.level >= latestPrice * 0.98));
  const ordered = filtered.sort((a, b) => b.score - a.score).slice(0, 3);
  return ordered.map(({ score: _score, ...zone }) => zone);
};

export async function fetchQuoteWithIndicators(symbol: string): Promise<QuoteResponse> {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 420);

  const result = await yahooFinance.chart(symbol, {
    period1: from,
    period2: now,
    interval: "1d"
  });
  const quote = await yahooFinance.quote(symbol);
  const quoteFields = quote as Record<string, unknown>;
  const profile = await yahooFinance.quoteSummary(symbol, { modules: ["assetProfile", "defaultKeyStatistics", "summaryDetail"] });
  const assetProfile = profile.assetProfile as Record<string, unknown> | undefined;
  const defaultKeyStatistics = profile.defaultKeyStatistics as Record<string, unknown> | undefined;
  const summaryDetail = profile.summaryDetail as Record<string, unknown> | undefined;

  const candles = normalizeCandles(result?.quotes);

  const windowCandles = candles.slice(-180);

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
  const latestMacd = macdLine[latest] ?? 0;
  const latestSignal = signal[latest] ?? 0;
  const changePercent = quote.regularMarketChangePercent ?? (prev === 0 ? 0 : ((lastChartClose - prev) / prev) * 100);
  const movingAverages = buildMovingAverages(latestPrice, sma20, sma50, sma200);
  const supportPoints = extractSwings(windowCandles, "support");
  const resistancePoints = extractSwings(windowCandles, "resistance");
  const supportResistance =
    windowCandles.length < 30
      ? {
          supports: [] as PriceZone[],
          resistances: [] as PriceZone[],
          message: "ข้อมูลรายวันน้อยกว่า 30 แท่ง จึงยังประเมินโซนที่ควรจับตาไม่ได้"
        }
      : {
          supports: buildZones(supportPoints, latestPrice, windowCandles.length, "support"),
          resistances: buildZones(resistancePoints, latestPrice, windowCandles.length, "resistance")
        };

  const valuationMetrics = {
    trailingEps: asNumber(quoteFields.trailingEps) ?? asNumber(defaultKeyStatistics?.trailingEps),
    forwardEps: asNumber(quoteFields.forwardEps) ?? asNumber(defaultKeyStatistics?.forwardEps),
    trailingPE: asNumber(quoteFields.trailingPE) ?? asNumber(summaryDetail?.trailingPE),
    forwardPE: asNumber(quoteFields.forwardPE) ?? asNumber(defaultKeyStatistics?.forwardPE),
    bookValue: asNumber(quoteFields.bookValue) ?? asNumber(defaultKeyStatistics?.bookValue),
    dividendRate: asNumber(quoteFields.dividendRate) ?? asNumber(summaryDetail?.dividendRate)
  };

  return {
    symbol: symbol.toUpperCase(),
    name: asString(result.meta?.longName),
    exchange: asString(result.meta?.exchangeName),
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
      trend: getTrend(sma20[latest], ema20[latest], latestClose),
      momentum: Math.abs(latestMacd - latestSignal) > 1.2 ? "strong" : Math.abs(latestMacd - latestSignal) > 0.5 ? "moderate" : "weak",
      rsiSignal: latestRsi > 70 ? "overbought" : latestRsi < 30 ? "oversold" : "neutral",
      macdSignal: latestMacd > latestSignal ? "buy" : latestMacd < latestSignal ? "sell" : "neutral",
      volatility: volatility(closes)
    },
    movingAverages,
    supportResistance,
    valuationMetrics
  };
}

export async function searchSymbols(query: string): Promise<SearchItem[]> {
  const data = await yahooFinance.search(query, {
    quotesCount: 8,
    newsCount: 0
  });

  const results: SearchItem[] = [];
  const seenSymbols = new Set<string>();

  for (const rawItem of data.quotes) {
    const item = rawItem as Record<string, unknown>;
    const symbol = asString(item.symbol)?.trim().toUpperCase();
    const shortname = asString(item.shortname) ?? asString(item.shortName);
    const longname = asString(item.longname) ?? asString(item.longName);
    const exchDisp = asString(item.exchDisp) ?? asString(item.exchange);
    const quoteType = asString(item.quoteType) ?? asString(item.typeDisp);
    const index = asString(item.index);
    const isYahooFinance = item.isYahooFinance;

    if (index && index !== "quotes") continue;
    if (isYahooFinance === false) continue;
    if (!symbol || seenSymbols.has(symbol)) continue;

    seenSymbols.add(symbol);
    results.push({
      symbol,
      name: shortname ?? longname,
      exchange: exchDisp,
      type: quoteType,
      shortname,
      exchDisp,
      quoteType
    });

    if (results.length >= 8) break;
  }

  return results;
}

function toTrend(value: number | null): "uptrend" | "downtrend" | "sideway" {
  if (value == null) return "sideway";
  if (value > 0.2) return "uptrend";
  if (value < -0.2) return "downtrend";
  return "sideway";
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
      return [...items].sort((a, b) => {
        const aScore = (a.changePercent ?? -999) * 0.7 + Math.log10((a.volume ?? 1) + 1) * 0.3;
        const bScore = (b.changePercent ?? -999) * 0.7 + Math.log10((b.volume ?? 1) + 1) * 0.3;
        return bScore - aScore;
      });
    case "lowest-volatility":
      return [...items].sort((a, b) => Math.abs(a.changePercent ?? 999) - Math.abs(b.changePercent ?? 999));
  }
}

export async function fetchRanking(type: RankingType): Promise<RankingResponse> {
  const symbols = RANKING_POOLS[type];
  const quote = await yahooFinance.quote(symbols, { fields: ["symbol", "shortName", "regularMarketPrice", "regularMarketChangePercent", "regularMarketVolume", "marketCap"] });
  const raw = Array.isArray(quote) ? quote : [quote];
  const ranked = byRanking(type, raw.map((item) => ({
    rank: 0,
    symbol: item.symbol,
    name: item.shortName ?? item.symbol,
    latestPrice: item.regularMarketPrice ?? null,
    changePercent: item.regularMarketChangePercent ?? null,
    volume: item.regularMarketVolume ?? null,
    marketCap: item.marketCap ?? null,
    trend: toTrend(item.regularMarketChangePercent ?? null)
  }))).slice(0, 10).map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    rankingType: type,
    title: RANKING_TITLES[type],
    stocks: ranked,
    fetchedAt: new Date().toISOString(),
    source: "Yahoo Finance"
  };
}
