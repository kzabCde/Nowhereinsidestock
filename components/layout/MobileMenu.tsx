"use client";

import Link from "next/link";
import { useEffect } from "react";

type NavItem = { label: string; href: string };

type Props = {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
};

export function MobileMenu({ open, onClose, items }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out md:hidden ${
        open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <nav aria-label="Mobile menu" className="mt-2 rounded-2xl border border-white/15 bg-[#0a0a0c] p-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10" onClick={onClose}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
