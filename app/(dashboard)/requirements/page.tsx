"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getRequirements } from "@/lib/store";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { useRole } from "@/lib/role-context";
import type { Requirement, RequirementStatus } from "@/types";

type Tab = "ALL" | "DRAFT" | "EVALUATING" | "ACCEPTED" | "COMPLETED";

const TABS: { key: Tab; label: string }[] = [
  { key: "ALL", label: "全部" },
  { key: "DRAFT", label: "草稿" },
  { key: "EVALUATING", label: "评估中" },
  { key: "ACCEPTED", label: "已接单" },
  { key: "COMPLETED", label: "已完成" },
];

const STATUS_CONFIG: Record<RequirementStatus, { label: string; bg: string; color: string }> = {
  DRAFT: { label: "草稿", bg: "rgba(139,92,246,0.1)", color: "rgb(167,139,250)" },
  PENDING: { label: "待分配", bg: "rgba(234,179,8,0.1)", color: "rgb(250,204,21)" },
  EVALUATING: { label: "评估中", bg: "rgba(59,130,246,0.1)", color: "rgb(96,165,250)" },
  ACCEPTED: { label: "已接单", bg: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)" },
  IN_PROGRESS: { label: "投放中", bg: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)" },
  REJECTED: { label: "已拒绝", bg: "rgba(239,68,68,0.1)", color: "rgb(248,113,113)" },
  COMPLETED: { label: "已完成", bg: "rgba(107,114,128,0.1)", color: "rgb(156,163,175)" },
};

function matchesTab(status: RequirementStatus, tab: Tab, isBusiness: boolean): boolean {
  if (tab === "ALL") return true;
  if (tab === "DRAFT") return status === "DRAFT";
  if (tab === "ACCEPTED") return status === "ACCEPTED" || status === "IN_PROGRESS";
  return status === tab;
}

export default function RequirementsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const router = useRouter();
  const { currentUser } = useRole();

  const isBusiness = currentUser.role === "BUSINESS";

  useEffect(() => {
    const all = getRequirements();
    // 优化师看不到 DRAFT 状态的需求
    const visible = isBusiness ? all : all.filter((r) => r.status !== "DRAFT");
    setRequirements(visible);
  }, [isBusiness]);

  const filtered = requirements.filter((r) => matchesTab(r.status, activeTab, isBusiness));

  // DRAFT tab 只对商务显示
  const visibleTabs = isBusiness ? TABS : TABS.filter((t) => t.key !== "DRAFT");

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">需求管理</h2>
          <p className="text-xs mt-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
            共 {requirements.length} 条需求
          </p>
        </div>
        {isBusiness && (
          <button
            onClick={() => router.push("/requirements/new")}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all bg-indigo-600 hover:bg-indigo-700 dark:bg-[hsl(var(--primary))] dark:hover:opacity-90 flex-shrink-0 shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">新建需求</span>
            <span className="sm:hidden">新建</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg w-fit"
        style={{ backgroundColor: "hsl(var(--card))" }}
      >
        {visibleTabs.map((tab) => {
          const count =
            tab.key === "ALL"
              ? requirements.length
              : requirements.filter((r) => matchesTab(r.status, tab.key, isBusiness)).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                activeTab === tab.key ? "text-white" : "hover:text-[hsl(var(--foreground))]"
              )}
              style={
                activeTab === tab.key
                  ? { backgroundColor: "hsl(var(--primary))" }
                  : { color: "hsl(var(--muted-foreground))" }
              }
            >
              {tab.label}
              <span
                className="text-[10px] px-1 rounded"
                style={
                  activeTab === tab.key
                    ? { backgroundColor: "rgba(255,255,255,0.2)" }
                    : { backgroundColor: "hsl(var(--secondary))" }
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table — horizontal scroll on mobile */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
      >
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
              该分类暂无需求
            </div>
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr
                  className="border-b text-xs uppercase tracking-wider"
                  style={{
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  <th className="text-left px-4 py-3 font-medium">客户</th>
                  <th className="text-left px-4 py-3 font-medium">媒体平台</th>
                  <th className="text-left px-4 py-3 font-medium">日预算</th>
                  <th className="text-left px-4 py-3 font-medium">KPI</th>
                  <th className="text-left px-4 py-3 font-medium">负责优化师</th>
                  <th className="text-left px-4 py-3 font-medium">状态</th>
                  <th className="text-left px-4 py-3 font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req, idx) => {
                  const status = STATUS_CONFIG[req.status];
                  return (
                    <tr
                      key={req.id}
                      onClick={() => router.push(`/requirements/${req.id}`)}
                      className="border-b last:border-b-0 cursor-pointer transition-colors hover:bg-[hsl(var(--accent))]"
                      style={{
                        borderColor: idx === filtered.length - 1 ? "transparent" : "hsl(var(--border))",
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[hsl(var(--foreground))]">{req.clientName}</div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {req.creatorName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: "hsl(var(--secondary))",
                            color: "hsl(var(--foreground))",
                          }}
                        >
                          {req.structuredData?.media_platform ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--foreground))]">
                        {req.structuredData?.daily_budget_usd != null
                          ? formatCurrency(req.structuredData.daily_budget_usd)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-[hsl(var(--foreground))]">
                        {req.structuredData?.target_kpi ?? "—"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {req.assignedOptimizerName ?? "待分配"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[10px] px-2 py-1 rounded-full font-medium"
                          style={{ backgroundColor: status.bg, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {formatDate(req.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
