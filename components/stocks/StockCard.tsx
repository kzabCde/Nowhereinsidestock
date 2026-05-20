import Link from "next/link";
import type { QuoteResponse } from "@/lib/types/market";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";

export function StockCard({ stock }: { stock: QuoteResponse }) {
  const positive = stock.changePercent >= 0;
  return (
    <article className="printstream-shell pearl-border glow-soft w-full overflow-hidden rounded-3xl p-4 sm:p-5 lg:p-6">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs tracking-widest text-slate-400">{stock.symbol}</p>
          <h3 className="truncate text-lg font-semibold">{stock.name ?? stock.symbol}</h3>
        </div>
        <FavoriteButton stock={{ symbol: stock.symbol, name: stock.name, exchange: stock.exchange, price: stock.latestPrice, changePercent: stock.changePercent }} />
      </div>
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2"><span>💲</span> ${stock.latestPrice.toFixed(2)}</p>
        <p className={`flex items-center gap-2 ${positive ? "text-emerald-300" : "text-rose-300"}`}><span>{positive ? "📈" : "📉"}</span>{positive ? "+" : ""}{stock.changePercent.toFixed(2)}%</p>
        <p className="flex items-center gap-2 text-slate-300"><span>📶</span> Vol {new Intl.NumberFormat('en-US').format(stock.candles.at(-1)?.volume ?? 0)}</p>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link href={`/stocks/${stock.symbol}`} className="btn-premium w-full text-center sm:w-auto">View Detail ↗</Link>
        <Link href={`/compare?symbols=${stock.symbol}`} className="btn-premium w-full text-center sm:w-auto">Add to Compare</Link>
      </div>
    </article>
  );
}
