"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatCompactNumber, formatMarketCurrency } from "@/lib/format/market";
import type { RankingResponse, RankingStock, RankingType } from "@/lib/types/market";

const UNIVERSES: Array<{ value: RankingType; en: string; th: string }> = [
  { value: "top-gainers", en: "US Top Gainers", th: "หุ้นสหรัฐขึ้นสูงสุด" },
  { value: "top-losers", en: "US Top Losers", th: "หุ้นสหรัฐลงสูงสุด" },
  { value: "most-active", en: "US Most Active", th: "หุ้นสหรัฐซื้อขายคึกคัก" },
  { value: "highest-market-cap", en: "US Largest Market Cap", th: "หุ้นสหรัฐมูลค่าตลาดสูงสุด" },
  { value: "thai-stocks", en: "Thai Curated Leaders", th: "หุ้นไทยชุดคัดเลือก" },
  { value: "ai-tech", en: "AI / Tech Curated", th: "AI / Tech ชุดคัดเลือก" },
  { value: "strongest-momentum", en: "Curated Momentum", th: "โมเมนตัมชุดคัดเลือก" },
  { value: "lowest-volatility", en: "Curated Low Volatility", th: "ความผันผวนต่ำชุดคัดเลือก" }
];

type Filters = { minPrice: string; maxPrice: string; minChange: string; minVolume: string; trend: "all" | RankingStock["trend"] };
const EMPTY_FILTERS: Filters = { minPrice: "", maxPrice: "", minChange: "", minVolume: "", trend: "all" };

function toOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ScreenerPage() {
  const [universe, setUniverse] = useState<RankingType>("top-gainers");
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const { locale, t } = useI18n();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetch(`/api/rankings/${universe}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(locale === "th" ? "ไม่สามารถโหลดชุดข้อมูลคัดกรองได้" : "Unable to load screener universe");
        return (await response.json()) as RankingResponse;
      })
      .then(setData)
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [locale, universe]);

  const stocks = useMemo(() => {
    const minPrice = toOptionalNumber(filters.minPrice);
    const maxPrice = toOptionalNumber(filters.maxPrice);
    const minChange = toOptionalNumber(filters.minChange);
    const minVolume = toOptionalNumber(filters.minVolume);
    return (data?.stocks ?? []).filter((stock) => {
      if (minPrice != null && (stock.latestPrice == null || stock.latestPrice < minPrice)) return false;
      if (maxPrice != null && (stock.latestPrice == null || stock.latestPrice > maxPrice)) return false;
      if (minChange != null && (stock.changePercent == null || stock.changePercent < minChange)) return false;
      if (minVolume != null && (stock.volume == null || stock.volume < minVolume)) return false;
      if (filters.trend !== "all" && stock.trend !== filters.trend) return false;
      return true;
    });
  }, [data, filters]);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setFilters(draft);
  };

  const scopeLabel = data
    ? data.scope === "market-screener"
      ? (locale === "th" ? "Yahoo market screener · ขอบเขตตลาดตามผู้ให้บริการ" : "Yahoo market screener · provider market scope")
      : (locale === "th" ? "ชุดหุ้นคัดเลือก · ไม่ใช่ทั้งตลาด" : "Curated universe · not full-market coverage")
    : "";

  return (
    <PageShell size="wide" className="space-y-6">
      <PageHeader eyebrow={t("screener.eyebrow")} title={t("screener.title")} description={t("screener.description")} />

      <section className="control-panel space-y-4">
        <div className="flex flex-col gap-1.5 border-b border-white/[0.055] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="section-kicker">{locale === "th" ? "ขอบเขตการค้นหา" : "Screening scope"}</p><h2 className="mt-1.5 text-base font-semibold text-white">{locale === "th" ? "เลือก universe และเกณฑ์ที่ต้องการ" : "Choose a universe and refine the criteria"}</h2></div>
          <p className="text-xs text-slate-600">{locale === "th" ? "ตัวกรองทำงานกับชุดข้อมูลที่เลือก ไม่ได้อ้างว่าเป็นทั้งตลาด" : "Filters apply to the selected universe and do not imply full-market coverage."}</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.2fr_3fr]">
          <label className="space-y-1.5 text-xs text-slate-500">
            {t("screener.universe")}
            <select value={universe} onChange={(event) => setUniverse(event.target.value as RankingType)} className="block w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none">
              {UNIVERSES.map((item) => <option key={item.value} value={item.value}>{locale === "th" ? item.th : item.en}</option>)}
            </select>
          </label>

          <form onSubmit={applyFilters} className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
            <input value={draft.minPrice} onChange={(e) => setDraft((current) => ({ ...current, minPrice: e.target.value }))} type="number" step="any" placeholder={t("screener.minPrice")} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
            <input value={draft.maxPrice} onChange={(e) => setDraft((current) => ({ ...current, maxPrice: e.target.value }))} type="number" step="any" placeholder={t("screener.maxPrice")} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
            <input value={draft.minChange} onChange={(e) => setDraft((current) => ({ ...current, minChange: e.target.value }))} type="number" step="any" placeholder={t("screener.minChange")} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
            <input value={draft.minVolume} onChange={(e) => setDraft((current) => ({ ...current, minVolume: e.target.value }))} type="number" step="1" placeholder={t("screener.minVolume")} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
            <select value={draft.trend} onChange={(e) => setDraft((current) => ({ ...current, trend: e.target.value as Filters["trend"] }))} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none">
              <option value="all">{locale === "th" ? "ทุกแนวโน้ม" : "All trends"}</option>
              <option value="uptrend">{locale === "th" ? "ขาขึ้น" : "Uptrend"}</option>
              <option value="sideway">{locale === "th" ? "ไซด์เวย์" : "Sideway"}</option>
              <option value="downtrend">{locale === "th" ? "ขาลง" : "Downtrend"}</option>
            </select>
            <button type="submit" className="btn-primary justify-center">{locale === "th" ? "ใช้ตัวกรอง" : "Apply filters"}</button>
          </form>
        </div>
      </section>

      {data ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className={data.scope === "market-screener" ? "badge-positive" : "badge border-warning/25 bg-warning/10 text-warning"}>{scopeLabel}</span>
          <span>{locale === "th" ? `${stocks.length} จาก ${data.stocks.length} รายการตรงกับตัวกรอง` : `${stocks.length} of ${data.stocks.length} candidates match`}</span>
        </div>
      ) : null}

      {loading ? <div className="data-panel p-10 text-center text-sm text-slate-500">{locale === "th" ? "กำลังโหลดข้อมูลคัดกรอง…" : "Loading screener…"}</div> : null}
      {error ? <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">{error}</div> : null}

      {!loading && !error ? (
        stocks.length === 0 ? (
          <div className="data-panel p-10 text-center text-sm text-slate-500">{t("screener.noResults")}</div>
        ) : (
          <div className="table-shell">
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-white/[0.055] bg-white/[0.018] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:grid">
              <span>{locale === "th" ? "หลักทรัพย์" : "Security"}</span><span>{t("common.price")}</span><span>{t("common.change")}</span><span>{locale === "th" ? "ปริมาณ" : "Volume"}</span><span>{locale === "th" ? "การทำงาน" : "Actions"}</span>
            </div>
            <div className="divide-y divide-white/[0.055]">
              {stocks.map((stock) => {
                const positive = (stock.changePercent ?? 0) >= 0;
                return (
                  <div key={stock.symbol} className="table-row grid gap-3 px-4 py-4 sm:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] sm:items-center">
                    <div className="min-w-0"><Link href={`/stocks/${stock.symbol}`} className="font-semibold text-white transition-colors hover:text-accent">{stock.symbol}</Link><p className="mt-1 truncate text-xs text-slate-600">{stock.name}</p></div>
                    <div><p className="section-kicker sm:hidden">{t("common.price")}</p><p className="mt-1 text-sm font-medium tabular-nums text-slate-300 sm:mt-0">{formatMarketCurrency(stock.latestPrice, stock.currency ?? "USD")}</p></div>
                    <div><p className="section-kicker sm:hidden">{t("common.change")}</p><p className={`mt-1 text-sm font-semibold tabular-nums sm:mt-0 ${positive ? "text-success" : "text-danger"}`}>{stock.changePercent == null ? "—" : `${positive ? "+" : ""}${stock.changePercent.toFixed(2)}%`}</p></div>
                    <div><p className="section-kicker sm:hidden">{locale === "th" ? "ปริมาณซื้อขาย" : "Volume"}</p><p className="mt-1 text-sm tabular-nums text-slate-400 sm:mt-0">{formatCompactNumber(stock.volume)}</p></div>
                    <div className="flex gap-2"><FavoriteButton compact stock={{ symbol: stock.symbol, name: stock.name, price: stock.latestPrice ?? undefined, changePercent: stock.changePercent ?? undefined }} /><Link href={`/compare?symbols=${stock.symbol}`} className="btn-premium text-xs">{t("nav.compare")}</Link></div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : null}
    </PageShell>
  );
}
