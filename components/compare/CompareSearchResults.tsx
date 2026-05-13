"use client";

export type SearchSymbolItem = { symbol: string; shortname?: string; exchDisp?: string };

export function CompareSearchResults({ results, loading, query, onAdd }: { results: SearchSymbolItem[]; loading: boolean; query: string; onAdd: (symbol: string) => void }) {
  if (loading) return null;
  if (query.trim() && results.length === 0) return <p className="mt-2 text-sm text-slate-300">No results found.</p>;
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {results.map((item) => (
        <article key={item.symbol} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", item.symbol)} className="rounded-xl border border-white/15 p-3">
          <p className="font-semibold">{item.symbol}</p>
          <p className="text-xs text-slate-400">{item.shortname ?? "Unknown"}</p>
          <button onClick={() => onAdd(item.symbol)} className="mt-2 rounded-lg border border-cyan-300/40 px-2 py-1 text-xs">Add to Compare</button>
        </article>
      ))}
    </div>
  );
}
