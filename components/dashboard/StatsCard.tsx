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
      className="rounded-xl border p-6 transition-all"
      style={
        highlight
          ? {
              borderColor: "rgba(239,68,68,0.3)",
              backgroundColor: "rgba(239,68,68,0.05)",
            }
          : {
              borderColor: "hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
            }
      }
    >
      <div
        className="text-xs uppercase tracking-wider mb-3"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        {label}
      </div>
      <div
        className="text-3xl font-bold"
        style={highlight ? { color: "rgb(248,113,113)" } : { color: "white" }}
      >
        {value}
      </div>
      {trend && (
        <div
          className={cn("flex items-center gap-1 mt-2 text-xs")}
          style={
            trend.direction === "up"
              ? { color: "rgb(74,222,128)" }
              : { color: "rgb(248,113,113)" }
          }
        >
          {trend.direction === "up" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend.value}
        </div>
      )}
    </div>
  );
}
