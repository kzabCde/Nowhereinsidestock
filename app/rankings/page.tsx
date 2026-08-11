import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { getServerI18n } from "@/lib/i18n/server";

const rankingCards = [
  { slug: "top-gainers", en: ["Top Gainers", "Largest percentage gainers from the Yahoo market screener.", "Momentum"], th: ["หุ้นขึ้นสูงสุด", "หุ้นที่ปรับขึ้นเป็นเปอร์เซ็นต์สูงสุดจาก Yahoo market screener", "โมเมนตัม"] },
  { slug: "top-losers", en: ["Top Losers", "Largest percentage decliners from the Yahoo market screener.", "Pressure"], th: ["หุ้นลงสูงสุด", "หุ้นที่ปรับลงเป็นเปอร์เซ็นต์มากที่สุดจาก Yahoo market screener", "แรงขาย"] },
  { slug: "most-active", en: ["Most Active", "Stocks with the highest trading activity from the provider screener.", "Volume"], th: ["ซื้อขายคึกคักที่สุด", "หุ้นที่มีการซื้อขายคึกคักสูงจาก screener ของผู้ให้บริการ", "ปริมาณ"] },
  { slug: "highest-market-cap", en: ["Highest Market Cap", "Largest companies ranked by market capitalization.", "Scale"], th: ["มูลค่าตลาดสูงสุด", "บริษัทขนาดใหญ่เรียงตามมูลค่าหลักทรัพย์ตามราคาตลาด", "ขนาด"] },
  { slug: "highest-volume", en: ["Highest Volume", "Largest raw trading volume in the current ranking universe.", "Liquidity"], th: ["ปริมาณซื้อขายสูงสุด", "หุ้นที่มีปริมาณซื้อขายดิบสูงสุดในชุดข้อมูลปัจจุบัน", "สภาพคล่อง"] },
  { slug: "strongest-momentum", en: ["Strongest Momentum", "Curated analytics ranked by normalized momentum evidence.", "Trend"], th: ["โมเมนตัมแข็งแรงที่สุด", "การวิเคราะห์ชุดหุ้นคัดเลือก เรียงตามหลักฐานโมเมนตัมแบบปรับฐาน", "แนวโน้ม"] },
  { slug: "lowest-volatility", en: ["Lowest Volatility", "Curated names ranked by lower annualized return volatility.", "Stability"], th: ["ความผันผวนต่ำสุด", "หุ้นในชุดคัดเลือกเรียงตามความผันผวนผลตอบแทนแบบ annualized ที่ต่ำกว่า", "เสถียรภาพ"] },
  { slug: "magnificent-seven", en: ["Magnificent Seven", "Performance ranking across the Magnificent Seven names.", "Big Tech"], th: ["Magnificent Seven", "อันดับผลการเคลื่อนไหวของหุ้น Magnificent Seven", "Big Tech"] },
  { slug: "thai-stocks", en: ["Thai Stocks", "Curated Thai large-cap leaders with explicit universe scope.", "SET"], th: ["หุ้นไทย", "ชุดหุ้นไทยขนาดใหญ่ที่คัดเลือกไว้ พร้อมระบุขอบเขตข้อมูลชัดเจน", "SET"] },
  { slug: "ai-tech", en: ["AI / Tech", "Curated AI and technology stocks ranked by current analytics.", "AI"], th: ["AI / Tech", "ชุดหุ้น AI และเทคโนโลยีคัดเลือก เรียงตามข้อมูลวิเคราะห์ปัจจุบัน", "AI"] }
] as const;

export default async function RankingsPage() {
  const { locale, t } = await getServerI18n();
  return (
    <PageShell size="wide" className="space-y-7">
      <PageHeader
        eyebrow={locale === "th" ? "ข้อมูลราคา · Yahoo Finance" : "Quote data · Yahoo Finance"}
        title={t("rankings.title")}
        description={t("rankings.description")}
        meta={<span className="badge-neutral">10 {locale === "th" ? "มุมมอง" : "views"}</span>}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rankingCards.map((card, index) => {
          const copy = locale === "th" ? card.th : card.en;
          return (
            <Link key={card.slug} href={`/rankings/${card.slug}`} className="interactive-card group flex min-h-48 flex-col p-5 sm:p-6">
              <div className="relative z-[1] flex items-start justify-between gap-3">
                <span className="badge-neutral">{copy[2]}</span>
                <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-700">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2 className="relative z-[1] mt-5 text-lg font-semibold tracking-[-0.02em] text-white">{copy[0]}</h2>
              <p className="relative z-[1] mt-2 flex-1 text-sm leading-6 text-slate-500">{copy[1]}</p>
              <span className="relative z-[1] mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors group-hover:text-accent">{locale === "th" ? "ดู Top 10" : "View Top 10"}<span aria-hidden="true">↗</span></span>
            </Link>
          );
        })}
      </section>
    </PageShell>
  );
}
