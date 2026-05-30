import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type SectionCardProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  variant?: "default" | "quiet" | "danger";
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function SectionCard<T extends ElementType = "section">({
  as,
  children,
  className = "",
  variant = "default",
  ...props
}: SectionCardProps<T>) {
  const Component = as ?? "section";
  const variantClass =
    variant === "danger"
      ? "border-rose-300/35 bg-rose-950/10"
      : variant === "quiet"
        ? "border-white/10 bg-white/[0.025]"
        : "pearl-border border-white/10 bg-white/[0.04]";

  return (
    <Component
      className={`premium-card rounded-3xl border p-4 sm:p-6 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
