export type SectorSort = "price-desc" | "price-asc" | "change-desc" | "change-asc" | "volume-desc" | "marketcap-desc" | "symbol-asc" | "trend-up";

export function SectorSortControls({ value, onChange }: { value: SectorSort; onChange: (value: SectorSort) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as SectorSort)} className="rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm">
      <option value="price-desc">Price: high to low</option><option value="price-asc">Price: low to high</option><option value="change-desc">Change %: gainers first</option><option value="change-asc">Change %: losers first</option><option value="volume-desc">Volume: high to low</option><option value="marketcap-desc">Market cap: high to low</option><option value="symbol-asc">Symbol: A-Z</option><option value="trend-up">Trend: uptrend first</option>
    </select>
  );
}
