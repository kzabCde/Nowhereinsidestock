"use client";

type SearchItem = { symbol: string; shortname?: string };

type Props = { value: string; onChange: (value: string) => void; onAdd: () => void; results: SearchItem[]; onPick: (symbol: string) => void };

export function CompareInput({ value, onChange, onAdd, results, onPick }: Props) {
  return <div><div className="mt-4 flex gap-2"><input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Add symbol (e.g. AAPL)" className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2" /><button onClick={onAdd} className="btn-premium">Add</button></div>{results.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{results.map((s) => <button key={s.symbol} onClick={() => onPick(s.symbol)} className="rounded-lg border border-white/15 px-2 py-1 text-xs">{s.symbol}</button>)}</div>}</div>;
}
