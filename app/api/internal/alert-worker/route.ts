import { createWorkerHandler } from "@/lib/alerts/worker-handler";
import { alertRepository, inboxDelivery, openAlertDatabase } from "@/lib/alerts/postgres";
import { alertReading } from "@/lib/alerts/reading";
import { runAlertWorker } from "@/lib/alerts/worker";
import { fetchQuoteSnapshot, fetchQuoteWithIndicators } from "@/lib/services/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

let pool: ReturnType<typeof openAlertDatabase> | undefined;

export const GET = createWorkerHandler(
  () => ({ enabled: process.env.ALERT_BACKGROUND_ENABLED === "true" && Boolean(process.env.ALERT_DATABASE_URL), secret: process.env.CRON_SECRET }),
  async () => {
    pool ??= openAlertDatabase(process.env.ALERT_DATABASE_URL!);
    const deliver = process.env.ALERT_DELIVERY === "inbox" ? inboxDelivery(pool) : undefined;
    return runAlertWorker(alertRepository(pool), async (symbol, prices) =>
      alertReading(await (prices ? fetchQuoteSnapshot(symbol) : fetchQuoteWithIndicators(symbol, "6M", false))), deliver);
  }
);
