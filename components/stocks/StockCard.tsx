import Link from "next/link";
import type { QuoteResponse } from "@/lib/types/market";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";

export function StockCard({ stock }: { stock: QuoteResponse }) {
  const positive = stock.changePercent >= 0;
  return (
    <article className="premium-card w-full rounded-3xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20 hover:bg-white/[0.055] sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{stock.symbol}</p>
          <h3 className="mt-2 truncate text-lg font-semibold text-white">{stock.name ?? stock.symbol}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] uppercase text-slate-300">{stock.insight.trend}</span>
      </div>
      <p className="text-3xl font-semibold tracking-tight text-white">${stock.latestPrice.toFixed(2)}</p>
      <p className={`mt-1 text-sm font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>{positive ? "+" : ""}{stock.changePercent.toFixed(2)}%</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <FavoriteButton stock={{ symbol: stock.symbol, name: stock.name, exchange: stock.exchange, price: stock.latestPrice, changePercent: stock.changePercent }} />
        <Link href={`/stocks/${stock.symbol}`} className="btn-premium w-full sm:w-auto">View Details</Link>
      </div>
    </article>
  );
}
