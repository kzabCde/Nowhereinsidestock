"use client";

import Link from "next/link";
import { useState } from "react";
import { BUSINESS_SECTORS } from "@/lib/constants/sectors";

export function BusinessSectors() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleSector = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const compareSector = (symbols: string[]) => {
    const next = symbols.slice(0, 4);
    localStorage.setItem("compareSymbols", JSON.stringify(next));
    window.location.href = "/compare";
  };

  return (
    <section className="w-full max-w-full space-y-4" id="business-sectors">
      <div>
        <h2 className="text-xl font-semibold">Business Sectors</h2>
        <p className="mt-1 text-sm text-slate-300">Explore stocks by industry and business type.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {BUSINESS_SECTORS.map((sector) => {
          const isExpanded = Boolean(expanded[sector.id]);
          return (
            <article key={sector.id} className="printstream-shell pearl-border min-w-0 max-w-full rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-slate-100">{sector.name}</h3>
              <p className="mt-1 text-sm text-slate-300">{sector.description}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {sector.stocks.slice(0, 4).map((stock) => (
                  <Link
                    key={stock.symbol}
                    href={`/stocks/${stock.symbol}`}
                    className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-200"
                  >
                    {stock.symbol}
                  </Link>
                ))}
              </div>

              {isExpanded && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {sector.stocks.map((stock) => (
                    <Link
                      key={`${sector.id}-${stock.symbol}`}
                      href={`/stocks/${stock.symbol}`}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-200"
                    >
                      {stock.symbol} <span className="text-slate-400">· {stock.name}</span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button className="btn-premium w-full sm:w-auto" onClick={() => toggleSector(sector.id)}>
                  {isExpanded ? "Hide Stocks" : "View Stocks"}
                </button>
                <button className="w-full rounded-xl border border-white/20 px-4 py-2 text-sm sm:w-auto" onClick={() => compareSector(sector.stocks.map((stock) => stock.symbol))}>
                  Compare Sector
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
