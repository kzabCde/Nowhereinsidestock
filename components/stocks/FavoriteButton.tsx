"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { useWatchlistStore, type WatchlistItem } from "@/store/watchlist-store";

type Props = { stock: Omit<WatchlistItem, "addedAt">; compact?: boolean };

export function FavoriteButton({ stock, compact = false }: Props) {
  const isFav = useWatchlistStore((s) => s.isFavorite(stock.symbol));
  const toggle = useWatchlistStore((s) => s.toggleStock);
  const { locale } = useI18n();
  const aria = isFav
    ? (locale === "th" ? `นำ ${stock.symbol} ออกจากรายการติดตาม` : `Remove ${stock.symbol} from watchlist`)
    : (locale === "th" ? `เพิ่ม ${stock.symbol} ลงรายการติดตาม` : `Add ${stock.symbol} to watchlist`);

  if (compact) {
    return <button aria-label={aria} onClick={() => toggle(stock)} className={`flex h-[34px] w-[34px] items-center justify-center rounded-xl border text-sm transition-all ${isFav ? "border-warning/30 bg-warning/10 text-warning" : "border-white/[0.1] bg-white/[0.04] text-slate-500 hover:border-white/[0.18] hover:text-slate-300"}`}>{isFav ? "★" : "☆"}</button>;
  }

  return (
    <button aria-label={aria} onClick={() => toggle(stock)} className={`btn-premium ${isFav ? "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15" : ""}`}>
      {isFav ? (locale === "th" ? "★ บันทึกแล้ว" : "★ Saved") : (locale === "th" ? "☆ บันทึก" : "☆ Save")}
    </button>
  );
}
