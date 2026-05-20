import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";
import { WatchlistGrid } from "@/components/stocks/WatchlistGrid";

export default function WatchlistPage() {
  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <AppHeader />
      <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Watchlist</h1>
          <Link href="/" className="btn-premium w-full text-center sm:w-auto">Back to Dashboard</Link>
        </div>
        <WatchlistGrid />
      </div>
    </main>
  );
}
