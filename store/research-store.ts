import { create } from "zustand";
import { persist } from "zustand/middleware";

type RecentStock = { symbol: string; name?: string };
type ResearchState = { recent: RecentStock[]; visit: (stock: RecentStock) => void };

export const useResearchStore = create<ResearchState>()(
  persist(
    (set) => ({
      recent: [],
      visit: (stock) => set(({ recent }) => ({
        recent: [stock, ...recent.filter(({ symbol }) => symbol !== stock.symbol)].slice(0, 6)
      }))
    }),
    { name: "nis-research-v1", partialize: ({ recent }) => ({ recent }) }
  )
);
