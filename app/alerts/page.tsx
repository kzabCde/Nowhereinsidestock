"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";
import { isPriceAlert, isRsiAlert, type AlertType } from "@/lib/alerts/evaluate";
import { useAlertStore } from "@/store/alert-store";

const input = "w-full min-w-0 rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white";

export default function AlertsPage() {
  const alerts = useAlertStore((state) => state.alerts);
  const events = useAlertStore((state) => state.events);
  const addAlert = useAlertStore((state) => state.addAlert);
  const removeAlert = useAlertStore((state) => state.removeAlert);
  const toggleAlert = useAlertStore((state) => state.toggleAlert);
  const clearAlerts = useAlertStore((state) => state.clearAlerts);
  const requestCheck = useAlertStore((state) => state.requestCheck);
  const [type, setType] = useState<AlertType>("price_above");
  const [error, setError] = useState("");
  const { locale, t } = useI18n();
  const th = locale === "th";
  const alertLabels: Record<AlertType, string> = {
    price_above: t("alerts.priceAbove"),
    price_below: t("alerts.priceBelow"),
    rsi_above: t("alerts.rsiAbove"),
    rsi_below: t("alerts.rsiBelow"),
    golden_cross: t("alerts.goldenCross"),
    death_cross: t("alerts.deathCross")
  };
  const errorLabels = {
    quote_unavailable: th ? "ไม่มีราคาที่ตรวจสอบได้" : "Quote or market timestamp unavailable",
    insufficient_history: th ? "ข้อมูลย้อนหลังไม่เพียงพอ" : "Insufficient daily history",
    stale_data: th ? "ข้อมูลเก่าหรือไม่พร้อมใช้งาน" : "Stale market data",
    invalid_threshold: th ? "ค่าเป้าหมายไม่ถูกต้อง" : "Invalid threshold",
    currency_changed: th ? "สกุลเงินของราคาเปลี่ยน" : "Quote currency changed"
  };
  const date = (value?: string) => value ? new Date(value).toLocaleString(th ? "th-TH" : "en-US") : "—";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const target = fields.get("threshold");
    try {
      addAlert({ symbol: String(fields.get("symbol") ?? ""), type, threshold: typeof target === "string" && target.trim() ? Number(target) : undefined });
      form.reset();
      setError("");
    } catch (error) {
      setError(error instanceof Error && error.message === "alert_limit"
        ? th ? "บันทึกได้สูงสุด 50 การแจ้งเตือน" : "Up to 50 alerts can be saved."
        : th ? "ตรวจสอบสัญลักษณ์และค่าเป้าหมาย ราคาต้องมากกว่า 0 และ RSI ต้องอยู่ระหว่าง 0–100" : "Check the symbol and threshold. Price must be positive and RSI must be 0–100.");
    }
  }

  return <PageShell size="wide" className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("alerts.title")}</h1>
        <p className="mt-2 text-sm text-slate-400">{th
          ? "ติดตามบนอุปกรณ์เมื่อหน้าเว็บแสดงอยู่ การแจ้งเตือนบนหน้านี้ไม่ซิงก์กับตัวติดตามเบื้องหลังและยังไม่ส่งผ่านอีเมลหรือพุช"
          : "These alerts monitor while the workspace is visible. They stay on this device. Background monitoring, email, and push are off for these alerts."}</p>
      </div>
      <button type="button" onClick={requestCheck} disabled={!alerts.some((alert) => alert.enabled)} className="btn-premium">{t("alerts.refresh")}</button>
    </div>

    <form onSubmit={submit} className="grid items-end gap-3 rounded-2xl border border-white/[0.08] bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="space-y-1 text-sm text-slate-300">{t("alerts.symbol")}<input name="symbol" maxLength={21} required className={input} placeholder="AAPL" /></label>
      <label className="space-y-1 text-sm text-slate-300">{t("alerts.condition")}
        <select value={type} onChange={(event) => setType(event.target.value as AlertType)} className={input}>
          {Object.entries(alertLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      {(isPriceAlert(type) || isRsiAlert(type)) && <label className="space-y-1 text-sm text-slate-300">{t("alerts.target")}
        <input key={type} name="threshold" type="number" min="0" max={isRsiAlert(type) ? 100 : undefined} step="any" required className={input} />
      </label>}
      <button type="submit" className="btn-primary justify-center">{t("alerts.add")}</button>
      {error && <p role="alert" className="col-span-full text-sm text-warning">{error}</p>}
    </form>

    <section className="divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-surface px-4">
      {alerts.length === 0 && <p className="py-6 text-sm text-slate-400">{t("alerts.empty")}</p>}
      {alerts.map((alert) => {
        const evaluation = alert.evaluation;
        const value = evaluation?.value;
        const status = !alert.enabled ? th ? "หยุดชั่วคราว" : "Paused"
          : evaluation?.error ? errorLabels[evaluation.error]
            : evaluation?.condition === true ? th ? "เข้าเงื่อนไข" : "Condition true"
              : evaluation?.condition === false ? th ? "รอเข้าเงื่อนไข" : "Waiting"
                : th ? "รอตรวจครั้งแรก" : "Awaiting first check";
        return <article key={alert.id} className="grid items-start gap-3 py-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <div>
            <Link className="font-semibold text-white hover:text-accent" href={`/stocks/${encodeURIComponent(alert.symbol)}`}>{alert.symbol}</Link>
            <p className="mt-1 text-sm text-slate-400">{alertLabels[alert.type]} {alert.threshold != null ? `${alert.threshold} ${evaluation?.currency ?? ""}` : ""}</p>
          </div>
          <div>
            <p className={evaluation?.error ? "text-sm text-warning" : "text-sm text-slate-200"}>{status}</p>
            {typeof value === "number" && <p className="mt-1 text-xs text-slate-400">{isPriceAlert(alert.type) ? formatMarketCurrency(value, evaluation?.currency ?? "") : `RSI ${value.toFixed(2)}`}</p>}
          </div>
          <div className="space-y-1 text-xs text-slate-400">
            <p>{th ? "ตรวจล่าสุด" : "Last checked"} · {date(evaluation?.checkedAt)}</p>
            <p>{th ? "เตือนล่าสุด" : "Last triggered"} · {date(evaluation?.triggeredAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => toggleAlert(alert.id)} type="button" className="btn-premium text-xs">{alert.enabled ? th ? "หยุด" : "Pause" : th ? "เริ่มต่อ" : "Resume"}</button>
            <button onClick={() => removeAlert(alert.id)} type="button" className="btn-premium text-xs">{t("common.remove")}</button>
          </div>
        </article>;
      })}
    </section>

    {events.length > 0 && <section className="rounded-2xl border border-white/[0.08] bg-surface p-4">
      <h2 className="font-semibold text-white">{th ? "ประวัติการแจ้งเตือนในแอป" : "In-app notification history"}</h2>
      <ul className="mt-2 divide-y divide-white/[0.08]">{events.map((event) => <li key={`${event.alertId}:${event.key}`} className="flex flex-wrap gap-2 py-2 text-sm text-slate-300">
        <strong>{event.symbol}</strong><span>{alertLabels[event.type]}</span><time className="text-xs text-slate-400" dateTime={event.triggeredAt}>{date(event.triggeredAt)}</time>
      </li>)}</ul>
    </section>}

    <p className="text-xs text-slate-400">{th
      ? "การตรวจครั้งแรกกำหนดค่าเริ่มต้น เมื่อราคา/RSI ออกจากเงื่อนไขแล้วกลับเข้าใหม่จึงแจ้งเตือน สัญญาณตัดกันแจ้งหนึ่งครั้งต่อวันซื้อขาย"
      : "The first check sets a baseline. An alert fires when a later observation enters the condition, and re-arms after it leaves. Crosses fire once per trading date."}</p>
    {!!alerts.length && <button type="button" onClick={() => {
      if (window.confirm(th ? "ล้างการแจ้งเตือนทั้งหมดหรือไม่?" : "Clear all local alerts and notification history?")) clearAlerts();
    }} className="px-2 py-2 text-xs text-danger">{th ? "ล้างการแจ้งเตือนทั้งหมด" : "Clear all alerts"}</button>}
  </PageShell>;
}
