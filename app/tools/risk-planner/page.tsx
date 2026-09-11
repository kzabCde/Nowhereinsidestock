import type { Metadata } from "next";
import { RiskPlanner } from "@/components/stocks/RiskPlanner";
import { PageShell } from "@/components/ui/PageShell";
import { getServerI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Risk / Position Size Planner — NowhereInsideStock",
  description: "Educational cash-only position sizing based on account risk, entry, stop, and optional target prices."
};

export default async function RiskPlannerPage() {
  const { locale } = await getServerI18n();

  return (
    <PageShell size="wide" className="space-y-6">
      <div>
        <p className="section-kicker">{locale === "th" ? "เครื่องมือบริหารความเสี่ยง" : "Risk management tool"}</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Risk / Position Size Planner</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          {locale === "th"
            ? "คำนวณขนาดสถานะจากเงินที่ยอมเสี่ยงและระยะห่างระหว่างราคาเข้าและ Stop พร้อมดู Reward/Risk ก่อนตัดสินใจ เครื่องมือนี้ใช้สมมติฐานเงินสดเท่านั้นและไม่รวม Margin หรือ Leverage"
            : "Size a position from your risk budget and Entry–Stop distance, then inspect reward-to-risk before making a decision. The planner assumes cash-only sizing and does not model margin or leverage."}
        </p>
      </div>

      <RiskPlanner />
    </PageShell>
  );
}
