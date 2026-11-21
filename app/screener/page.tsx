"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";
import { EMPTY_FILTERS, screenCandidates, screenerDataNeeded, type ScreenerFilters, type ScreenerSort } from "@/lib/finance/screener";
import { formatCompactNumber, formatMarketCurrency } from "@/lib/format/market";
import { useScreenerStore } from "@/store/screener-store";
import type { ScreenerResponse, ScreenerUniverse } from "@/lib/types/market";

const universes: Array<[ScreenerUniverse, string, string]> = [
  ["top-gainers", "U.S. top gainers", "หุ้นสหรัฐขึ้นสูงสุด"],
  ["top-losers", "U.S. top losers", "หุ้นสหรัฐลงสูงสุด"],
  ["most-active", "U.S. most active", "หุ้นสหรัฐซื้อขายคึกคัก"],
  ["highest-market-cap", "U.S. largest market cap", "หุ้นสหรัฐมูลค่าตลาดสูงสุด"],
  ["thai-stocks", "Curated Thai stocks", "หุ้นไทยชุดคัดเลือก"],
  ["ai-tech", "Curated AI / tech", "หุ้น AI / เทคชุดคัดเลือก"],
  ["magnificent-seven", "Magnificent Seven", "Magnificent Seven"],
  ["strongest-momentum", "Curated momentum", "โมเมนตัมชุดคัดเลือก"],
  ["lowest-volatility", "Curated low volatility", "ความผันผวนต่ำชุดคัดเลือก"],
  ["custom", "My symbols", "รายการสัญลักษณ์ของฉัน"]
];

const sorts: Array<[ScreenerSort, string, string]> = [
  ["provider", "Provider order", "ลำดับจากผู้ให้ข้อมูล"], ["symbol", "Symbol A–Z", "สัญลักษณ์ A–Z"],
  ["change", "Daily change ↓", "การเปลี่ยนแปลงรายวัน ↓"], ["volume", "Volume ↓", "ปริมาณ ↓"],
  ["marketCap", "Market cap ↓", "มูลค่าตลาด ↓"], ["price", "Price ↓", "ราคา ↓"],
  ["momentum", "Signed momentum ↓", "โมเมนตัมแบบมีทิศทาง ↓"], ["volatility", "Volatility ↑", "ความผันผวน ↑"]
];
const fieldClass = "block w-full min-w-0 rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white";
const basic: Array<[keyof ScreenerFilters, string, string]> = [
  ["minPrice", "Min price", "ราคาต่ำสุด"], ["maxPrice", "Max price", "ราคาสูงสุด"],
  ["minChange", "Min change (%)", "เปลี่ยนแปลงต่ำสุด (%)"], ["maxChange", "Max change (%)", "เปลี่ยนแปลงสูงสุด (%)"],
  ["minVolume", "Min volume (shares)", "ปริมาณขั้นต่ำ (หุ้น)"]
];
const advanced: Array<[keyof ScreenerFilters, string, string]> = [
  ["minMarketCap", "Min market cap", "มูลค่าตลาดต่ำสุด"], ["maxMarketCap", "Max market cap", "มูลค่าตลาดสูงสุด"],
  ["minRsi", "Min RSI", "RSI ต่ำสุด"], ["maxRsi", "Max RSI", "RSI สูงสุด"],
  ["maxVolatility", "Max volatility (%)", "ความผันผวนสูงสุด (%)"], ["maxPe", "Max trailing P/E", "P/E ย้อนหลังสูงสุด"],
  ["minYield", "Min dividend yield (%)", "อัตราปันผลขั้นต่ำ (%)"]
];

export default function ScreenerPage() {
  const { universe, custom, filters, sort, update } = useScreenerStore();
  const [draft, setDraft] = useState<ScreenerFilters | null>(null);
  const [customDraft, setCustomDraft] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const [response, setResponse] = useState<{ key: string; data?: ScreenerResponse; error?: string }>();
  const { locale, t } = useI18n();
  const th = locale === "th";
  const dates = th ? "th-TH" : "en-US";
  const fields = draft ?? filters;
  const needs = screenerDataNeeded(filters, sort);
  const key = universe !== "custom" || custom ? new URLSearchParams({
    universe, symbols: universe === "custom" ? custom : "", technical: needs.technical ? "1" : "0", fundamental: needs.fundamental ? "1" : "0"
  }).toString() : "";
  const current = key && response?.key === key ? response : undefined;
  const data = current?.data;
  const candidates = data?.stocks;
  const currencies = [...new Set(candidates?.flatMap(({ currency }) => currency ?? []) ?? [])].sort();
  const result = useMemo(() => screenCandidates(candidates ?? [], filters, sort), [candidates, filters, sort]);
  const compared = selected.filter((symbol) => candidates?.some((stock) => stock.symbol === symbol));

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    void fetch(`/api/screener?${key}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw Error(data.code ?? "provider_unavailable");
        if (!controller.signal.aborted) setResponse({ key, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResponse((previous) => ({
          key, data: previous?.key === key ? previous.data : undefined, error: error instanceof Error ? error.message : "provider_unavailable"
        }));
      });
    return () => controller.abort();
  }, [key, revision]);

  function setField(field: keyof ScreenerFilters, value: string) {
    setDraft((previous) => ({ ...(previous ?? filters), [field]: value }));
  }

  function apply(event: FormEvent) {
    event.preventDefault();
    update({ custom: customDraft?.trim() ?? custom, filters: { ...fields, query: filters.query } });
    setDraft(null);
    setCustomDraft(null);
  }

  function preset(name: string) {
    const next = { ...EMPTY_FILTERS };
    if (name === "advancing") next.minChange = "1";
    if (name === "volume") next.minVolume = "1000000";
    if (name === "oversold") next.maxRsi = "30";
    update({ filters: next });
    setDraft(null);
  }

  function numberFields(configuration: typeof basic) {
    return configuration.map(([field, en, thai]) => <label key={field} className="space-y-1 text-xs text-slate-300">
      {th ? thai : en}<input value={fields[field]} onChange={(event) => setField(field, event.target.value)} type="number" step="any" className={fieldClass} />
    </label>);
  }

  const scope = data?.scope === "market-screener" ? th ? "ชุดคัดกรองหุ้นสหรัฐจาก Yahoo" : "Yahoo predefined U.S. screener"
    : data?.scope === "user-defined" ? th ? "รายการของผู้ใช้" : "User-defined symbols"
      : th ? "ชุดสัญลักษณ์คัดเลือก" : "Curated symbols";

  return <PageShell size="wide" className="space-y-5">
    <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("screener.title")}</h1>
    <form onSubmit={apply} className="space-y-4 rounded-2xl border border-white/[0.08] bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-300">{t("screener.universe")}
          <select value={universe} onChange={(event) => { update({ universe: event.target.value as ScreenerUniverse }); setSelected([]); }} className={fieldClass}>
            {universes.map(([value, en, thai]) => <option key={value} value={value}>{th ? thai : en}</option>)}
          </select>
        </label>
        {universe === "custom" && <label className="space-y-1 text-sm text-slate-300">{th ? "สัญลักษณ์ (สูงสุด 20)" : "Symbols (up to 20)"}
          <input className={fieldClass} value={customDraft ?? custom} onChange={(event) => setCustomDraft(event.target.value)} placeholder="AAPL, PTT.BK" maxLength={520} required />
        </label>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {numberFields(basic)}
        <label className="space-y-1 text-xs text-slate-300">{t("common.currency")}
          <select className={fieldClass} value={fields.currency} onChange={(event) => setField("currency", event.target.value)}>
            <option value="">{th ? "ทุกสกุลเงิน" : "All currencies"}</option>
            {[...new Set([...currencies, "USD", "THB", ...(fields.currency ? [fields.currency] : [])])].sort().map((code) => <option key={code}>{code}</option>)}
          </select>
        </label>
      </div>
      <details className="rounded-xl border border-white/[0.08] p-3">
        <summary className="cursor-pointer text-sm font-medium text-white">{th ? "ตัวกรองขั้นสูง" : "Advanced filters"}</summary>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {numberFields(advanced)}
          <label className="space-y-1 text-xs text-slate-300">{th ? "กลุ่มธุรกิจ" : "Sector"}
            <input className={fieldClass} value={fields.sector} maxLength={60} onChange={(event) => setField("sector", event.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-slate-300">{th ? "อุตสาหกรรม" : "Industry"}
            <input className={fieldClass} value={fields.industry} maxLength={60} onChange={(event) => setField("industry", event.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-slate-300">{t("common.trend")}
            <select className={fieldClass} value={fields.trend} onChange={(event) => setField("trend", event.target.value)}>
              <option value="">{th ? "ทั้งหมด" : "Any"}</option><option value="uptrend">{th ? "ขาขึ้น" : "Uptrend"}</option>
              <option value="downtrend">{th ? "ขาลง" : "Downtrend"}</option><option value="sideway">{th ? "ไซด์เวย์" : "Sideway"}</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-300">MACD
            <select className={fieldClass} value={fields.macdState} onChange={(event) => setField("macdState", event.target.value)}>
              <option value="">{th ? "ทั้งหมด" : "Any"}</option><option value="buy">{th ? "บวก" : "Positive"}</option>
              <option value="sell">{th ? "ลบ" : "Negative"}</option><option value="neutral">{th ? "เป็นกลาง" : "Neutral"}</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-300">MA200 (1D)
            <select className={fieldClass} value={fields.ma200Position} onChange={(event) => setField("ma200Position", event.target.value)}>
              <option value="">{th ? "ทั้งหมด" : "Any"}</option><option value="above">{th ? "เหนือ" : "Above"}</option>
              <option value="below">{th ? "ต่ำกว่า" : "Below"}</option>
            </select>
          </label>
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn-primary">{th ? "ใช้ตัวกรอง" : "Apply filters"}</button>
        <button type="button" className="btn-premium" onClick={() => { update({ filters: EMPTY_FILTERS, sort: "provider" }); setDraft(null); }}>{th ? "รีเซ็ตตัวกรอง" : "Reset filters"}</button>
        <select aria-label={th ? "ชุดตัวกรอง" : "Filter presets"} value="" className={`${fieldClass} max-w-44`} onChange={(event) => preset(event.target.value)}>
          <option value="" disabled>{th ? "ชุดตัวกรอง" : "Filter presets"}</option>
          <option value="advancing">{th ? "ราคาเพิ่มขึ้น" : "Advancing"}</option>
          <option value="volume">{th ? "ปริมาณสูง" : "High volume"}</option>
          <option value="oversold">{th ? "RSI ต่ำ" : "Low RSI"}</option>
        </select>
      </div>
    </form>

    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="space-y-1 text-sm text-slate-300">{th ? "ค้นหาในรายการ" : "Search candidates"}
        <input type="search" maxLength={80} className={fieldClass} value={filters.query} onChange={(event) => update({ filters: { ...filters, query: event.target.value } })} />
      </label>
      <label className="space-y-1 text-sm text-slate-300">{th ? "เรียงตาม" : "Sort"}
        <select className={fieldClass} value={sort} onChange={(event) => update({ sort: event.target.value as ScreenerSort })}>
          {sorts.map(([value, en, thai]) => <option key={value} value={value}>{th ? thai : en}</option>)}
        </select>
      </label>
      {compared.length >= 2 && <Link className="btn-premium" href={`/compare?symbols=${encodeURIComponent(compared.join(","))}`}>{th ? `เปรียบเทียบ ${compared.length} หุ้น` : `Compare ${compared.length} stocks`}</Link>}
    </div>

    {!key && <p className="text-sm text-slate-400">{th ? "กรอกสัญลักษณ์และใช้ตัวกรองเพื่อโหลดรายการ" : "Enter symbols and apply to load your list."}</p>}
    {key && !current && <p role="status" className="text-sm text-slate-400">{th ? "กำลังโหลดข้อมูลคัดกรอง…" : "Loading candidates…"}</p>}
    {current?.error && <ErrorState message={current.error === "symbol_not_found"
      ? th ? "ไม่พบสัญลักษณ์ในรายการ" : "No symbols in this list were found."
      : th ? "ไม่สามารถโหลดชุดข้อมูลได้" : "Could not load the candidate universe."} onRetry={() => setRevision((previous) => previous + 1)} />}
    {data && <>
      <div className="space-y-1 text-sm text-slate-400">
        <p>{scope} · {data.source} · {th ? "ดึงข้อมูล" : "Retrieved"} {new Date(data.fetchedAt).toLocaleString(dates)}</p>
        <p>{th ? `ตรงตัวกรอง ${result.stocks.length} จาก ${data.candidateCount} รายการ` : `${result.stocks.length} of ${data.candidateCount} candidates match`}
          {result.missing > 0 && (th ? ` · ขาดตัวชี้วัด ${result.missing} รายการ` : ` · ${result.missing} missing required metrics`)}
          {data.incompleteCount > 0 && (th ? ` · โหลดข้อมูลไม่ครบ ${data.incompleteCount} รายการ` : ` · ${data.incompleteCount} incomplete provider results`)}</p>
        {(data.stale || current.error) && <p className="text-warning">{th ? "กำลังแสดงข้อมูลล่าสุดที่มี" : "Showing the last available snapshot."}</p>}
        {data.curatedFallback && <p className="text-warning">{th ? "ชุดคัดกรองผู้ให้ข้อมูลไม่พร้อม จึงแสดงชุดคัดเลือก" : "Provider screen unavailable. Showing the curated universe."}</p>}
      </div>
      {result.error ? <p role="alert" className="text-sm text-warning">{result.error === "currency_required"
        ? th ? "เลือกสกุลเงินก่อนกรองหรือเรียงราคาและมูลค่าตลาด" : "Select a currency to filter or sort prices and market caps."
        : th ? "ตรวจสอบช่วงตัวเลขของตัวกรอง" : "Check the numeric filter bounds."}</p>
        : !result.stocks.length ? <p className="text-sm text-slate-400">{t("screener.noResults")}</p> : <div className="divide-y divide-white/[0.08] rounded-2xl border border-white/[0.08] bg-surface">
          {result.stocks.map((stock) => <article key={stock.symbol} className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.4fr_auto]">
            <div className="min-w-0">
              <Link className="font-semibold text-white hover:text-accent" href={`/stocks/${encodeURIComponent(stock.symbol)}`}>{stock.symbol}</Link>
              <p className="break-words text-xs text-slate-400">{stock.name}{stock.sector ? ` · ${stock.sector}` : ""}</p>
              {stock.marketTime && <p className="mt-1 text-xs text-slate-400">{t("common.marketTime")} {new Date(stock.marketTime).toLocaleString(dates)}</p>}
            </div>
            <div className="min-w-0 space-y-1 text-sm text-slate-300">
              <p>{formatMarketCurrency(stock.latestPrice, stock.currency ?? "")} · {stock.changePercent == null ? "—" : `${stock.changePercent.toFixed(2)}%`} · {th ? "ปริมาณ" : "Vol."} {formatCompactNumber(stock.volume, dates)}</p>
              {needs.technical && <p className="text-xs text-slate-400">RSI {stock.rsi?.toFixed(1) ?? "—"} · MACD {stock.macdState ?? "—"} · σ {stock.volatility == null ? "—" : `${stock.volatility}%`} · {stock.technicalDate ?? "—"}</p>}
              {needs.fundamental && <p className="text-xs text-slate-400">P/E {stock.pe?.toFixed(2) ?? "—"} · {th ? "อัตราปันผล" : "Yield"} {stock.dividendYield == null ? "—" : `${stock.dividendYield.toFixed(2)}%`}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <FavoriteButton compact stock={{ symbol: stock.symbol, name: stock.name, price: stock.latestPrice ?? undefined, changePercent: stock.changePercent ?? undefined }} />
              <label className="flex items-center gap-2 py-2 text-xs text-slate-300"><input type="checkbox" checked={compared.includes(stock.symbol)} disabled={compared.length >= 4 && !compared.includes(stock.symbol)}
                onChange={(event) => setSelected((previous) => event.target.checked ? [...compared, stock.symbol] : previous.filter((symbol) => symbol !== stock.symbol))} aria-label={`${t("nav.compare")} ${stock.symbol}`} />{t("nav.compare")}</label>
            </div>
          </article>)}
        </div>}
    </>}
  </PageShell>;
}
