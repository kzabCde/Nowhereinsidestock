import Link from "next/link";
import type { ReactNode } from "react";

type IconActionButtonProps = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function IconActionButton({ href, label, icon }: IconActionButtonProps) {
  return (
    <Link href={href} className="printstream-shell pearl-border glow-soft flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium text-slate-100 transition hover:text-white sm:h-14">
      <span className="h-5 w-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
