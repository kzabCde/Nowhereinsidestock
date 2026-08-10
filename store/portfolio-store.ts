import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PortfolioTransaction = {
  id: string;
  symbol: string;
  quantity: number;
  price: number;
  currency: string;
  date: string;
};

type PortfolioState = {
  transactions: PortfolioTransaction[];
  addTransaction: (transaction: Omit<PortfolioTransaction, "id">) => void;
  removeTransaction: (id: string) => void;
  clearPortfolio: () => void;
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            {
              ...transaction,
              id: createId(),
              symbol: transaction.symbol.trim().toUpperCase(),
              currency: transaction.currency.trim().toUpperCase() || "USD"
            }
          ]
        })),
      removeTransaction: (id) => set((state) => ({ transactions: state.transactions.filter((item) => item.id !== id) })),
      clearPortfolio: () => set({ transactions: [] })
    }),
    { name: "nis-portfolio-v1" }
  )
);
