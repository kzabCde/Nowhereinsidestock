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
      className={`rounded-full px-3 py-1 text-sm transition ${isFav ? "bg-amber-400/20 text-amber-300" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
    >
      {isFav ? "★ Favorited" : "☆ Favorite"}
    </button>
  );
}
