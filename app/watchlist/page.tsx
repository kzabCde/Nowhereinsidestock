import Link from "next/link";
import { WatchlistGrid } from "@/components/stocks/WatchlistGrid";

export default function WatchlistPage() {
  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
        <div><h1 className="text-3xl font-bold">Watchlist</h1></div>
        <WatchlistGrid />
      </div>
    </main>
  );
}
