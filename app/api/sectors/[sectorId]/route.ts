import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { getSectorById } from "@/lib/constants/sectors";

const yahooFinance = new YahooFinance();

type Trend = "uptrend" | "downtrend" | "sideway";
export type SectorStockQuote = {
  symbol: string;
  name: string;
  latestPrice: number | null;
  changePercent: number | null;
  volume: number | null;
  marketCap: number | null;
  trend: Trend;
};

type LiveSort = "price-desc" | "price-asc" | "change-desc" | "change-asc" | "volume-desc" | "marketcap-desc";
type StaticSort = "symbol-asc" | "name-asc";
type SectorSort = LiveSort | StaticSort;

const getTrend = (changePercent: number | null): Trend => {
  if (changePercent == null) return "sideway";
  if (changePercent > 0.5) return "uptrend";
  if (changePercent < -0.5) return "downtrend";
  return "sideway";
};

const isSectorSort = (value: string): value is SectorSort =>
  ["price-desc", "price-asc", "change-desc", "change-asc", "volume-desc", "marketcap-desc", "symbol-asc", "name-asc"].includes(value);

export const revalidate = 60;

export async function GET(request: Request, { params }: { params: Promise<{ sectorId: string }> }) {
  const { sectorId } = await params;
  const sector = getSectorById(sectorId);
  if (!sector) return NextResponse.json({ error: "Invalid sectorId" }, { status: 404 });

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") ?? 10), 1), 20);
  const rawSort = url.searchParams.get("sort") ?? "change-desc";
  const sort: SectorSort = isSectorSort(rawSort) ? rawSort : "change-desc";

  const sortedSymbols = [...sector.stocks];
  if (sort === "symbol-asc") sortedSymbols.sort((a, b) => a.symbol.localeCompare(b.symbol));
  if (sort === "name-asc") sortedSymbols.sort((a, b) => a.name.localeCompare(b.name));

  const totalSymbols = sortedSymbols.length;
  const totalPages = Math.max(Math.ceil(totalSymbols / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  const sliced = sortedSymbols.slice(start, end);
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

  const val = (n: number | null) => n ?? Number.NEGATIVE_INFINITY;
  if (sort === "price-desc") stocks.sort((a, b) => val(b.latestPrice) - val(a.latestPrice));
  if (sort === "price-asc") stocks.sort((a, b) => val(a.latestPrice) - val(b.latestPrice));
  if (sort === "change-desc") stocks.sort((a, b) => val(b.changePercent) - val(a.changePercent));
  if (sort === "change-asc") stocks.sort((a, b) => val(a.changePercent) - val(b.changePercent));
  if (sort === "volume-desc") stocks.sort((a, b) => val(b.volume) - val(a.volume));
  if (sort === "marketcap-desc") stocks.sort((a, b) => val(b.marketCap) - val(a.marketCap));

  return NextResponse.json(
    {
      sector: { id: sector.id, name: sector.name, description: sector.description },
      stocks,
      pagination: {
        page: currentPage,
        pageSize,
        totalSymbols,
        totalPages,
        hasPrevious: currentPage > 1,
        hasNext: currentPage < totalPages
      }
    },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" } }
  );
}
