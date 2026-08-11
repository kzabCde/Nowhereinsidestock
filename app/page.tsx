import Link from "next/link";
import { Activity, BarChart2, GitCompare, LayoutDashboard, Radar, Star } from "lucide-react";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import { PageShell } from "@/components/ui/PageShell";
import { SearchTriggerButton } from "@/components/ui/SearchTriggerButton";
import { getServerI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";

const actions: Array<{ href: string; icon: typeof Radar; title: MessageKey; description: MessageKey }> = [
  { href: "/screener", icon: Radar, title: "home.screenerTitle", description: "home.screenerDesc" },
  { href: "/rankings", icon: BarChart2, title: "home.rankingsTitle", description: "home.rankingsDesc" },
  { href: "/portfolio", icon: LayoutDashboard, title: "home.portfolioTitle", description: "home.portfolioDesc" },
  { href: "/watchlist", icon: Star, title: "watchlist.title", description: "watchlist.description" },
  { href: "/compare", icon: GitCompare, title: "home.compareTitle", description: "home.compareDesc" },
  { href: "/alerts", icon: Activity, title: "home.alertsTitle", description: "home.alertsDesc" }
];

export default async function HomePage() {
  const { locale, t } = await getServerI18n();
  const openLabel = locale === "th" ? "เปิด" : "Open";
  const rankingPreview = [
    { href: "/rankings/top-gainers", title: t("rankings.gainers"), label: locale === "th" ? "Yahoo market screener" : "Yahoo market screener" },
    { href: "/rankings/most-active", title: t("rankings.active"), label: locale === "th" ? "Yahoo market screener" : "Yahoo market screener" },
    { href: "/rankings/strongest-momentum", title: locale === "th" ? "โมเมนตัมแข็งแรงที่สุด" : "Strongest Momentum", label: locale === "th" ? "การวิเคราะห์ชุดหุ้นคัดเลือกแบบปรับฐาน" : "Normalized curated analytics" }
  ];

  return (
    <PageShell size="wide" className="space-y-12 sm:space-y-16">
      <section className="pt-4 text-center sm:pt-8">
        <p className="section-kicker">{t("home.eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{t("home.title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">{t("home.description")}</p>
        <div className="mx-auto mt-8 max-w-2xl">
          <SearchTriggerButton placeholder={t("home.searchPlaceholder")} />
          <p className="mt-2.5 text-xs text-slate-700">
            {locale === "th" ? "กด" : "Press"} <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-slate-600">⌘K</kbd> {locale === "th" ? "เพื่อค้นหาได้จากทุกหน้า" : "to search from anywhere"}
          </p>
        </div>
      </section>

      <section>
        <p className="section-kicker mb-4">{t("home.explore")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="group flex flex-col rounded-2xl border border-white/[0.08] bg-surface p-5 transition-all hover:border-white/[0.14] hover:bg-elevated">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-elevated"><Icon size={17} className="text-slate-400" /></div>
              <h2 className="text-base font-semibold text-white">{t(title)}</h2>
              <p className="mt-1 flex-1 text-sm leading-6 text-slate-500">{t(description)}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">{openLabel} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section><MagnificentSeven /></section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div><p className="section-kicker">{t("nav.rankings")}</p><h2 className="mt-1.5 text-xl font-semibold text-white">{locale === "th" ? "ขอบเขตข้อมูลตลาดที่โปร่งใส" : "Transparent market scope"}</h2></div>
          <Link href="/rankings" className="btn-premium text-xs">{locale === "th" ? "ดูทั้งหมด" : "View all"}</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {rankingPreview.map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-2xl border border-white/[0.08] bg-surface p-4 transition-all hover:border-white/[0.14] hover:bg-elevated">
              <p className="section-kicker">{item.label}</p>
              <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">{locale === "th" ? "เปิดอันดับ" : "Open ranking"} →</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
