type MetricCardProps = {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
  className?: string;
};

export function MetricCard({ label, value, tone = "neutral", className = "" }: MetricCardProps) {
  const valueClass = tone === "positive" ? "text-success" : tone === "negative" ? "text-danger" : "text-white";

  return (
    <article className={`relative overflow-hidden rounded-xl border border-white/[0.075] bg-elevated/80 p-3.5 sm:p-4 ${className}`}>
      <span className="absolute inset-y-3 left-0 w-px bg-gradient-to-b from-transparent via-accent/45 to-transparent" aria-hidden="true" />
      <p className="section-kicker">{label}</p>
      <p className={`mt-2 break-words text-base font-semibold tabular-nums tracking-[-0.015em] ${valueClass}`}>{value}</p>
    </article>
  );
}
