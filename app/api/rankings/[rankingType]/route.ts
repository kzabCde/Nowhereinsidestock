import { NextResponse } from "next/server";
import { MarketDataError, marketErrorResponse } from "@/lib/services/market-errors";
import { fetchRanking } from "@/lib/services/market";
import type { RankingType } from "@/lib/types/market";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const rankingTypes: RankingType[] = ["top-gainers", "top-losers", "most-active", "highest-market-cap", "highest-volume", "strongest-momentum", "lowest-volatility", "magnificent-seven", "thai-stocks", "ai-tech"];

function isRankingType(value: string): value is RankingType {
  return rankingTypes.includes(value as RankingType);
}

export async function GET(_: Request, { params }: { params: Promise<{ rankingType: string }> }) {
  const { rankingType } = await params;
  if (!isRankingType(rankingType)) {
    return marketErrorResponse(new MarketDataError("invalid_parameter", "Invalid ranking type."));
  }

  try {
    const data = await fetchRanking(rankingType);
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return marketErrorResponse(error);
  }
}
