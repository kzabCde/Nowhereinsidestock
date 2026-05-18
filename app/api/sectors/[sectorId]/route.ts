import { NextResponse } from "next/server";
import { fetchSectorStocks, getSectorInfo, isSectorSort } from "@/lib/services/sector-screener";
import type { SectorId, SectorSort } from "@/lib/types/sectors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 10;
const TOTAL_PAGES = 20;

export async function GET(request: Request, context: { params: Promise<{ sectorId: string }> }) {
  const { sectorId } = await context.params;
  const sector = getSectorInfo(sectorId);
  if (!sector) return NextResponse.json({ error: "Invalid sectorId" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const pageNum = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(pageNum) ? pageNum : 1;
  if (page < 1 || page > TOTAL_PAGES) return NextResponse.json({ error: "Invalid page" }, { status: 400 });

  const sortParam = searchParams.get("sort") ?? "marketcap-desc";
  const sort: SectorSort = isSectorSort(sortParam) ? sortParam : "marketcap-desc";

  try {
    const result = await fetchSectorStocks(sectorId as SectorId, page, PAGE_SIZE, sort);
    const response = NextResponse.json({
      sector,
      stocks: result.stocks,
      pagination: { page, pageSize: PAGE_SIZE, totalPages: TOTAL_PAGES, hasPrevious: page > 1, hasNext: page < TOTAL_PAGES },
      meta: { source: "Yahoo Finance", fetchedAt: new Date().toISOString(), note: result.note }
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  } catch {
    const response = NextResponse.json({
      sector,
      stocks: [],
      pagination: { page, pageSize: PAGE_SIZE, totalPages: TOTAL_PAGES, hasPrevious: page > 1, hasNext: page < TOTAL_PAGES },
      meta: { source: "Yahoo Finance", fetchedAt: new Date().toISOString(), note: "Unable to load sector data from provider right now." }
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  }
}
