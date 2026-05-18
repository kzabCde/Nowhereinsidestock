"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SectorFilters, type FilterMode } from "@/components/sectors/SectorFilters";
import { SectorSortControls, type SectorSort } from "@/components/sectors/SectorSortControls";
import { SectorStockList, type SectorStockRow } from "@/components/sectors/SectorStockList";
import { useWatchlistStore } from "@/store/watchlist-store";

type ApiResponse = {
  sector: { id: string; name: string; description: string };
  stocks: SectorStockRow[];
  pagination: { page: number; pageSize: number; totalSymbols: number; totalPages: number; hasPrevious: boolean; hasNext: boolean };
};

export default function SectorDetailPage() {
  const params = useParams<{ sectorId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectorId = params.sectorId;
  const isFavorite = useWatchlistStore((s) => s.isFavorite);

  const [items, setItems] = useState<SectorStockRow[]>([]);
  const [sectorName, setSectorName] = useState("Sector");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SectorSort>((searchParams.get("sort") as SectorSort) ?? "change-desc");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<FilterMode>("all");
  const [pageData, setPageData] = useState({ page: 1, pageSize: 10, totalSymbols: 0, totalPages: 1, hasPrevious: false, hasNext: false });

  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? 10), 1), 20);

  const replaceQuery = (next: { page?: number; pageSize?: number; sort?: SectorSort }) => {
    const p = new URLSearchParams(searchParams.toString());
    if (next.page != null) p.set("page", String(next.page));
    if (next.pageSize != null) p.set("pageSize", String(next.pageSize));
    if (next.sort != null) p.set("sort", next.sort);
    router.replace(`/sectors/${sectorId}?${p.toString()}`);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/sectors/${sectorId}?page=${page}&pageSize=${pageSize}&sort=${sort}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Unable to load sector stocks right now.");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as ApiResponse;
      setSectorName(data.sector.name);
      setDescription(data.sector.description);
      setItems(data.stocks);
      setPageData(data.pagination);
      setLoading(false);
    };
    void load();
  }, [page, pageSize, sectorId, sort]);

  const visible = useMemo(() => {
    return items.filter((row) => {
      if (query && !(`${row.symbol} ${row.name}`.toLowerCase().includes(query.toLowerCase()))) return false;
      if (mode === "gainers" && (row.changePercent ?? 0) <= 0) return false;
      if (mode === "losers" && (row.changePercent ?? 0) >= 0) return false;
      if (mode === "favorites" && !isFavorite(row.symbol)) return false;
      return true;
    });
  }, [isFavorite, items, mode, query]);

  const addCompare = (symbol: string) => {
    const raw = localStorage.getItem("compareSymbols");
    const current = raw ? (JSON.parse(raw) as string[]) : [];
    const next = Array.from(new Set([...current, symbol])).slice(0, 4);
    localStorage.setItem("compareSymbols", JSON.stringify(next));
    window.location.href = "/compare";
  };

  const start = pageData.totalSymbols === 0 ? 0 : (pageData.page - 1) * pageData.pageSize + 1;
  const end = Math.min(pageData.page * pageData.pageSize, pageData.totalSymbols);

  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <section className="printstream-shell pearl-border rounded-3xl p-4 sm:p-6">
          <Link href="/sectors" className="text-sm text-cyan-200">← Back to sectors</Link>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{sectorName}</h1>
          <p className="text-sm text-slate-300">{description}</p>
          <p className="mt-2 text-xs text-slate-400">{pageData.totalSymbols} tracked stocks · Showing {start}–{end} of {pageData.totalSymbols}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SectorFilters query={query} onQuery={setQuery} mode={mode} onMode={setMode} />
            <div className="flex flex-col gap-2 sm:items-end">
              <SectorSortControls value={sort} onChange={(value) => { setSort(value); replaceQuery({ sort: value, page: 1 }); }} />
              <label className="text-xs text-slate-400">Page size
                <select className="ml-2 rounded-lg border border-white/20 bg-black/40 px-2 py-1" value={pageSize} onChange={(e) => replaceQuery({ pageSize: Number(e.target.value), page: 1 })}>
                  <option value={10}>10</option><option value={20}>20</option>
                </select>
              </label>
            </div>
          </div>
        </section>
        {error && <section className="printstream-shell rounded-2xl border border-rose-300/30 p-4 text-rose-200">{error}</section>}
        {loading ? <section className="h-56 animate-pulse rounded-2xl bg-white/5" /> : <SectorStockList stocks={visible} onCompare={addCompare} />}

        <section className="printstream-shell pearl-border rounded-2xl p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-300">Page {pageData.page} of {pageData.totalPages}</p>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-xl border border-white/20 px-3 py-1 text-sm disabled:opacity-50" disabled={!pageData.hasPrevious} onClick={() => replaceQuery({ page: pageData.page - 1 })}>Previous</button>
              {Array.from({ length: pageData.totalPages }, (_, i) => i + 1).slice(Math.max(0, pageData.page - 3), pageData.page + 2).map((p) => (
                <button key={p} className={`rounded-xl border px-3 py-1 text-sm ${p === pageData.page ? "border-cyan-300 text-cyan-200" : "border-white/20"}`} onClick={() => replaceQuery({ page: p })}>{p}</button>
              ))}
              <button className="rounded-xl border border-white/20 px-3 py-1 text-sm disabled:opacity-50" disabled={!pageData.hasNext} onClick={() => replaceQuery({ page: pageData.page + 1 })}>Next</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
