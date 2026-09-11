import { NextResponse } from "next/server";
import { normalizeMarketTimeIso } from "@/lib/format/market-time";
import { fetchQuoteWithIndicators, parseChartRange } from "@/lib/services/market";

export const runtime = "nodejs";
export const revalidate = 30;

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const range = parseChartRange(searchParams.get("range"));
    const data = await fetchQuoteWithIndicators(symbol, range);
    const marketTime = normalizeMarketTimeIso(data.marketTime, data.candles.at(-1)?.date);

    return NextResponse.json({ ...data, marketTime }, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unknown server error" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
