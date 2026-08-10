import { NextResponse } from "next/server";
import { fetchCompareStock } from "@/lib/services/compare";
import type { CompareApiResponse, CompareRange, CompareSeries } from "@/lib/types/compare";

const VALID_RANGES: CompareRange[] = ["1M", "6M", "1Y", "5Y"];
export const runtime = "nodejs";
export const revalidate = 300;

function isCompareRange(value: string | null): value is CompareRange {
  return value != null && VALID_RANGES.includes(value as CompareRange);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get("range");
  const raw = searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .filter((symbol, index, all) => all.indexOf(symbol) === index);

  if (!isCompareRange(rangeParam)) return NextResponse.json({ error: "Invalid range. Use 1M, 6M, 1Y, 5Y." }, { status: 400 });
  if (symbols.length < 2) return NextResponse.json({ error: "Please select at least 2 symbols." }, { status: 400 });
  if (symbols.length > 4) return NextResponse.json({ error: "Maximum 4 symbols allowed." }, { status: 400 });

  try {
    const results = await Promise.all(symbols.map((symbol) => fetchCompareStock(symbol, rangeParam)));
    const failed = results.find((result) => result.error);
    if (failed) throw new Error(`${failed.symbol}: ${failed.error}`);

    const series: CompareSeries[] = results.map((result) => ({
      symbol: result.symbol,
      name: result.name,
      points: result.points.map((point) => ({
        date: point.date,
        close: point.close,
        normalized: point.normalized,
        percentChange: point.normalized - 100
      })),
      metrics: {
        latestPrice: result.metrics.latestPrice,
        currency: result.metrics.currency,
        percentChange: result.metrics.percentChange,
        totalReturn: result.metrics.totalReturn,
        volatility: result.metrics.volatility,
        trend: result.metrics.trendDirection === "bullish" ? "uptrend" : result.metrics.trendDirection === "bearish" ? "downtrend" : "sideway",
        rsiSignal: result.metrics.rsi.toFixed(2),
        macdSignal: result.metrics.macdSignal,
        averageVolume: result.metrics.averageVolume,
        momentumScore: result.metrics.momentumScore,
        maxDrawdown: result.metrics.maxDrawdown,
        sharpeRatio: result.metrics.sharpeRatio,
        sortinoRatio: result.metrics.sortinoRatio
      }
    }));

    const response: CompareApiResponse = { symbols, range: rangeParam, series };
    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch one or more symbols." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
