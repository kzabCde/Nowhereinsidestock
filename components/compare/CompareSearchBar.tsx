"use client";

export function CompareSearchBar({ query, onChange, loading }: { query: string; onChange: (value: string) => void; loading: boolean }) {
  return (
    <div className="mt-5">
      <input value={query} onChange={(e) => onChange(e.target.value)} placeholder="Search stock to compare" className="h-12 w-full rounded-3xl border border-white/15 bg-black/30 px-4 text-sm uppercase text-white outline-none transition placeholder:normal-case placeholder:text-slate-500 focus:border-cyan-200/60 focus:ring-2 focus:ring-cyan-200/15" />
      {loading && <p className="mt-2 text-xs text-slate-300">Searching...</p>}
    </div>
  );
}
