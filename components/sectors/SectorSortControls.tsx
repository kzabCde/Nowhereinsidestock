export type SectorSort = "price-desc" | "price-asc" | "change-desc" | "change-asc" | "volume-desc" | "marketcap-desc" | "symbol-asc" | "name-asc";

export function SectorSortControls({ value, onChange }: { value: SectorSort; onChange: (value: SectorSort) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-400">Sorts current page only (live metrics)</p>
      <select value={value} onChange={(e) => onChange(e.target.value as SectorSort)} className="rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm">
        <option value="price-desc">Price high-low (current page)</option>
        <option value="price-asc">Price low-high (current page)</option>
        <option value="change-desc">Change % high-low (current page)</option>
        <option value="change-asc">Change % low-high (current page)</option>
        <option value="volume-desc">Volume high-low (current page)</option>
        <option value="marketcap-desc">Market cap high-low (current page)</option>
        <option value="symbol-asc">Symbol A-Z (all symbols)</option>
        <option value="name-asc">Company name A-Z (all symbols)</option>
      </select>
    </div>
  );
}
