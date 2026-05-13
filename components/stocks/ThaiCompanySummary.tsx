type Props = {
  symbol: string;
  name?: string;
  companyDescription?: string;
  sector?: string;
  industry?: string;
  trend: "bullish" | "bearish" | "neutral";
  indicators: {
    momentum: "strong" | "moderate" | "weak";
    rsiSignal: "overbought" | "oversold" | "neutral";
    macdSignal: "buy" | "sell" | "neutral";
  };
};

export function ThaiCompanySummary({ symbol, name, companyDescription, sector, industry, trend, indicators }: Props) {
  const displayName = name ?? symbol;

  return (
    <section className="printstream-shell pearl-border rounded-3xl p-4 sm:p-6">
      <h2 className="text-xl font-semibold">สรุปบริษัท (ภาษาไทย)</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-100 sm:text-base">
        {displayName} ({symbol}) เป็นบริษัท
        {sector ? `ในกลุ่ม ${sector} ` : ""}
        {industry ? `อุตสาหกรรม ${industry} ` : ""}
        โดยข้อมูลจาก Yahoo Finance ระบุรายละเอียดธุรกิจไว้ในคำอธิบายด้านล่าง ส่วนสรุปนี้จัดทำเพื่อให้อ่านภาพรวมได้ง่ายขึ้นเท่านั้น
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-200 sm:text-base">
        <li>แนวโน้มราคา (Trend): {trend}</li>
        <li>โมเมนตัม (Momentum): {indicators.momentum}</li>
        <li>สัญญาณ RSI: {indicators.rsiSignal}</li>
        <li>สัญญาณ MACD: {indicators.macdSignal}</li>
      </ul>

      <details className="mt-4 rounded-xl border border-white/15 bg-black/20 p-3">
        <summary className="cursor-pointer text-sm font-medium">Original Yahoo Description</summary>
        <p className="mt-2 text-sm text-slate-200">
          {companyDescription ?? "No company description available from Yahoo Finance."}
        </p>
      </details>
    </section>
  );
}
