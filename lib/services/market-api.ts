import { CHART_RANGES } from "../indicators/daily-series.ts";
import type { ChartRange, QuoteChart, QuoteResponse, QuoteSnapshot, SearchItem } from "../types/market.ts";
import { marketErrorResponse, MarketDataError, normalizeSymbol } from "./market-errors.ts";

export function createQuoteHandler(
  loadDetail: (symbol: string, range: ChartRange, includeFundamentals?: boolean) => Promise<QuoteResponse>,
  loadSummary: (symbol: string) => Promise<QuoteSnapshot>,
  loadChart?: (symbol: string, range: ChartRange) => Promise<QuoteChart>
) {
  return async (request: Request, { params }: { params: Promise<{ symbol: string }> }) => {
    try {
      const symbol = normalizeSymbol((await params).symbol);
      const query = new URL(request.url).searchParams;
      const range = query.get("range") ?? "6M";
      const view = query.get("view") ?? "detail";
      if (!Object.hasOwn(CHART_RANGES, range)) throw new MarketDataError("invalid_parameter", "Invalid chart range.");
      if (view !== "detail" && view !== "summary" && view !== "technical" && !(view === "chart" && loadChart)) throw new MarketDataError("invalid_parameter", "Invalid quote view.");
      const chartRange = range as ChartRange;
      const data = await (view === "summary" ? loadSummary(symbol) : view === "chart" && loadChart
        ? loadChart(symbol, chartRange) : loadDetail(symbol, chartRange, view === "detail"));
      return Response.json(data, { headers: { "Cache-Control": "no-store" } });
    } catch (reason) {
      return marketErrorResponse(reason);
    }
  };
}

export function createSearchHandler(search: (query: string) => Promise<{ results: SearchItem[]; stale: boolean; retrievedAt?: string }>) {
  return async (request: Request) => {
    const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
    const headers = { "Cache-Control": "no-store" };
    if (!query) return Response.json({ results: [] }, { headers });
    if (query.length > 80) return marketErrorResponse(new MarketDataError("invalid_parameter", "Search text is too long."));
    try {
      return Response.json(await search(query), { headers });
    } catch (reason) {
      return marketErrorResponse(reason);
    }
  };
}
