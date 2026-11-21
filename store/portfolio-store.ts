import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  migratePortfolioState, PORTFOLIO_VERSION, preparePortfolioImport, replayLedger, type TransactionInput
} from "@/lib/finance/portfolio-ledger";

export type { PortfolioTransaction } from "@/lib/finance/portfolio-ledger";

type PortfolioState = {
  transactions: unknown[];
  addTransaction: (transaction: TransactionInput) => void;
  removeTransaction: (index: number) => void;
  importTransactions: (json: string, replace: boolean) => { added: number; duplicates: number };
  clearPortfolio: () => void;
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      transactions: [],
      addTransaction: (transaction) => {
        const next = replayLedger([...get().transactions, { ...transaction, id: crypto.randomUUID() }]);
        if (next.error) throw Error(next.error.code);
        set({ transactions: next.records });
      },
      removeTransaction: (index) => {
        const current = get().transactions;
        const transactions = current.filter((_, row) => row !== index);
        const before = replayLedger(current);
        const after = replayLedger(transactions);
        // A deletion cannot create an invalid sale. Existing corrupt rows can be removed for repair.
        if (!before.error && after.error) throw Error(after.error.code);
        set({ transactions });
      },
      importTransactions: (json, replace) => {
        const result = preparePortfolioImport(json, get().transactions, replace);
        set({ transactions: result.records });
        return { added: result.added, duplicates: result.duplicates };
      },
      clearPortfolio: () => set({ transactions: [] })
    }),
    {
      name: "nis-portfolio-v1",
      version: PORTFOLIO_VERSION,
      migrate: migratePortfolioState,
      partialize: (state) => ({ transactions: state.transactions })
    }
  )
);
