import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down"; value: string };
  highlight?: boolean;
}

export function StatsCard({ label, value, trend, highlight }: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all hover:shadow-md",
        highlight
          ? "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/5"
          : "border-slate-200 bg-white dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))] shadow-sm hover:shadow-slate-200 dark:hover:shadow-none"
      )}
    >
      <div className={cn(
        "text-xs font-semibold uppercase tracking-wider mb-3",
        highlight ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-[hsl(var(--muted-foreground))]"
      )}>
        {label}
      </div>
      <div className={cn(
        "text-2xl font-bold",
        highlight ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
      )}>
        {value}
      </div>
      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium px-2 py-0.5 rounded-full w-fit",
            trend.direction === "up"
              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          )}
        >
          {trend.direction === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend.value}
        </div>
      )}
    </div>
  );
}
