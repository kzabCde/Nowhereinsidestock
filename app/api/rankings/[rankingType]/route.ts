import { NextResponse } from "next/server";
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
    return NextResponse.json({ message: "Invalid ranking type" }, { status: 400 });
  }

  try {
    const data = await fetchRanking(rankingType);
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" }
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to fetch rankings" }, { status: 500 });
  }
}
