import { fetchScreener, RANKING_TITLES } from "@/lib/services/rankings";
import { MarketDataError, marketErrorResponse, normalizeSymbol } from "@/lib/services/market-errors";
import type { ScreenerUniverse } from "@/lib/types/market";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const universe = query.get("universe") ?? "top-gainers";
    if (universe !== "custom" && !Object.hasOwn(RANKING_TITLES, universe)) throw new MarketDataError("invalid_parameter", "Invalid screener universe.");
    const raw = query.get("symbols") ?? "";
    if (raw.length > 520) throw new MarketDataError("invalid_parameter", "Select up to 20 symbols.");
    const symbols = universe === "custom" ? [...new Set(raw.split(/[\s,]+/).filter(Boolean).map(normalizeSymbol))] : [];
    if (universe === "custom" && (!symbols.length || symbols.length > 20)) throw new MarketDataError("invalid_parameter", "Select 1 to 20 symbols.");
    const options = [query.get("technical"), query.get("fundamental")];
    if (options.some((value) => value !== null && value !== "0" && value !== "1")) throw new MarketDataError("invalid_parameter");
    const data = await fetchScreener(universe as ScreenerUniverse, symbols, options[0] === "1", options[1] === "1");
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return marketErrorResponse(error);
  }
}
