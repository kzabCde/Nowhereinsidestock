import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EMPTY_FILTERS, type ScreenerFilters, type ScreenerSort } from "@/lib/finance/screener";
import type { ScreenerUniverse } from "@/lib/types/market";

type Settings = { universe: ScreenerUniverse; custom: string; filters: ScreenerFilters; sort: ScreenerSort };
type ScreenerState = Settings & { update: (values: Partial<Settings>) => void };

export const useScreenerStore = create<ScreenerState>()(
  persist(
    (set) => ({ universe: "top-gainers", custom: "", filters: EMPTY_FILTERS, sort: "provider", update: (values) => set(values) }),
    {
      name: "nis-screener-v1",
      partialize: ({ universe, custom, filters, sort }) => ({ universe, custom, filters, sort }),
      merge: (persisted, live) => {
        const state = persisted as Partial<Settings> | undefined;
        return { ...live, ...state, filters: { ...EMPTY_FILTERS, ...state?.filters } };
      }
    }
  )
);
