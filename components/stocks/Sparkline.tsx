"use client";

import { useId } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

type SparklineProps = {
  data: number[];
  positive: boolean;
};

export function Sparkline({ data, positive }: SparklineProps) {
  const uid = useId();
  const chartData = data.map((v) => ({ v }));
  const color = positive ? "#43E67B" : "#F87171";

  if (data.length < 3) return null;

  return (
    <div className="h-10 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${uid})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
