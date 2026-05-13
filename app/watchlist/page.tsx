import Link from "next/link";
import { WatchlistGrid } from "@/components/stocks/WatchlistGrid";

export default function WatchlistPage() {
  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Watchlist</h1>
          <Link href="/" className="btn-premium w-full text-center sm:w-auto">Back to Dashboard</Link>
        </div>
        <WatchlistGrid />
      </div>
    </main>
  );
}
