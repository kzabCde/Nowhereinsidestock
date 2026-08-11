"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
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
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[8vh]" onPointerDown={(e) => { if (e.target === backdropRef.current) close(); }}>
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-md" aria-hidden="true" />
      <div className="relative w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-surface shadow-elevated">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <span className="section-kicker">{t("search.title")}</span>
            <button type="button" onClick={close} aria-label={t("common.close")} className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-500 transition hover:bg-white/[0.08] hover:text-white"><X size={13} /></button>
          </div>
          <div className="p-3">
            <RealtimeStockSearch placeholder={t("search.placeholder")} mode="navigate" layout="inline" maxResults={12} onSelect={close} />
          </div>
          <div className="border-t border-white/[0.06] px-4 py-2">
            <p className="text-[11px] text-slate-700">
              <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-slate-600">↑↓</kbd> {locale === "th" ? "เลือก" : "navigate"} ·{" "}
              <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-slate-600">↵</kbd> {locale === "th" ? "เปิด" : "open"} ·{" "}
              <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-slate-600">Esc</kbd> {locale === "th" ? "ปิด" : "close"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
