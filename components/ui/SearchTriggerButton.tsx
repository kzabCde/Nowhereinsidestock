"use client";

import { Search } from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { useI18n } from "@/components/i18n/I18nProvider";

type SearchTriggerButtonProps = { placeholder?: string };

export function SearchTriggerButton({ placeholder }: SearchTriggerButtonProps) {
  const open = useSearchStore((s) => s.open);
  const { t } = useI18n();
  return (
    <button type="button" onClick={open} aria-label={t("search.title")} className="group flex h-[52px] w-full items-center gap-3 rounded-2xl border border-white/[0.09] bg-[#0b1221]/85 px-4 text-left shadow-[0_1px_0_rgba(255,255,255,.05)_inset] transition-all duration-200 hover:-translate-y-px hover:border-accent/25 hover:bg-[#0e1729] hover:shadow-card">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-slate-500 transition-colors group-hover:text-accent"><Search size={15} /></span>
      <span className="flex-1 text-sm text-slate-500 transition-colors group-hover:text-slate-300">{placeholder ?? t("search.placeholder")}</span>
      <kbd className="hidden shrink-0 rounded-lg border border-white/[0.08] bg-black/10 px-2 py-1 text-[9px] font-semibold text-slate-600 sm:block">⌘K</kbd>
    </button>
  );
}
