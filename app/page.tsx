import Link from "next/link";
import { Activity, BarChart2, GitCompare, LayoutDashboard, Radar, Star } from "lucide-react";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import { PageShell } from "@/components/ui/PageShell";
import { SearchTriggerButton } from "@/components/ui/SearchTriggerButton";
import { getServerI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";

const actions: Array<{ href: string; icon: typeof Radar; title: MessageKey; description: MessageKey; code: string }> = [
  { href: "/screener", icon: Radar, title: "home.screenerTitle", description: "home.screenerDesc", code: "01" },
  { href: "/rankings", icon: BarChart2, title: "home.rankingsTitle", description: "home.rankingsDesc", code: "02" },
  { href: "/portfolio", icon: LayoutDashboard, title: "home.portfolioTitle", description: "home.portfolioDesc", code: "03" },
  { href: "/watchlist", icon: Star, title: "watchlist.title", description: "watchlist.description", code: "04" },
  { href: "/compare", icon: GitCompare, title: "home.compareTitle", description: "home.compareDesc", code: "05" },
  { href: "/alerts", icon: Activity, title: "home.alertsTitle", description: "home.alertsDesc", code: "06" }
];

export default async function HomePage() {
  const { locale, t } = await getServerI18n();
  const openLabel = locale === "th" ? "เปิดเครื่องมือ" : "Open tool";
  const workflow = locale === "th"
    ? [
        ["คัดกรอง", "เริ่มจาก universe ที่ระบุขอบเขตชัดเจน"],
        ["ตรวจหลักฐาน", "อ่านแนวโน้ม โมเมนตัม RSI และ MACD"],
        ["เปรียบเทียบความเสี่ยง", "ดูผลตอบแทน ความผันผวน drawdown และ correlation"],
        ["ตัดสินใจอย่างมีบริบท", "ใช้ valuation, backtest, watchlist และ portfolio ประกอบกัน"]
      ]
    : [
        ["Screen", "Start from clearly scoped market or curated universes."],
        ["Inspect evidence", "Review trend, momentum, RSI, MACD, and price structure."],
        ["Compare risk", "Read returns, volatility, drawdown, and correlation side by side."],
        ["Build context", "Combine valuation, backtests, watchlists, and portfolio tracking."]
      ];
  const rankingPreview = [
    { href: "/rankings/top-gainers", title: t("rankings.gainers"), label: "Yahoo market screener" },
    { href: "/rankings/most-active", title: t("rankings.active"), label: "Yahoo market screener" },
    { href: "/rankings/strongest-momentum", title: locale === "th" ? "โมเมนตัมแข็งแรงที่สุด" : "Strongest Momentum", label: locale === "th" ? "การวิเคราะห์ชุดหุ้นคัดเลือก" : "Curated normalized analytics" }
  ];

  return (
    <PageShell size="wide" className="space-y-12 sm:space-y-14">
      <section className="hero-grid p-5 sm:p-7 lg:p-9">
        <div className="relative z-[1] grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-stretch">
          <div className="flex flex-col justify-center py-2 lg:py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-neutral"><span className="signal-dot" aria-hidden="true" />{t("home.eyebrow")}</span>
              <span className="badge-neutral">TH / EN</span>
              <span className="badge-neutral"><Activity size={11} />{locale === "th" ? "อธิบายที่มาของสัญญาณ" : "Explainable by design"}</span>
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">{t("home.description")}</p>
            <div className="mt-7 max-w-2xl">
              <SearchTriggerButton placeholder={t("home.searchPlaceholder")} />
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-600">
                <span>{locale === "th" ? "ค้นหาได้จากทุกหน้า" : "Search from anywhere"}</span>
                <span><kbd className="rounded-md border border-white/[0.08] bg-white/[0.025] px-1.5 py-0.5 text-slate-500">⌘K</kbd> {locale === "th" ? "เปิด Command Search" : "opens command search"}</span>
              </div>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-2xl border border-white/[0.075] bg-[#080e1c]/78 p-5 shadow-[0_1px_0_rgba(255,255,255,.05)_inset] sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div><p className="section-kicker">{locale === "th" ? "ขั้นตอนการวิเคราะห์" : "Research workflow"}</p><h2 className="mt-1.5 text-lg font-semibold text-white">{locale === "th" ? "จากข้อมูล → หลักฐาน → บริบท" : "Data → evidence → context"}</h2></div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/15 bg-accent/[0.07] text-accent"><Radar size={17} /></span>
            </div>
            <div className="mt-2 divide-y divide-white/[0.055]">
              {workflow.map(([title, copy], index) => (
                <div key={title} className="group grid grid-cols-[34px_1fr] gap-3 py-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-[10px] font-semibold text-slate-600 transition-colors group-hover:border-accent/20 group-hover:text-accent">0{index + 1}</span>
                  <div><p className="text-sm font-medium text-slate-200">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{copy}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.018] p-3 text-xs leading-5 text-slate-600">
              {locale === "th" ? "ทุกเครื่องมือออกแบบเพื่อช่วยอ่านข้อมูล ไม่ใช่สร้างคำสั่งซื้อหรือขาย" : "Every tool is designed to help interpret evidence — not to issue buy or sell commands."}
            </div>
          </aside>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="section-kicker">{t("home.explore")}</p><h2 className="section-title mt-2">{locale === "th" ? "พื้นที่ทำงานหลัก" : "Core workspace"}</h2></div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">{locale === "th" ? "เข้าถึงเครื่องมือหลักตามลำดับงานจริง ตั้งแต่ค้นหาและคัดกรอง ไปจนถึงติดตามพอร์ต" : "Move through the product in the same order as a real research workflow, from discovery to monitoring."}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map(({ href, icon: Icon, title, description, code }) => (
            <Link key={href} href={href} className="interactive-card group flex min-h-48 flex-col p-5 sm:p-6">
              <div className="relative z-[1] flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.075] bg-white/[0.025] text-slate-400 transition-all group-hover:border-accent/20 group-hover:bg-accent/[0.06] group-hover:text-accent"><Icon size={18} /></span>
                <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-700">{code}</span>
              </div>
              <h3 className="relative z-[1] mt-5 text-lg font-semibold tracking-[-0.02em] text-white">{t(title)}</h3>
              <p className="relative z-[1] mt-2 flex-1 text-sm leading-6 text-slate-500">{t(description)}</p>
              <span className="relative z-[1] mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors group-hover:text-accent">{openLabel}<span aria-hidden="true">↗</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div><p className="section-kicker">{locale === "th" ? "ภาพรวมตลาด" : "Market snapshot"}</p><h2 className="section-title mt-2">Magnificent Seven</h2></div>
        <MagnificentSeven />
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div><p className="section-kicker">{t("nav.rankings")}</p><h2 className="section-title mt-2">{locale === "th" ? "สำรวจตลาดด้วยขอบเขตที่ชัดเจน" : "Explore with transparent market scope"}</h2></div>
          <Link href="/rankings" className="btn-premium text-xs">{locale === "th" ? "ดูทั้งหมด" : "View all"}</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {rankingPreview.map((item) => (
            <Link key={item.href} href={item.href} className="interactive-card group p-5">
              <p className="section-kicker">{item.label}</p>
              <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors group-hover:text-accent">{locale === "th" ? "เปิดอันดับ" : "Open ranking"}<span aria-hidden="true">↗</span></p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
