import { WatchlistGrid } from "@/components/stocks/WatchlistGrid";
import { PageShell } from "@/components/ui/PageShell";
import { getServerI18n } from "@/lib/i18n/server";

export default async function WatchlistPage() {
  const { t } = await getServerI18n();
  return (
    <PageShell className="space-y-6">
      <div>
        <p className="section-kicker">{t("watchlist.eyebrow")}</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{t("watchlist.title")}</h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500">{t("watchlist.description")}</p>
      </div>
      <WatchlistGrid />
    </PageShell>
  );
}
