"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SectorStockQuote } from "@/lib/types/sectors";

type ApiResponse = { sector: { id: string; name: string; description: string }; stocks: SectorStockQuote[]; pagination: { page: number; pageSize: number; totalPages: number; hasPrevious: boolean; hasNext: boolean }; meta: { source: string; fetchedAt: string; note?: string } };
const sorts = ["marketcap-desc","marketcap-asc","price-desc","price-asc","change-desc","change-asc","volume-desc","volume-asc","symbol-asc","symbol-desc"] as const;

export function SectorDetailClient() {
  const params = useParams<{ sectorId: string }>();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const sort = searchParams.get("sort") ?? "marketcap-desc";
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/sectors/${params.sectorId}?page=${page}&pageSize=10&sort=${encodeURIComponent(sort)}`, { cache: "no-store" })
      .then(async (r) => r.json() as Promise<ApiResponse>)
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, [params.sectorId, page, sort]);

  if (loading) return <main className="grid-overlay min-h-screen px-4 py-6 sm:px-6"><div className="mx-auto max-w-7xl space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/10" />)}</div></main>;

  return <main className="grid-overlay min-h-screen px-4 py-6 sm:px-6"><div className="mx-auto max-w-7xl space-y-4"><h1 className="text-3xl font-bold">{data?.sector.name}</h1><p className="text-sm text-slate-300">{data?.sector.description}</p><p className="text-xs text-slate-400">{data?.meta.note}</p><select defaultValue={sort} onChange={(e) => { window.location.href = `/sectors/${params.sectorId}?page=1&sort=${e.target.value}`; }} className="rounded-lg border border-white/20 bg-transparent px-2 py-1">{sorts.map((s)=><option key={s} value={s} className="bg-slate-900">{s}</option>)}</select><div className="space-y-2">{(data?.stocks ?? []).map((stock)=><article key={stock.symbol} className="printstream-shell pearl-border rounded-xl p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs text-slate-400">{stock.symbol}</p><h3 className="font-semibold">{stock.name}</h3></div><span className="rounded-full border border-white/20 px-2 py-1 text-xs">{stock.trend}</span></div><p>${stock.latestPrice?.toFixed(2) ?? "-"} | {stock.changePercent?.toFixed(2) ?? "-"}% | Vol {stock.volume ?? "-"} | MCap {stock.marketCap ?? "-"}</p><div className="mt-2 flex flex-wrap gap-2"><button className="btn-premium">Favorite</button><Link className="btn-premium" href={`/stocks/${stock.symbol}`}>View Detail</Link><Link className="btn-premium" href={`/compare?symbols=${stock.symbol}`}>Add to Compare</Link></div></article>)}</div><div className="flex flex-wrap gap-2">{Array.from({ length: 20 }, (_, i)=>i+1).map((p)=><Link key={p} href={`/sectors/${params.sectorId}?page=${p}&sort=${sort}`} className={`rounded px-3 py-1 ${p===page?"bg-white/20":"bg-white/5"}`}>{p}</Link>)}</div></div></main>;
}
