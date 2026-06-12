"use client";

import { Search } from "lucide-react";
import { useSearchStore } from "@/store/search-store";

type SearchTriggerButtonProps = {
  placeholder?: string;
};

export function SearchTriggerButton({ placeholder = "Search stock symbol..." }: SearchTriggerButtonProps) {
  const open = useSearchStore((s) => s.open);

  return (
    <button
      type="button"
      onClick={open}
      className="flex h-14 w-full items-center gap-3 rounded-3xl border border-white/15 bg-black/35 px-4 text-left transition hover:border-white/25 hover:bg-black/40 sm:px-5"
    >
      <Search size={18} className="shrink-0 text-slate-400" />
      <span className="flex-1 text-base text-slate-500">{placeholder}</span>
      <kbd className="hidden shrink-0 rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-xs text-slate-500 sm:block">
        ⌘K
      </kbd>
    </button>
  );
}
