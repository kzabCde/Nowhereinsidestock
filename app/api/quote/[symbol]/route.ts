import { NextResponse } from "next/server";
import { fetchQuoteWithIndicators } from "@/lib/services/market";

export const revalidate = 120;

export async function GET(_: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const data = await fetchQuoteWithIndicators(symbol);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unknown server error"
      },
      { status: 400 }
    );
  }
}
