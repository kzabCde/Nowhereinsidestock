import { NextResponse } from "next/server";
import { MarketDataError, marketErrorResponse } from "@/lib/services/market-errors";
import { fetchRanking, RANKING_TITLES } from "@/lib/services/rankings";
import type { RankingType } from "@/lib/types/market";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_: Request, { params }: { params: Promise<{ rankingType: string }> }) {
  const { rankingType } = await params;
  if (!Object.hasOwn(RANKING_TITLES, rankingType)) {
    return marketErrorResponse(new MarketDataError("invalid_parameter", "Invalid ranking type."));
  }

  try {
    const data = await fetchRanking(rankingType as RankingType);
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return marketErrorResponse(error);
  }
}
