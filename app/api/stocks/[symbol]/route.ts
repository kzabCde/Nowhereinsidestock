import { createQuoteHandler } from "@/lib/services/market-api";
import { fetchQuoteChart, fetchQuoteSnapshot, fetchQuoteWithIndicators } from "@/lib/services/market";

export const runtime = "nodejs";
export const GET = createQuoteHandler(fetchQuoteWithIndicators, fetchQuoteSnapshot, fetchQuoteChart);
