import { createSearchHandler } from "@/lib/services/market-api";
import { searchSymbols } from "@/lib/services/market";

export const runtime = "nodejs";
export const GET = createSearchHandler(searchSymbols);
