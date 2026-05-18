"use client";
import Link from "next/link";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";

export type SectorStockRow = { symbol: string; name: string; latestPrice: number | null; changePercent: number | null; volume: number | null; marketCap: number | null; trend: "uptrend" | "downtrend" | "sideway"; };

const fmt = (v: number | null) => (v == null ? "-" : v.toLocaleString());

export function SectorStockList({ stocks, onCompare }: { stocks: SectorStockRow[]; onCompare: (symbol: string) => void }) {
  return <div className="grid grid-cols-1 gap-3">{stocks.map((stock)=><article key={stock.symbol} className="printstream-shell pearl-border rounded-2xl p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-slate-400">{stock.symbol}</p><h3 className="font-semibold">{stock.name}</h3></div><span className="text-xs uppercase text-slate-300">{stock.trend}</span></div><div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><p>Price: {fmt(stock.latestPrice)}</p><p className={(stock.changePercent ?? 0)>=0?"text-emerald-300":"text-rose-300"}>Change: {stock.changePercent==null?"-":`${stock.changePercent.toFixed(2)}%`}</p><p>Volume: {fmt(stock.volume)}</p><p>MCap: {fmt(stock.marketCap)}</p></div><div className="mt-3 flex flex-wrap gap-2"><FavoriteButton stock={{symbol:stock.symbol,name:stock.name,price:stock.latestPrice ?? undefined,changePercent:stock.changePercent ?? undefined}}/><Link href={`/stocks/${stock.symbol}`} className="btn-premium">View Detail</Link><button onClick={()=>onCompare(stock.symbol)} className="rounded-xl border border-white/20 px-3 py-1.5 text-sm">Add to Compare</button></div></article>)}</div>;
}
