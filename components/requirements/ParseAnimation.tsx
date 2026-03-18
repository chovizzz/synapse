"use client";
import { motion } from "motion/react";
import { StructuredRequirement } from "@/types";
import { TypewriterText } from "./TypewriterText";
import { cn } from "@/lib/utils";

interface ParseAnimationProps {
  data: StructuredRequirement | null;
  isLoading: boolean;
}

const FIELD_META: Array<{
  key: keyof Omit<StructuredRequirement, "ambiguous_fields">;
  icon: string;
  label: string;
  format?: (v: unknown) => string;
  hideIfEmpty?: boolean;
}> = [
  { key: "region", icon: "🌍", label: "投放地区" },
  { key: "media_platform", icon: "📱", label: "媒体平台" },
  {
    key: "daily_budget_usd",
    icon: "💰",
    label: "测试日预算",
    format: (v) => (v != null ? `$${v}/天` : "未提供"),
  },
  { key: "target_kpi", icon: "📊", label: "核心指标" },
  {
    key: "target_roi",
    icon: "🎯",
    label: "目标ROI",
    format: (v) => (v != null ? String(v) : "—"),
  },
  { key: "product_type", icon: "📦", label: "产品类型" },
  { key: "campaign_objective", icon: "🚀", label: "推广目标" },
  { key: "soft_kpi", icon: "📈", label: "Soft KPI", hideIfEmpty: true },
  { key: "test_period", icon: "🗓️", label: "测试周期", hideIfEmpty: true },
  { key: "third_party_tracking", icon: "🔗", label: "三方归因", hideIfEmpty: true },
  { key: "attribution_model", icon: "🏢", label: "自投/代投", hideIfEmpty: true },
  { key: "expected_start_date", icon: "⏰", label: "期望启动", hideIfEmpty: true },
  { key: "policy_notes", icon: "📋", label: "政策备注", hideIfEmpty: true },
  {
    key: "product_url",
    icon: "🔗",
    label: "产品链接",
    hideIfEmpty: true,
    format: (v) => (v ? String(v).replace(/^https?:\/\//, "").slice(0, 40) + "…" : "—"),
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 animate-pulse">
      <div className="h-3 w-20 bg-[hsl(var(--muted))] rounded mb-3" />
      <div className="h-5 w-28 bg-[hsl(var(--muted))] rounded" />
    </div>
  );
}

export function ParseAnimation({ data, isLoading }: ParseAnimationProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-[hsl(var(--primary))]">
          <div className="w-5 h-5 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">AI 正在理解需求...</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <motion.div
        className="grid grid-cols-3 gap-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {FIELD_META.filter(({ key, hideIfEmpty }) => {
          if (!hideIfEmpty) return true;
          const v = data[key];
          return v != null && v !== "" && v !== "—";
        }).map(({ key, icon, label, format }) => {
          const raw = data[key];
          const value = format ? format(raw) : (raw != null && raw !== "" ? String(raw) : "—");

          return (
            <motion.div
              key={key}
              variants={item}
              className={cn(
                "rounded-xl border p-4 transition-colors duration-500",
                "border-[hsl(var(--primary))]/50 bg-[hsl(var(--card))]",
                "relative overflow-hidden"
              )}
            >
              {/* 蓝色左竖线 */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[hsl(var(--primary))] rounded-l-xl" />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1 pl-2">
                {icon} {label}
              </p>
              <p className="text-lg font-semibold text-white pl-2">
                <TypewriterText text={value} delay={40} />
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 模糊字段追问 */}
      {data.ambiguous_fields && data.ambiguous_fields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: FIELD_META.length * 0.12 + 0.2, duration: 0.4 }}
          className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 space-y-2"
        >
          <p className="text-sm font-medium text-yellow-400">⚠️ 以下信息需进一步确认</p>
          {data.ambiguous_fields.map((af, i) => (
            <div key={i} className="text-sm text-yellow-300/80">
              <span className="font-medium text-yellow-300">[{af.field}]</span> {af.question}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
