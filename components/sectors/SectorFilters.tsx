export type FilterMode = "all" | "gainers" | "losers" | "favorites";

export function SectorFilters({ query, onQuery, mode, onMode }: { query: string; onQuery: (value: string) => void; mode: FilterMode; onMode: (mode: FilterMode) => void }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search in sector..." className="h-10 rounded-xl border border-white/20 bg-black/40 px-3 text-sm" />
      <select value={mode} onChange={(e) => onMode(e.target.value as FilterMode)} className="h-10 rounded-xl border border-white/20 bg-black/40 px-3 text-sm">
        <option value="all">All</option><option value="gainers">Gainers</option><option value="losers">Losers</option><option value="favorites">Favorites</option>
      </select>
    </div>
  );
}
