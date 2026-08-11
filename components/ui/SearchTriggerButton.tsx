"use client";

import { Search } from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { useI18n } from "@/components/i18n/I18nProvider";

type SearchTriggerButtonProps = { placeholder?: string };

export function SearchTriggerButton({ placeholder }: SearchTriggerButtonProps) {
  const open = useSearchStore((s) => s.open);
  const { t } = useI18n();
  return (
    <button type="button" onClick={open} aria-label={t("search.title")} className="flex h-12 w-full items-center gap-3 rounded-xl border border-white/[0.1] bg-surface px-4 text-left transition-all hover:border-white/[0.18] hover:bg-elevated">
      <Search size={16} className="shrink-0 text-slate-600" />
      <span className="flex-1 text-sm text-slate-600">{placeholder ?? t("search.placeholder")}</span>
      <kbd className="hidden shrink-0 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-700 sm:block">⌘K</kbd>
    </button>
  );
}
