import { NextResponse } from "next/server";
import { fetchCompareStock } from "@/lib/services/compare";
import { alignPerformance } from "@/lib/finance/trading-dates";
import { maxDrawdown, sharpeRatio, sortinoRatio } from "@/lib/finance/risk";
import { MarketDataError, marketErrorResponse, normalizeSymbol } from "@/lib/services/market-errors";
import { volatility } from "@/lib/indicators/technical";
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
  try {
    const raw = searchParams.get("symbols") ?? "";
    if (!isCompareRange(rangeParam) || raw.length > 100) throw new MarketDataError("invalid_parameter", "Select a valid comparison range and symbols.");
    const symbols = [...new Set(raw.split(",").filter((symbol) => symbol.trim()).map(normalizeSymbol))];
    if (symbols.length < 2 || symbols.length > 4) throw new MarketDataError("invalid_parameter", "Select 2 to 4 symbols.");
    const results = await Promise.all(symbols.map((symbol) => fetchCompareStock(symbol, rangeParam)));
    const aligned = alignPerformance(results.map((result) => result.points));
    if (!aligned) throw new MarketDataError("insufficient_history", "At least two shared trading dates are required.");
    const series: CompareSeries[] = results.map((result, index) => {
      const points = aligned.points[index];
      const closes = points.map((point) => point.close);
      return {
      symbol: result.symbol,
      name: result.name,
      points,
      stale: result.stale,
      metrics: {
        latestPrice: result.metrics.latestPrice,
        currency: result.metrics.currency,
        lastUpdated: result.retrievedAt,
        percentChange: result.metrics.percentChange,
        totalReturn: points.at(-1)!.percentChange,
        volatility: volatility(closes),
        trend: result.metrics.trendDirection === "bullish" ? "uptrend" : result.metrics.trendDirection === "bearish" ? "downtrend" : "sideway",
        rsiSignal: result.metrics.rsi?.toFixed(2),
        macdSignal: result.metrics.macdSignal,
        averageVolume: result.metrics.averageVolume,
        momentumScore: result.metrics.momentumScore,
        maxDrawdown: maxDrawdown(closes),
        sharpeRatio: sharpeRatio(closes),
        sortinoRatio: sortinoRatio(closes)
      }
      };
    });

    const response: CompareApiResponse = { symbols, range: rangeParam, series, baselineDate: aligned.start, endDate: aligned.end };
    return NextResponse.json(response, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return marketErrorResponse(error);
  }
}
