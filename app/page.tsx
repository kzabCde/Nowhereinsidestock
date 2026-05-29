import Link from "next/link";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";
import { RealtimeStockSearch } from "@/components/stocks/RealtimeStockSearch";

export default function HomePage() {
  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="printstream-shell pearl-border glow-soft w-full min-w-0 max-w-full rounded-3xl p-4 text-center sm:p-8">
          <div className="flex min-w-0 flex-wrap justify-center">
            <NowhereInsideStockLogo className="justify-center" />
          </div>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">See the trend. Read the signal.</p>
          <div className="mx-auto mt-8 w-full max-w-2xl">
            <RealtimeStockSearch placeholder="Search stock symbol..." />
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link href="/rankings" className="btn-premium w-full sm:w-auto">Top Rankings</Link>
            <Link href="/watchlist" className="btn-premium w-full sm:w-auto">Watchlist</Link>
            <Link href="/compare" className="btn-premium w-full sm:w-auto">Compare</Link>
          </div>
        </header>

        <div id="magnificent-seven">
          <MagnificentSeven />
        </div>
      </div>
    </main>
  );
}
