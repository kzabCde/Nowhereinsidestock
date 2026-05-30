import type { ReactNode } from "react";
import { SectionCard } from "@/components/ui/SectionCard";

type EmptyStateProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function EmptyState({ title, description, actions }: EmptyStateProps) {
  return (
    <SectionCard className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Empty state</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
      {actions ? <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">{actions}</div> : null}
    </SectionCard>
  );
}
