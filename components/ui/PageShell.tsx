import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide";
};

export function PageShell({ children, className = "", size = "default" }: PageShellProps) {
  const maxWidth = size === "wide" ? "max-w-7xl" : "max-w-6xl";
  return (
    <main className="grid-overlay min-h-screen w-full overflow-x-hidden">
      <div className={`mx-auto w-full ${maxWidth} px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-11 ${className}`}>
        {children}
      </div>
    </main>
  );
}
