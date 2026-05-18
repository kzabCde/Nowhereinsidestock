import type { PriceZone } from "@/lib/types/market";

type SupportResistancePanelProps = {
  supports: PriceZone[];
  resistances: PriceZone[];
  message?: string;
};

const toneClass: Record<PriceZone["strength"], string> = {
  weak: "bg-slate-500/20 text-slate-200 border-slate-400/30",
  medium: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  strong: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
};

function ZoneList({ title, zones }: { title: string; zones: PriceZone[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {zones.length === 0 ? (
        <p className="text-sm text-slate-300">ยังไม่พบโซนที่ควรจับตา</p>
      ) : (
        <ul className="space-y-2">
          {zones.map((zone) => (
            <li key={`${zone.type}-${zone.level.toFixed(4)}`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">{zone.level.toFixed(2)}</p>
                <span className={`rounded-full border px-2 py-0.5 text-xs uppercase ${toneClass[zone.strength]}`}>{zone.strength}</span>
              </div>
              <p className="mt-1 text-slate-300">ช่วงโซน {zone.lower.toFixed(2)} - {zone.upper.toFixed(2)}</p>
              <p className="text-slate-400">แตะโซนนี้ {zone.touches} ครั้ง</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SupportResistancePanel({ supports, resistances, message }: SupportResistancePanelProps) {
  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ZoneList title="แนวรับสำคัญ" zones={supports} />
        <ZoneList title="แนวต้านสำคัญ" zones={resistances} />
      </div>
      {message ? <p className="mt-3 text-sm text-amber-200">{message}</p> : null}
      <p className="mt-3 text-xs text-slate-300">แนวรับและแนวต้านเป็นการประเมินจากข้อมูลราคาย้อนหลัง ไม่ใช่จุดซื้อขายที่การันตีผลลัพธ์</p>
    </section>
  );
}
