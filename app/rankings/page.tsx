import Link from "next/link";
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
    <PageShell size="wide" className="space-y-8">
      <div>
        <p className="section-kicker">{locale === "th" ? "ข้อมูลราคา · Yahoo Finance" : "Quote data · Yahoo Finance"}</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{t("rankings.title")}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{t("rankings.description")}</p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rankingCards.map((card) => {
          const copy = locale === "th" ? card.th : card.en;
          return (
            <Link key={card.slug} href={`/rankings/${card.slug}`} className="group flex flex-col rounded-2xl border border-white/[0.08] bg-surface p-5 transition-all hover:border-white/[0.14] hover:bg-elevated">
              <div className="flex items-start justify-between gap-3"><p className="section-kicker">{copy[2]}</p></div>
              <h2 className="mt-2 text-base font-semibold text-white">{copy[0]}</h2>
              <p className="mt-1 flex-1 text-sm leading-6 text-slate-500">{copy[1]}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">{locale === "th" ? "ดู Top 10" : "View Top 10"} →</span>
            </Link>
          );
        })}
      </section>
    </PageShell>
  );
}
