"use client";

export type SearchSymbolItem = { symbol: string; name?: string; exchange?: string; type?: string; shortname?: string; exchDisp?: string };

export function CompareSearchResults({ results, loading, query, onAdd }: { results: SearchSymbolItem[]; loading: boolean; query: string; onAdd: (symbol: string) => void }) {
  if (loading) return null;
  if (query.trim() && results.length === 0) return <p className="mt-3 text-sm text-slate-300">No results found.</p>;
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {results.map((item) => (
        <article key={item.symbol} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", item.symbol)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
          <p className="font-semibold text-white">{item.symbol}</p>
          <p className="truncate text-xs text-slate-400">{item.name ?? item.shortname ?? "Unknown"}</p>
          <button type="button" onClick={() => onAdd(item.symbol)} className="btn-premium mt-3 min-h-8 rounded-xl px-3 py-1 text-xs">Add to Compare</button>
        </article>
      ))}
    </div>
  );
}
