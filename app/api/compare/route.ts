import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { unstable_cache } from "next/cache";
import { volatility, rsi, macd, sma } from "@/lib/indicators/technical";
import type { CompareApiResponse, CompareMetrics, CompareRange, CompareSeries } from "@/lib/types/compare";

const yahoo = new YahooFinance();
const ranges: Record<CompareRange, number> = { "1M": 30, "6M": 180, "1Y": 365, "5Y": 1825 };

const fetchChart = unstable_cache(async (symbol: string, range: CompareRange) => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - ranges[range]);
  return yahoo.chart(symbol, { period1: from, period2: now, interval: "1d" });
}, ["compare-api"], { revalidate: 300 });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") as CompareRange;
  const raw = searchParams.get("symbols") ?? "";
  const symbols = raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).filter((s, i, a) => a.indexOf(s) === i);
  if (!["1M", "6M", "1Y", "5Y"].includes(range)) return NextResponse.json({ error: "Invalid range. Use 1M, 6M, 1Y, 5Y." }, { status: 400 });
  if (symbols.length < 2) return NextResponse.json({ error: "Please select at least 2 symbols." }, { status: 400 });
  if (symbols.length > 4) return NextResponse.json({ error: "Maximum 4 symbols allowed." }, { status: 400 });

  try {
    const series = await Promise.all(symbols.map(async (symbol): Promise<CompareSeries> => {
      const data = await fetchChart(symbol, range);
      const quotes = ((data.quotes ?? []) as Array<{ date?: Date; close?: number | null; volume?: number | null }>).filter((q) => q.date && q.close != null);
      if (quotes.length < 2) throw new Error(`Not enough data for ${symbol}`);
      const closes = quotes.map((q) => q.close as number);
      const volumes = quotes.map((q) => q.volume ?? 0);
      const first = closes[0];
      const latest = closes[closes.length - 1];
      const macdResult = macd(closes);
      const rsiLatest = rsi(closes, 14).at(-1) ?? 50;
      const smaLatest = sma(closes, 20).at(-1) ?? latest;
      const points = quotes.map((q) => {
        const close = q.close as number;
        return { date: (q.date as Date).toISOString().slice(0, 10), close, normalized: (close / first) * 100, percentChange: ((close - first) / first) * 100 };
      });
      const metrics: CompareMetrics = {
        latestPrice: latest,
        totalReturn: ((latest - first) / first) * 100,
        volatility: volatility(closes),
        trend: latest > smaLatest ? "uptrend" : latest < smaLatest ? "downtrend" : "sideway",
        rsiSignal: rsiLatest > 70 ? "overbought" : rsiLatest < 30 ? "oversold" : "neutral",
        macdSignal: (macdResult.line.at(-1) ?? 0) > (macdResult.signal.at(-1) ?? 0) ? "bullish" : "bearish",
        averageVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length
      };
      return { symbol, name: data.meta?.longName as string | undefined, points, metrics };
    }));

    return NextResponse.json({ symbols, range, series } satisfies CompareApiResponse);
  } catch {
    return NextResponse.json({ error: "Failed to fetch one or more symbols. Please verify symbols and try again." }, { status: 502 });
  }
}
