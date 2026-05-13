"use client";

import { useWatchlistStore, type WatchlistItem } from "@/store/watchlist-store";

type Props = { stock: Omit<WatchlistItem, "addedAt"> };

export function FavoriteButton({ stock }: Props) {
  const isFav = useWatchlistStore((s) => s.isFavorite(stock.symbol));
  const toggle = useWatchlistStore((s) => s.toggleStock);

  return (
    <button
      aria-label={`favorite-${stock.symbol}`}
      onClick={() => toggle(stock)}
      className={`rounded-xl border px-3 py-1.5 text-sm transition ${isFav ? "border-amber-200/40 bg-amber-300/20 text-amber-200" : "border-white/20 bg-white/5 text-slate-200 hover:bg-white/10"}`}
    >
      {isFav ? "★ Favorited" : "☆ Favorite"}
    </button>
  );
}
