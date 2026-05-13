import { WatchlistGrid } from "@/components/stocks/WatchlistGrid";

export default function WatchlistPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Your Watchlist</h1>
      <WatchlistGrid />
    </main>
  );
}
