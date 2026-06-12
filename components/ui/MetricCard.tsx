type MetricCardProps = {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
  className?: string;
};

export function MetricCard({ label, value, tone = "neutral", className = "" }: MetricCardProps) {
  const valueClass =
    tone === "positive" ? "text-success" : tone === "negative" ? "text-danger" : "text-white";

  return (
    <article className={`rounded-xl border border-white/[0.08] bg-elevated p-3.5 ${className}`}>
      <p className="section-kicker">{label}</p>
      <p className={`mt-1.5 break-words text-base font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </article>
  );
}
