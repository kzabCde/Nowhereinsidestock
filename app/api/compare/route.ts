import { fetchCompareStock } from "@/lib/services/compare";
import { alignPerformance } from "@/lib/finance/trading-dates";
import { maxDrawdown, sharpeRatio, simpleReturns, sortinoRatio } from "@/lib/finance/risk";
import { MarketDataError, marketErrorResponse, normalizeSymbol } from "@/lib/services/market-errors";
import { volatility } from "@/lib/indicators/technical";
import type { CompareApiResponse, CompareRange, CompareSeries } from "@/lib/types/compare";

const VALID_RANGES: CompareRange[] = ["1M", "6M", "1Y", "5Y"];
export const runtime = "nodejs";

function isCompareRange(value: string | null): value is CompareRange {
  return value != null && VALID_RANGES.includes(value as CompareRange);
}

export async function GET(req: Request) {
  const query = new URL(req.url).searchParams;
  const range = query.get("range");
  try {
    const raw = query.get("symbols") ?? "";
    if (!isCompareRange(range) || raw.length > 100) throw new MarketDataError("invalid_parameter", "Select a valid comparison range and symbols.");
    const symbols = [...new Set(raw.split(",").filter((symbol) => symbol.trim()).map(normalizeSymbol))];
    if (symbols.length < 2 || symbols.length > 4) throw new MarketDataError("invalid_parameter", "Select 2 to 4 symbols.");
    const results = await Promise.all(symbols.map((symbol) => fetchCompareStock(symbol, range)));
    const aligned = alignPerformance(results.map((result) => result.points));
    if (!aligned) throw new MarketDataError("insufficient_history", "At least two shared trading dates are required.");

    const series: CompareSeries[] = results.map((result, index) => {
      const points = aligned.points[index];
      const closes = points.map(({ close }) => close);
      const volumes = points.flatMap(({ volume }) => volume != null && Number.isFinite(volume) && volume >= 0 ? [volume] : []);
      const returns = simpleReturns(closes);
      const enough = returns.length >= 2;
      return {
        symbol: result.symbol,
        name: result.name,
        points: points.map(({ date, close, normalized, percentChange }) => ({ date, close, normalized, percentChange })),
        stale: result.stale,
        metrics: {
          ...result.metrics,
          totalReturn: points.at(-1)!.percentChange,
          volatility: enough ? volatility(closes) : null,
          averageVolume: volumes.length ? volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length : null,
          maxDrawdown: maxDrawdown(closes),
          sharpeRatio: enough && returns.some((value) => value !== returns[0]) ? sharpeRatio(closes) : undefined,
          sortinoRatio: enough && returns.some((value) => value < 0) ? sortinoRatio(closes) : undefined
        }
      };
    });

    const response: CompareApiResponse = { symbols, range, series, baselineDate: aligned.start, endDate: aligned.end };
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return marketErrorResponse(error);
  }
}
