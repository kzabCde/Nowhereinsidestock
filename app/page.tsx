import Link from "next/link";
import { ResearchOverview } from "@/components/dashboard/ResearchOverview";
import { PageShell } from "@/components/ui/PageShell";
import { SearchTriggerButton } from "@/components/ui/SearchTriggerButton";
import { getServerI18n } from "@/lib/i18n/server";

export default async function HomePage() {
  const { locale, t } = await getServerI18n();
  const th = locale === "th";
  const tools = [
    { href: "/screener", label: t("nav.screener") },
    { href: "/compare", label: t("nav.compare") },
    { href: "/tools/fair-value", label: t("fairValue.title") },
    { href: "/tools/risk-planner", label: "Risk / Position Size Planner" }
  ];
  const rankings = [
    { href: "/rankings/top-gainers", label: t("rankings.gainers") },
    { href: "/rankings/most-active", label: t("rankings.active") },
    { href: "/rankings/strongest-momentum", label: th ? "โมเมนตัมชุดคัดเลือก" : "Curated momentum" }
  ];

  return <PageShell size="wide" className="space-y-5 sm:space-y-7">
    <section className="grid items-end gap-4 py-2 md:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">{t("home.title")}</h1>
        <p className="mt-2 text-sm text-slate-400">{t("home.description")}</p>
      </div>
      <SearchTriggerButton placeholder={t("home.searchPlaceholder")} />
    </section>
    <ResearchOverview />
    <div className="grid gap-3 lg:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-white/[0.08] bg-surface p-4 sm:p-5">
        <h2 className="text-base font-semibold text-white">{th ? "เครื่องมือวิจัย" : "Research tools"}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">{tools.map(({ href, label }) => <li key={href}><Link className="btn-premium" href={href}>{label}</Link></li>)}</ul>
      </section>
      <section className="min-w-0 rounded-2xl border border-white/[0.08] bg-surface p-4 sm:p-5">
        <h2><Link className="text-base font-semibold text-white hover:text-accent" href="/rankings">{t("nav.rankings")}</Link></h2>
        <ul className="mt-3 flex flex-wrap gap-2">{rankings.map(({ href, label }) => <li key={href}><Link className="btn-premium" href={href}>{label}</Link></li>)}</ul>
      </section>
    </div>
  </PageShell>;
}
