import { NextResponse } from "next/server";
import { fetchSectorStocks, getSectorInfo, isSectorSort } from "@/lib/services/sector-screener";
import type { SectorId, SectorSort } from "@/lib/types/sectors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 10;
const TOTAL_PAGES = 20;

function logDev(message: string, payload?: unknown) {
  if (process.env.NODE_ENV === "development") {
    if (payload === undefined) {
      console.info(`[api/sectors] ${message}`);
    } else {
      console.info(`[api/sectors] ${message}`, payload);
    }
  }
}

export async function GET(request: Request, context: { params: Promise<{ sectorId: string }> }) {
  const { sectorId } = await context.params;
  const { searchParams } = new URL(request.url);
  const pageNum = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(pageNum) ? pageNum : 1;
  const sortParam = searchParams.get("sort") ?? "marketcap-desc";
  const sort: SectorSort = isSectorSort(sortParam) ? sortParam : "marketcap-desc";

  logDev("Incoming request", { sectorId, page, sort });

  const sector = getSectorInfo(sectorId);
  if (!sector) {
    return NextResponse.json({ error: true, message: "Unable to load sector data", details: "Invalid sectorId" }, { status: 400 });
  }

  if (page < 1 || page > TOTAL_PAGES) {
    return NextResponse.json({ error: true, message: "Unable to load sector data", details: "Invalid page" }, { status: 400 });
  }

  try {
    const result = await fetchSectorStocks(sectorId as SectorId, page, sort);
    logDev("Yahoo response count", { count: result.stocks.length, source: result.source });

    const response = NextResponse.json({
      sector,
      stocks: result.stocks,
      pagination: { page, pageSize: PAGE_SIZE, totalPages: TOTAL_PAGES, hasPrevious: page > 1, hasNext: page < TOTAL_PAGES },
      meta: { source: "Yahoo Finance", fetchedAt: new Date().toISOString(), note: result.note }
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    logDev("Error", { sectorId, page, sort, details });
    const response = NextResponse.json({ error: true, message: "Unable to load sector data", details }, { status: 502 });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return response;
  }
}
