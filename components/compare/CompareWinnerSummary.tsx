import type { WinnerSummary } from "@/lib/types/compare";

export function CompareWinnerSummary({ summary }: { summary: WinnerSummary }) {
  return <section className="printstream-shell pearl-border grid w-full max-w-full min-w-0 gap-2 overflow-hidden rounded-3xl p-4 text-sm sm:grid-cols-2 lg:grid-cols-5"><div>Best performer: <b>{summary.bestPerformer}</b></div><div>Lowest volatility: <b>{summary.lowestVolatility}</b></div><div>Strongest momentum: <b>{summary.strongestMomentum}</b></div><div>Most stable: <b>{summary.mostStable}</b></div><div>Highest volume: <b>{summary.highestVolume}</b></div></section>;
}
