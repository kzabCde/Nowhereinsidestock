import Link from "next/link";
import type { BusinessSector } from "@/lib/constants/sectors";

export function SectorCard({ sector }: { sector: BusinessSector }) {
  return (
    <article className="printstream-shell pearl-border rounded-2xl p-4">
      <h3 className="text-lg font-semibold">{sector.name}</h3>
      <p className="mt-1 text-sm text-slate-300">{sector.description}</p>
      <p className="mt-2 text-xs text-slate-400">{sector.stocks.length} tracked stocks</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {sector.stocks.slice(0, 5).map((stock) => (
          <span key={stock.symbol} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs">{stock.symbol}</span>
        ))}
      </div>
      <Link href={`/sectors/${sector.id}`} className="btn-premium mt-4 inline-flex">View Sector</Link>
    </article>
  );
}
