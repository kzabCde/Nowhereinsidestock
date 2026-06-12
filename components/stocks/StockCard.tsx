import Link from "next/link";
import type { QuoteResponse } from "@/lib/types/market";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { Sparkline } from "@/components/stocks/Sparkline";

export function StockCard({ stock }: { stock: QuoteResponse }) {
  const positive = stock.changePercent >= 0;
  const sparkData = stock.candles.slice(-20).map((c) => c.close);

  return (
    <article className="flex flex-col rounded-2xl border border-white/[0.08] bg-surface p-4 transition-all hover:border-white/[0.14] hover:bg-elevated sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-kicker">{stock.symbol}</p>
          <h3 className="mt-1 truncate text-sm font-semibold text-white">{stock.name ?? stock.symbol}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            stock.insight.trend === "bullish"
              ? "border-success/25 bg-success/10 text-success"
              : stock.insight.trend === "bearish"
                ? "border-danger/25 bg-danger/10 text-danger"
                : "border-white/[0.08] bg-white/[0.04] text-slate-500"
          }`}
        >
          {stock.insight.trend}
        </span>
      </div>

      {/* Sparkline */}
      <div className="my-3">
        <Sparkline data={sparkData} positive={positive} />
      </div>

      {/* Price */}
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-white">
          ${stock.latestPrice.toFixed(2)}
        </p>
        <p className={`mb-0.5 text-sm font-semibold tabular-nums ${positive ? "text-success" : "text-danger"}`}>
          {positive ? "+" : ""}{stock.changePercent.toFixed(2)}%
        </p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <FavoriteButton
          stock={{
            symbol: stock.symbol,
            name: stock.name,
            exchange: stock.exchange,
            price: stock.latestPrice,
            changePercent: stock.changePercent
          }}
          compact
        />
        <Link href={`/stocks/${stock.symbol}`} className="btn-primary flex-1 text-center">
          View Details
        </Link>
      </div>
    </article>
  );
}
