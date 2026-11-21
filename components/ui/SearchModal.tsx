"use client";

import { useEffect, useId, useRef } from "react";
import { Search, X } from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { RealtimeStockSearch } from "@/components/stocks/RealtimeStockSearch";
import { useI18n } from "@/components/i18n/I18nProvider";

export function SearchModal() {
  const isOpen = useSearchStore((store) => store.isOpen);
  const close = useSearchStore((store) => store.close);
  const ref = useRef<HTMLDialogElement>(null);
  const title = useId();
  const { t } = useI18n();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        useSearchStore.getState().open();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector("input")?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) previouslyFocused.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return <dialog ref={ref} aria-labelledby={title}
    onCancel={(event) => { event.preventDefault(); close(); }}
    onClick={(event) => { if (event.target === event.currentTarget) close(); }}
    className="mt-[8dvh] max-h-[84dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-accent/20 bg-surface text-white shadow-elevated backdrop:bg-black/75">
    <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-5">
      <Search aria-hidden="true" className="text-accent" size={18} />
      <h2 id={title} className="text-base font-semibold text-white">{t("search.title")}</h2>
      <button type="button" onClick={close} aria-label={t("common.close")} className="ml-auto flex size-10 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 hover:text-white"><X size={16} /></button>
    </div>
    <div className="p-4 sm:p-5">
      <RealtimeStockSearch placeholder={t("search.placeholder")} mode="navigate" layout="inline" maxResults={12} onSelect={close} />
    </div>
  </dialog>;
}
