"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { RealtimeStockSearch } from "@/components/stocks/RealtimeStockSearch";

export function SearchModal() {
  const { isOpen, close } = useSearchStore();
  const backdropRef = useRef<HTMLDivElement>(null);

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
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[8vh]"
      onPointerDown={(e) => {
        if (e.target === backdropRef.current) close();
      }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative w-full max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-zinc-950/98 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Search stocks</span>
            <button
              type="button"
              onClick={close}
              aria-label="Close search"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          <div className="p-3">
            <RealtimeStockSearch
              placeholder="Search stock symbol, company, or ticker..."
              mode="navigate"
              layout="inline"
              maxResults={12}
              onSelect={close}
            />
          </div>
          <p className="border-t border-white/10 px-4 py-2.5 text-xs text-slate-600">
            Press <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-slate-500">Esc</kbd> to close · <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-slate-500">↑↓</kbd> to navigate · <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-slate-500">↵</kbd> to open
          </p>
        </div>
      </div>
    </div>
  );
}
