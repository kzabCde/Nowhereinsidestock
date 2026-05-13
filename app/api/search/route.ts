import { NextResponse } from "next/server";
import { searchSymbols } from "@/lib/services/market";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);
  try {
    const results = await searchSymbols(q);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
