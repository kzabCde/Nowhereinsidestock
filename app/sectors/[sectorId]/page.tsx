"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SectorFilters, type FilterMode } from "@/components/sectors/SectorFilters";
import { SectorSortControls, type SectorSort } from "@/components/sectors/SectorSortControls";
import { SectorStockList, type SectorStockRow } from "@/components/sectors/SectorStockList";

type ApiResponse = {
  sector: { id: string; name: string; description: string };
  stocks: SectorStockRow[];
  pagination: { limit: number; offset: number; total: number; hasMore: boolean };
};

export default function SectorDetailPage() {
  const params = useParams<{ sectorId: string }>();
  const sectorId = params.sectorId;
  const [items, setItems] = useState<SectorStockRow[]>([]);
  const [sectorName, setSectorName] = useState("Sector");
  const [description, setDescription] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState<SectorSort>("change-desc");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FilterMode>("all");

  const load = async (nextOffset: number) => {
    const res = await fetch(`/api/sectors/${sectorId}?limit=10&offset=${nextOffset}&sort=${sort}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as ApiResponse;
    setSectorName(data.sector.name);
    setDescription(data.sector.description);
    setHasMore(data.pagination.hasMore);
    setOffset(data.pagination.offset + data.pagination.limit);
    setItems((prev) => (nextOffset === 0 ? data.stocks : [...prev, ...data.stocks]));
  };

  useEffect(() => { void load(0); }, [sectorId]);

  const visible = useMemo(() => {
    const bySort = [...items].sort((a, b) => {
      const v = (n: number | null) => n ?? Number.NEGATIVE_INFINITY;
      if (sort === "price-desc") return v(b.latestPrice) - v(a.latestPrice);
      if (sort === "price-asc") return v(a.latestPrice) - v(b.latestPrice);
      if (sort === "change-desc") return v(b.changePercent) - v(a.changePercent);
      if (sort === "change-asc") return v(a.changePercent) - v(b.changePercent);
      if (sort === "volume-desc") return v(b.volume) - v(a.volume);
      if (sort === "marketcap-desc") return v(b.marketCap) - v(a.marketCap);
      if (sort === "trend-up") return Number(b.trend === "uptrend") - Number(a.trend === "uptrend");
      return a.symbol.localeCompare(b.symbol);
    });
    return bySort.filter((row) => {
      if (query && !(`${row.symbol} ${row.name}`.toLowerCase().includes(query.toLowerCase()))) return false;
      if (mode === "gainers" && (row.changePercent ?? 0) <= 0) return false;
      if (mode === "losers" && (row.changePercent ?? 0) >= 0) return false;
      return true;
    });
  }, [items, mode, query, sort]);

  const addCompare = (symbol: string) => {
    const raw = localStorage.getItem("compareSymbols");
    const current = raw ? (JSON.parse(raw) as string[]) : [];
    const next = Array.from(new Set([...current, symbol])).slice(0, 4);
    localStorage.setItem("compareSymbols", JSON.stringify(next));
    window.location.href = "/compare";
  };

  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <section className="printstream-shell pearl-border rounded-3xl p-4 sm:p-6">
          <Link href="/sectors" className="text-sm text-cyan-200">← Back to sectors</Link>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{sectorName}</h1>
          <p className="text-sm text-slate-300">{description}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SectorFilters query={query} onQuery={setQuery} mode={mode} onMode={setMode} />
            <SectorSortControls value={sort} onChange={setSort} />
          </div>
        </section>
        <SectorStockList stocks={visible} onCompare={addCompare} />
        {hasMore && <button className="btn-premium" onClick={() => void load(offset)}>Load More</button>}
      </div>
    </main>
  );
}
