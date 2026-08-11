import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function EmptyState({ title, description, actions }: EmptyStateProps) {
  return (
    <div className="data-panel flex flex-col items-center px-5 py-14 text-center sm:py-16">
      <div className="relative z-[1] mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/15 bg-accent/[0.055]">
        <span className="h-2.5 w-2.5 rounded-full border border-accent/70 shadow-[0_0_18px_rgba(114,167,255,.4)]" />
      </div>
      <h2 className="relative z-[1] text-lg font-semibold tracking-[-0.02em] text-white">{title}</h2>
      <p className="relative z-[1] mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {actions ? <div className="relative z-[1] mt-6 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
