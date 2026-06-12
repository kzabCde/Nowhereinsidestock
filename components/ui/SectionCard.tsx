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
      ? "border-danger/20 bg-danger/5"
      : variant === "quiet"
        ? "border-white/[0.06] bg-white/[0.02]"
        : "border-white/[0.08] bg-surface";

  return (
    <Component
      className={`overflow-hidden rounded-2xl border p-5 sm:p-6 ${variantClass} ${className}`}
      style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset" }}
      {...props}
    >
      {children}
    </Component>
  );
}
