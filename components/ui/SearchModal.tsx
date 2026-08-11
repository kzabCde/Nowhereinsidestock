"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { RealtimeStockSearch } from "@/components/stocks/RealtimeStockSearch";
import { useI18n } from "@/components/i18n/I18nProvider";

export function SearchModal() {
  const { isOpen, close } = useSearchStore();
  const backdropRef = useRef<HTMLDivElement>(null);
  const { locale, t } = useI18n();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        useSearchStore.getState().open();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[9vh]" onPointerDown={(e) => { if (e.target === backdropRef.current) close(); }}>
      <div className="absolute inset-0 bg-[#03050c]/78 backdrop-blur-xl" aria-hidden="true" />
      <div className="relative w-full max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0a1020]/96 shadow-elevated">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/15 bg-accent/[0.07] text-accent"><Search size={15} /></span>
            <div>
              <p className="section-kicker">{locale === "th" ? "ค้นหาทั่วระบบ" : "Global command"}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-200">{t("search.title")}</p>
            </div>
            <button type="button" onClick={close} aria-label={t("common.close")} className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-500 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"><X size={14} /></button>
          </div>
          <div className="p-4 sm:p-5">
            <RealtimeStockSearch placeholder={t("search.placeholder")} mode="navigate" layout="inline" maxResults={12} onSelect={close} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] bg-black/10 px-5 py-3 text-[10px] text-slate-600">
            <span><kbd className="rounded-md border border-white/[0.08] bg-white/[0.025] px-1.5 py-0.5 text-slate-500">↑↓</kbd> {locale === "th" ? "เลือก" : "navigate"}</span>
            <span><kbd className="rounded-md border border-white/[0.08] bg-white/[0.025] px-1.5 py-0.5 text-slate-500">↵</kbd> {locale === "th" ? "เปิด" : "open"}</span>
            <span><kbd className="rounded-md border border-white/[0.08] bg-white/[0.025] px-1.5 py-0.5 text-slate-500">Esc</kbd> {locale === "th" ? "ปิด" : "close"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
