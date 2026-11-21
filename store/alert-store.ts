import { create } from "zustand";
import { persist } from "zustand/middleware";
import { evaluateAlert, isPriceAlert, validateAlert, type AlertDefinition, type AlertEvaluation, type AlertEvent, type AlertReading } from "@/lib/alerts/evaluate";

export type { AlertType } from "@/lib/alerts/evaluate";
export type StockAlert = AlertDefinition & { evaluation?: AlertEvaluation };
type LocalEvent = AlertEvent & { read: boolean; delivery: "in_app" };

type AlertState = {
  alerts: StockAlert[];
  events: LocalEvent[];
  checkRequest: number;
  addAlert: (alert: Pick<StockAlert, "symbol" | "type" | "threshold">) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  clearAlerts: () => void;
  requestCheck: () => void;
  acknowledge: () => void;
  applyReadings: (readings: Record<string, AlertReading>, prices: boolean) => void;
};

export const useAlertStore = create<AlertState>()(
  persist(
    (set, get) => ({
      alerts: [],
      events: [],
      checkRequest: 0,
      addAlert: (input) => {
        if (get().alerts.length >= 50) throw Error("alert_limit");
        const definition = validateAlert(input);
        set((state) => ({
          alerts: [...state.alerts, { ...definition, enabled: true, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
          checkRequest: state.checkRequest + 1
        }));
      },
      removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((row) => row.id !== id) })),
      toggleAlert: (id) => set((state) => ({
        alerts: state.alerts.map((alert) => {
          if (alert.id !== id) return alert;
          if (alert.enabled) return { ...alert, enabled: false };
          return {
            ...alert, enabled: true, armedAt: new Date().toISOString(),
            evaluation: { triggeredAt: alert.evaluation?.triggeredAt, eventKey: alert.evaluation?.eventKey, currency: alert.evaluation?.currency }
          };
        }),
        checkRequest: state.checkRequest + 1
      })),
      clearAlerts: () => set({ alerts: [], events: [] }),
      requestCheck: () => set((state) => ({ checkRequest: state.checkRequest + 1 })),
      acknowledge: () => set((state) => ({ events: state.events.map((event) => ({ ...event, read: true })) })),
      applyReadings: (readings, prices) => set((state) => {
        const now = new Date().toISOString();
        const events: LocalEvent[] = [];
        const alerts = state.alerts.map((alert) => {
          if (!alert.enabled || prices !== isPriceAlert(alert.type) || !Object.hasOwn(readings, alert.symbol)) return alert;
          const result = evaluateAlert(alert, alert.evaluation ?? {}, readings[alert.symbol], now);
          if (result.event) events.push({ ...result.event, read: false, delivery: "in_app" });
          return { ...alert, evaluation: result.state };
        });
        return { alerts, events: [...events, ...state.events].slice(0, 100) };
      })
    }),
    {
      name: "nis-alerts-v1",
      partialize: (state) => ({ alerts: state.alerts, events: state.events })
    }
  )
);
