import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AlertType = "price_above" | "price_below" | "rsi_above" | "rsi_below" | "golden_cross" | "death_cross";

export type StockAlert = {
  id: string;
  symbol: string;
  type: AlertType;
  threshold?: number;
  enabled: boolean;
  createdAt: string;
};

type AlertState = {
  alerts: StockAlert[];
  addAlert: (alert: Omit<StockAlert, "id" | "createdAt" | "enabled">) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  clearAlerts: () => void;
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set) => ({
      alerts: [],
      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            ...state.alerts,
            {
              ...alert,
              id: createId(),
              symbol: alert.symbol.trim().toUpperCase(),
              enabled: true,
              createdAt: new Date().toISOString()
            }
          ]
        })),
      removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((item) => item.id !== id) })),
      toggleAlert: (id) => set((state) => ({ alerts: state.alerts.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)) })),
      clearAlerts: () => set({ alerts: [] })
    }),
    { name: "nis-alerts-v1" }
  )
);
