import { WatchlistGrid } from "@/components/stocks/WatchlistGrid";
import { PageShell } from "@/components/ui/PageShell";

export default function WatchlistPage() {
  return (
    <PageShell className="space-y-6">
      <div>
        <p className="section-kicker">Saved stocks</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Watchlist</h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500">
          Monitor saved stocks, view details, and send tickers into the compare builder.
        </p>
      </div>
      <WatchlistGrid />
    </PageShell>
  );
}
