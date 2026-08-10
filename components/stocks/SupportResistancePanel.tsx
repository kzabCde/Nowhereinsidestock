"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { PriceZone } from "@/lib/types/market";

const toneClass: Record<PriceZone["strength"], string> = {
  weak: "bg-slate-500/20 text-slate-200 border-slate-400/30",
  medium: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  strong: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
};

export function SupportResistancePanel({ supports, resistances }: { supports: PriceZone[]; resistances: PriceZone[] }) {
  const { locale } = useI18n();
  const th = locale === "th";
  const strengthLabel = (strength: PriceZone["strength"]) => {
    if (!th) return strength;
    return strength === "strong" ? "แข็งแรง" : strength === "medium" ? "ปานกลาง" : "อ่อน";
  };
  const ZoneList = ({ title, zones }: { title: string; zones: PriceZone[] }) => (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {zones.length === 0 ? (
        <p className="text-sm text-slate-300">{th ? "ยังไม่พบโซนที่ควรจับตาจากข้อมูลปัจจุบัน" : "No notable zone is detected in the current data."}</p>
      ) : (
        <ul className="space-y-2">
          {zones.map((zone) => (
            <li key={`${zone.type}-${zone.level.toFixed(4)}`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">{zone.level.toFixed(2)}</p>
                <span className={`rounded-full border px-2 py-0.5 text-xs uppercase ${toneClass[zone.strength]}`}>{strengthLabel(zone.strength)}</span>
              </div>
              <p className="mt-1 text-slate-300">{th ? "ช่วงโซน" : "Zone range"} {zone.lower.toFixed(2)} – {zone.upper.toFixed(2)}</p>
              <p className="text-slate-400">{th ? `ราคาแตะโซนนี้ ${zone.touches} ครั้ง` : `${zone.touches} historical touch${zone.touches === 1 ? "" : "es"}`}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ZoneList title={th ? "แนวรับสำคัญ" : "Key support"} zones={supports} />
        <ZoneList title={th ? "แนวต้านสำคัญ" : "Key resistance"} zones={resistances} />
      </div>
      <p className="mt-3 text-xs text-slate-300">{th ? "แนวรับและแนวต้านประเมินจากข้อมูลราคาย้อนหลัง ไม่ใช่จุดซื้อขายที่รับประกันผลลัพธ์" : "Support and resistance zones are estimated from historical prices and are not guaranteed trade levels."}</p>
    </section>
  );
}
