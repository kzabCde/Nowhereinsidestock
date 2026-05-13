import { create } from "zustand";
import type { QuoteResponse } from "@/lib/types/market";

type MarketState = {
  symbol: string;
  loading: boolean;
  data: QuoteResponse | null;
  error: string | null;
  setSymbol: (symbol: string) => void;
  fetchData: (symbol: string) => Promise<void>;
};

export const useMarketStore = create<MarketState>((set) => ({
  symbol: "AAPL",
  loading: false,
  data: null,
  error: null,
  setSymbol: (symbol) => set({ symbol }),
  fetchData: async (symbol: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/quote/${symbol}`);
      const payload = (await response.json()) as QuoteResponse | { message: string };
      if (!response.ok || "message" in payload) {
        throw new Error("message" in payload ? payload.message : "Failed to load data");
      }
      set({ data: payload, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unexpected error", loading: false });
    }
  }
}));
