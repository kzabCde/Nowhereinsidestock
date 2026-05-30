export function LoadingSkeleton({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="premium-card rounded-3xl border border-white/10 bg-white/[0.035] p-6">
      <div className="h-4 w-28 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 h-8 w-2/3 animate-pulse rounded-full bg-white/10" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
