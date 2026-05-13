import Link from "next/link";
import type { QuoteResponse } from "@/lib/types/market";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";

export function StockCard({ stock }: { stock: QuoteResponse }) {
  const positive = stock.changePercent >= 0;
  return (
    <article className="printstream-shell pearl-border glow-soft w-full max-w-full min-w-0 overflow-hidden rounded-2xl p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs tracking-widest text-slate-400">{stock.symbol}</p>
          <h3 className="truncate text-lg font-semibold">{stock.name ?? stock.symbol}</h3>
        </div>
        <span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-xs uppercase text-slate-300">{stock.insight.trend}</span>
      </div>
      <p className="text-3xl font-bold">${stock.latestPrice.toFixed(2)}</p>
      <p className={`mb-4 text-sm ${positive ? "text-emerald-300" : "text-rose-300"}`}>{positive ? "+" : ""}{stock.changePercent.toFixed(2)}%</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <FavoriteButton stock={{ symbol: stock.symbol, name: stock.name, exchange: stock.exchange, price: stock.latestPrice, changePercent: stock.changePercent }} />
        <Link href={`/stocks/${stock.symbol}`} className="btn-premium">View Details</Link>
      </div>
    </article>
  );
}
