import { motion } from "framer-motion";

type InsightCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
};

const tones: Record<NonNullable<InsightCardProps["tone"]>, string> = {
  neutral: "text-white",
  positive: "text-success",
  negative: "text-danger"
};

export function InsightCard({ label, value, tone = "neutral" }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-xl border border-white/[0.08] bg-elevated p-4"
    >
      <p className="section-kicker">{label}</p>
      <p className={`mt-2 truncate text-xl font-bold tracking-tight ${tones[tone]}`}>{value}</p>
    </motion.div>
  );
}
