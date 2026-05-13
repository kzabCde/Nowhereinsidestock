import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WatchlistItem = {
  symbol: string;
  name?: string;
  exchange?: string;
  price?: number;
  changePercent?: number;
  addedAt: string;
};

type WatchlistState = {
  watchlist: WatchlistItem[];
  addStock: (stock: Omit<WatchlistItem, "addedAt">) => void;
  removeStock: (symbol: string) => void;
  toggleStock: (stock: Omit<WatchlistItem, "addedAt">) => void;
  isFavorite: (symbol: string) => boolean;
  clearWatchlist: () => void;
};

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      addStock: (stock) =>
        set((state) => {
          const symbol = stock.symbol.toUpperCase();
          if (state.watchlist.some((item) => item.symbol === symbol)) return state;
          return { watchlist: [...state.watchlist, { ...stock, symbol, addedAt: new Date().toISOString() }] };
        }),
      removeStock: (symbol) => set((state) => ({ watchlist: state.watchlist.filter((item) => item.symbol !== symbol.toUpperCase()) })),
      toggleStock: (stock) => {
        const symbol = stock.symbol.toUpperCase();
        if (get().isFavorite(symbol)) get().removeStock(symbol);
        else get().addStock({ ...stock, symbol });
      },
      isFavorite: (symbol) => get().watchlist.some((item) => item.symbol === symbol.toUpperCase()),
      clearWatchlist: () => set({ watchlist: [] })
    }),
    { name: "nis-watchlist-v1" }
  )
);
