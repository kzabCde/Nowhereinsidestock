import type { ButtonHTMLAttributes, ReactNode } from "react";

type TabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  eyebrow?: string;
  icon?: ReactNode;
};

export function TabButton({ active = false, eyebrow, icon, children, className = "", ...props }: TabButtonProps) {
  return (
    <button
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/30 ${
        active
          ? "border-accent/25 bg-accent/10 text-accent"
          : "border-white/[0.07] bg-transparent text-slate-400 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-slate-200"
      } ${className}`}
      {...props}
    >
      {icon}
      <span className="min-w-0">
        <span className="block whitespace-nowrap font-medium leading-5">{children}</span>
        {eyebrow ? (
          <span className="block whitespace-nowrap text-[10px] leading-4 opacity-60">{eyebrow}</span>
        ) : null}
      </span>
    </button>
  );
}
