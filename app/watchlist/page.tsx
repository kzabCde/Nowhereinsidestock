import { WatchlistGrid } from "@/components/stocks/WatchlistGrid";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";

export default function WatchlistPage() {
  return (
    <PageShell className="space-y-6">
      <SectionCard>
        <p className="section-kicker">Favorites</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Watchlist</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Monitor saved stocks, remove favorites, open detail pages, or send tickers into the compare builder.</p>
      </SectionCard>
      <WatchlistGrid />
    </PageShell>
  );
}
