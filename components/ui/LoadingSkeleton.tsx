"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function LoadingSkeleton({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="space-y-4" role="status">
      <div className="h-[11px] w-20 animate-pulse rounded-full bg-white/[0.06]" />
      <div className="h-8 w-1/2 animate-pulse rounded-xl bg-white/[0.06]" />
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.04]" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-24 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-24 animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
      <span className="sr-only">{label ?? t("common.loading")}</span>
    </div>
  );
}
