import { WatchlistGrid } from "@/components/stocks/WatchlistGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { getServerI18n } from "@/lib/i18n/server";

export default async function WatchlistPage() {
  const { locale, t } = await getServerI18n();
  return (
    <PageShell size="wide" className="space-y-6">
      <PageHeader
        eyebrow={t("watchlist.eyebrow")}
        title={t("watchlist.title")}
        description={t("watchlist.description")}
        meta={<span className="badge-neutral">{locale === "th" ? "ติดตามบนอุปกรณ์" : "Local monitoring"}</span>}
      />
      <WatchlistGrid />
    </PageShell>
  );
}
