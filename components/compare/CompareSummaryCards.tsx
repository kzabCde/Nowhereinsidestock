export function CompareSummaryCards({ summary }: { summary: { bestPerformer: string; lowestVolatility: string; strongestMomentum: string; mostStable: string } | null }) {
  if (!summary) return null;
  return <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(summary).map(([k, v]) => <article key={k} className="printstream-shell pearl-border rounded-2xl p-4"><p className="text-xs text-slate-300">{k}</p><p className="text-lg font-semibold">{v}</p></article>)}</section>;
}
