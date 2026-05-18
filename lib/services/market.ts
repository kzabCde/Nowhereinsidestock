import YahooFinance from "yahoo-finance2";
import { ema, macd, rsi, sma, volatility } from "@/lib/indicators/technical";
import type { Candle, PriceZone, QuoteResponse, SearchItem } from "@/lib/types/market";

const yahooFinance = new YahooFinance();

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}


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
  from.setDate(now.getDate() - 180);

  const result = await yahooFinance.chart(symbol, {
    period1: from,
    period2: now,
    interval: "1d"
  });
  const quote = await yahooFinance.quote(symbol);
  const profile = await yahooFinance.quoteSummary(symbol, { modules: ["assetProfile"] });
  const assetProfile = profile.assetProfile as Record<string, unknown> | undefined;

  const candles = normalizeCandles(result?.quotes);

  const windowCandles = candles.slice(-180);

  const closes = candles.map((c) => c.close);
  const sma20 = sma(closes, 20);
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

  return {
    symbol: symbol.toUpperCase(),
    name: asString(result.meta?.longName),
    exchange: asString(result.meta?.exchangeName),
    companyDescription: asString(assetProfile?.longBusinessSummary),
    sector: asString(assetProfile?.sector),
    industry: asString(assetProfile?.industry),
    website: asString(assetProfile?.website),
    fullTimeEmployees: asNumber(assetProfile?.fullTimeEmployees),
    latestPrice,
    changePercent,
    previousClose: quote.regularMarketPreviousClose,
    marketTime: quote.regularMarketTime ? new Date(quote.regularMarketTime * 1000).toISOString() : undefined,
    lastUpdated: new Date().toISOString(),
    candles,
    indicators: { sma20, ema20, rsi14, macd: macdLine, signal },
    insight: {
      trend: getTrend(sma20[latest], ema20[latest], latestClose),
      momentum: Math.abs(latestMacd - latestSignal) > 1.2 ? "strong" : Math.abs(latestMacd - latestSignal) > 0.5 ? "moderate" : "weak",
      rsiSignal: latestRsi > 70 ? "overbought" : latestRsi < 30 ? "oversold" : "neutral",
      macdSignal: latestMacd > latestSignal ? "buy" : latestMacd < latestSignal ? "sell" : "neutral",
      volatility: volatility(closes)
    },
    supportResistance
  };
}

export async function searchSymbols(query: string): Promise<SearchItem[]> {
  const data = await yahooFinance.search(query, {
    quotesCount: 8,
    newsCount: 0
  });

  const results: SearchItem[] = [];

  for (const rawItem of data.quotes) {
    const item = rawItem as Record<string, unknown>;

    const symbol = asString(item.symbol);

    if (!symbol) continue;

    results.push({
      symbol,
      shortname: asString(item.shortname),
      exchDisp: asString(item.exchDisp)
    });
  }

  return results;
}
