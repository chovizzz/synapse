"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { role: "商务", text: "登录「商务小谢」→ 需求管理「新建需求」或 经验库「参考此案例创建需求」→ 草稿预审、AI 对话与评估 → 提交给优化师。" },
  { role: "优化师", text: "登录「优化师小郑」→ 首页待评估队列 / 需求管理 → 接单或拒绝 → 项目看板沟通与数据。" },
  { role: "通用", text: "经验库可「分享新案例」；项目页商务可「充值」；通知铃铛可查看关键动作提醒。" },
];

export function DemoTourBanner() {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: "hsl(var(--border))",
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--card)) 60%)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={18} className="flex-shrink-0 text-indigo-600 dark:text-[hsl(var(--primary))]" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            比赛 / 对外 Demo · 3 分钟演示路线
          </span>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 space-y-2 border-t border-slate-100 dark:border-[hsl(var(--border))]">
          {STEPS.map((s, i) => (
            <div key={i} className="flex gap-3 text-xs sm:text-sm leading-relaxed">
              <span
                className={cn(
                  "flex-shrink-0 px-2 py-0.5 rounded-lg font-semibold text-[10px] sm:text-xs",
                  s.role === "商务"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300"
                    : s.role === "优化师"
                      ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
                      : "bg-slate-100 text-slate-600 dark:bg-[hsl(var(--secondary))] dark:text-[hsl(var(--muted-foreground))]"
                )}
              >
                {s.role}
              </span>
              <p className="text-slate-600 dark:text-[hsl(var(--muted-foreground))]">{s.text}</p>
            </div>
          ))}
          <p className="text-[11px] pt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            数据均在浏览器本地存储；登录页可「重置为演示数据」恢复完整示例。
          </p>
        </div>
      )}
    </div>
  );
}
