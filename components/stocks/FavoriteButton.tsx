"use client";

import { useWatchlistStore, type WatchlistItem } from "@/store/watchlist-store";

type Props = {
  stock: Omit<WatchlistItem, "addedAt">;
  compact?: boolean;
};

export function FavoriteButton({ stock, compact = false }: Props) {
  const isFav = useWatchlistStore((s) => s.isFavorite(stock.symbol));
  const toggle = useWatchlistStore((s) => s.toggleStock);

  if (compact) {
    return (
      <button
        aria-label={isFav ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`}
        onClick={() => toggle(stock)}
        className={`flex h-[34px] w-[34px] items-center justify-center rounded-xl border text-sm transition-all ${
          isFav
            ? "border-warning/30 bg-warning/10 text-warning"
            : "border-white/[0.1] bg-white/[0.04] text-slate-500 hover:border-white/[0.18] hover:text-slate-300"
        }`}
      >
        {isFav ? "★" : "☆"}
      </button>
    );
  }

  return (
    <button
      aria-label={isFav ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`}
      onClick={() => toggle(stock)}
      className={`btn-premium ${
        isFav
          ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15"
          : ""
      }`}
    >
      {isFav ? "★ Saved" : "☆ Save"}
    </button>
  );
}
