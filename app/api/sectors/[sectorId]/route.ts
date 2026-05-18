import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { getSectorById } from "@/lib/constants/sectors";

const yahooFinance = new YahooFinance();

type Trend = "uptrend" | "downtrend" | "sideway";

type SectorStockQuote = {
  symbol: string;
  name: string;
  latestPrice: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  trend: Trend;
};

const getTrend = (changePercent: number | null): Trend => {
  if (changePercent == null) return "sideway";
  if (changePercent > 0.5) return "uptrend";
  if (changePercent < -0.5) return "downtrend";
  return "sideway";
};

export const revalidate = 60;

export async function GET(request: Request, { params }: { params: Promise<{ sectorId: string }> }) {
  const { sectorId } = await params;
  const sector = getSectorById(sectorId);
  if (!sector) return NextResponse.json({ error: "Invalid sectorId" }, { status: 404 });

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 10), 1), 10);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

  const sliced = sector.stocks.slice(offset, offset + limit);
  const stocks: SectorStockQuote[] = await Promise.all(
    sliced.map(async (stock) => {
      try {
        const q = await yahooFinance.quote(stock.symbol);
        return {
          symbol: stock.symbol,
          name: stock.name,
          latestPrice: q.regularMarketPrice ?? null,
          changePercent: q.regularMarketChangePercent ?? null,
          volume: q.regularMarketVolume ?? null,
          marketCap: q.marketCap ?? null,
          trend: getTrend(q.regularMarketChangePercent ?? null)
        };
      } catch {
        return { symbol: stock.symbol, name: stock.name, latestPrice: null, changePercent: null, volume: null, marketCap: null, trend: "sideway" };
      }
    })
  );

  return NextResponse.json({
    sector: { id: sector.id, name: sector.name, description: sector.description },
    stocks,
    pagination: { limit, offset, total: sector.stocks.length, hasMore: offset + limit < sector.stocks.length }
  }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } });
}
