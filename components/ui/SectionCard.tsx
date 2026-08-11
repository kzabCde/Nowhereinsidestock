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
        ? "border-white/[0.06] bg-white/[0.018]"
        : "data-panel";

  return (
    <Component
      className={`overflow-hidden rounded-2xl border p-5 sm:p-6 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
