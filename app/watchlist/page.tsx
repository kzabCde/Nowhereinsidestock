import Link from "next/link";
import { WatchlistGrid } from "@/components/stocks/WatchlistGrid";

export default function WatchlistPage() {
  return (
    <main className="grid-overlay min-h-screen">
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Watchlist</h1>
          <Link href="/" className="btn-premium">Back to Dashboard</Link>
        </div>
        <WatchlistGrid />
      </div>
    </main>
  );
}
