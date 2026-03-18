"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

type Dimension = "日" | "周" | "月";
type Metric = "spend" | "roi" | "conversions";

const DIMENSION_DAYS: Record<Dimension, number> = { 日: 14, 周: 8, 月: 6 };

function generateData(dim: Dimension, projectId: string) {
  const seed = projectId.charCodeAt(projectId.length - 1);
  const count = DIMENSION_DAYS[dim];

  return Array.from({ length: count }, (_, i) => {
    const base = (seed * (i + 1) * 13) % 100;
    const spend = Math.round(8000 + base * 120 + Math.sin(i * 0.8) * 3000);
    const roi = parseFloat((1.2 + (base / 100) * 1.5 + Math.cos(i * 0.6) * 0.3).toFixed(2));
    const conversions = Math.round(120 + base * 5 + Math.sin(i * 1.2) * 80);
    const label = dim === "日"
      ? `${i + 1}日`
      : dim === "周"
      ? `第${i + 1}周`
      : `${i + 1}月`;
    return { label, spend, roi, conversions };
  });
}

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: "spend", label: "消耗(¥)", unit: "¥", color: "#6366f1" },
  { key: "roi", label: "ROI", unit: "x", color: "#10b981" },
  { key: "conversions", label: "转化数", unit: "", color: "#f59e0b" },
];

interface SpendRoiChartProps {
  projectId: string;
}

export function SpendRoiChart({ projectId }: SpendRoiChartProps) {
  const [dim, setDim] = useState<Dimension>("日");
  const [metric, setMetric] = useState<Metric>("spend");

  const data = generateData(dim, projectId);
  const metaConfig = METRICS.find((m) => m.key === metric)!;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Metric tabs */}
        <div className="flex gap-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-all",
                metric === m.key
                  ? "text-white shadow-sm"
                  : "text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:bg-slate-100 dark:hover:bg-white/5"
              )}
              style={metric === m.key ? { backgroundColor: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Dimension tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[hsl(var(--secondary))]">
          {(["日", "周", "月"] as Dimension[]).map((d) => (
            <button
              key={d}
              onClick={() => setDim(d)}
              className={cn(
                "text-xs px-3 py-1 rounded-md font-medium transition-all",
                dim === d
                  ? "bg-white dark:bg-[hsl(var(--card))] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-[hsl(var(--muted-foreground))]"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`areaGrad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metaConfig.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={metaConfig.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "rgb(148,163,184)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgb(148,163,184)" }}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v) =>
                metric === "spend"
                  ? `¥${(v / 1000).toFixed(0)}k`
                  : metric === "roi"
                  ? `${v}x`
                  : `${v}`
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222 47% 11%)",
                border: "1px solid hsl(217 32% 20%)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "hsl(213 31% 91%)",
              }}
              formatter={(value) => {
                const v = value as number;
                return metric === "spend"
                  ? [`¥${v.toLocaleString()}`, "消耗"]
                  : metric === "roi"
                  ? [`${v}x`, "ROI"]
                  : [`${v}`, "转化数"];
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={metaConfig.color}
              strokeWidth={2}
              fill={`url(#areaGrad-${metric})`}
              dot={false}
              activeDot={{ r: 4, fill: metaConfig.color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
