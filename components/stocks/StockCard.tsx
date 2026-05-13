import Link from "next/link";
import type { QuoteResponse } from "@/lib/types/market";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";

export function StockCard({ stock }: { stock: QuoteResponse }) {
  const positive = stock.changePercent >= 0;
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-lg transition hover:-translate-y-1 hover:border-cyan-400/40">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{stock.name ?? stock.symbol}</h3>
          <p className="text-xs text-slate-400">{stock.symbol}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${stock.insight.trend === "bullish" ? "bg-emerald-500/20 text-emerald-300" : stock.insight.trend === "bearish" ? "bg-rose-500/20 text-rose-300" : "bg-slate-500/20 text-slate-200"}`}>{stock.insight.trend}</span>
      </div>
      <p className="text-2xl font-bold">${stock.latestPrice.toFixed(2)}</p>
      <p className={`mb-4 text-sm ${positive ? "text-emerald-300" : "text-rose-300"}`}>{positive ? "+" : ""}{stock.changePercent.toFixed(2)}%</p>
      <div className="flex flex-wrap gap-2">
        <FavoriteButton stock={{ symbol: stock.symbol, name: stock.name, exchange: stock.exchange, price: stock.latestPrice, changePercent: stock.changePercent }} />
        <Link href={`/stocks/${stock.symbol}`} className="rounded-full bg-cyan-400 px-3 py-1 text-sm font-semibold text-black">View Details</Link>
      </div>
    </article>
  );
}
