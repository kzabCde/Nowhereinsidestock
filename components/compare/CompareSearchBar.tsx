"use client";

export function CompareSearchBar({ query, onChange, loading }: { query: string; onChange: (value: string) => void; loading: boolean }) {
  return (
    <div className="mt-4">
      <input value={query} onChange={(e) => onChange(e.target.value)} placeholder="Search symbol" className="w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2" />
      {loading && <p className="mt-2 text-xs text-slate-300">Searching...</p>}
    </div>
  );
}
