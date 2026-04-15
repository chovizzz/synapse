"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import type { Requirement, RequirementPriority, User } from "@/types";

const PRIORITY_CONFIG: Record<RequirementPriority, { label: string; bg: string; color: string; dot: string }> = {
  HIGH: { label: "高优", bg: "rgba(239,68,68,0.12)", color: "rgb(239,68,68)", dot: "bg-red-500" },
  MEDIUM: { label: "中优", bg: "rgba(234,179,8,0.12)", color: "rgb(161,123,5)", dot: "bg-yellow-500" },
  LOW: { label: "低优", bg: "rgba(148,163,184,0.12)", color: "rgb(100,116,139)", dot: "bg-slate-400" },
};

export default function AdminRequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [optimizers, setOptimizers] = useState<User[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [batchOptimizerId, setBatchOptimizerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [batchAssigning, setBatchAssigning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | RequirementPriority>("ALL");
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/requirements?status=PENDING").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([reqs, users]) => {
      setRequirements(reqs);
      const opts = users.filter((u: User) => u.role === "OPTIMIZER");
      setOptimizers(opts);
      if (opts.length > 0) setBatchOptimizerId(opts[0].id);
      setLoading(false);
    });
  }, []);

  const handleAssign = async (reqId: string, optimizerId: string) => {
    if (!optimizerId) return;
    setAssigning(reqId);
    try {
      await fetch(`/api/admin/requirements/${reqId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimizerId }),
      });
      setRequirements((prev) => prev.filter((r) => r.id !== reqId));
      setToast("分配成功");
    } catch {
      setToast("分配失败，请重试");
    } finally {
      setAssigning(null);
    }
  };

  const handleBatchAssign = async () => {
    if (selectedRows.size === 0 || !batchOptimizerId) return;
    setBatchAssigning(true);
    try {
      await fetch("/api/admin/requirements/batch-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirementIds: Array.from(selectedRows),
          optimizerId: batchOptimizerId,
        }),
      });
      setRequirements((prev) => prev.filter((r) => !selectedRows.has(r.id)));
      setSelectedRows(new Set());
      setToast(`成功分配 ${selectedRows.size} 条需求`);
    } catch {
      setToast("批量分配失败，请重试");
    } finally {
      setBatchAssigning(false);
    }
  };

  const toggleRow = (id: string) => {
    const updated = new Set(selectedRows);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedRows(updated);
  };

  const toggleAll = () => {
    if (selectedRows.size === filtered.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(filtered.map((r) => r.id)));
  };

  const filtered = requirements.filter((r) => {
    if (priorityFilter !== "ALL" && r.priority !== priorityFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
        <Loader2 className="animate-spin mr-2" size={16} />
        加载中…
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">需求分配管理</h2>
            <p className="text-xs mt-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
              共 {requirements.length} 条待分配需求
              {selectedRows.size > 0 && ` · 已选择 ${selectedRows.size} 条`}
            </p>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">优先级</span>
            {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-medium transition-all border",
                  priorityFilter === p
                    ? "border-purple-400 bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                    : "border-transparent text-slate-400 dark:text-[hsl(var(--muted-foreground))] hover:border-slate-300"
                )}
              >
                {p === "ALL" ? "全部" : PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Batch assign bar */}
        {selectedRows.size > 0 && (
          <div className="rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/5 p-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              已选择 {selectedRows.size} 条需求
            </span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <label className="text-xs text-slate-500 dark:text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                批量分配给
              </label>
              <div className="relative flex-1 max-w-[200px]">
                <select
                  value={batchOptimizerId}
                  onChange={(e) => setBatchOptimizerId(e.target.value)}
                  className="w-full appearance-none rounded-lg px-3 py-1.5 pr-8 text-sm outline-none border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-[hsl(var(--secondary))] text-slate-800 dark:text-[hsl(var(--foreground))] focus:border-purple-400 transition-colors"
                >
                  {optimizers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <button
              onClick={handleBatchAssign}
              disabled={batchAssigning}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {batchAssigning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  分配中…
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  批量分配
                </>
              )}
            </button>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-xs text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:text-slate-700 dark:hover:text-white"
            >
              取消选择
            </button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                暂无待分配需求
              </div>
            ) : (
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[hsl(var(--border))] text-xs uppercase tracking-wider text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                    <th className="text-left px-4 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === filtered.length && filtered.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300 dark:border-[hsl(var(--border))] text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium">客户 / 商务</th>
                    <th className="text-left px-4 py-3 font-medium">媒体平台</th>
                    <th className="text-left px-4 py-3 font-medium">日预算</th>
                    <th className="text-left px-4 py-3 font-medium">优先级</th>
                    <th className="text-left px-4 py-3 font-medium">AI评分</th>
                    <th className="text-left px-4 py-3 font-medium">创建时间</th>
                    <th className="text-left px-4 py-3 font-medium">分配操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req, idx) => {
                    const priorityCfg = PRIORITY_CONFIG[req.priority ?? "MEDIUM"];
                    const aiScore = req.aiEvaluation?.success_rate;
                    return (
                      <tr
                        key={req.id}
                        className={cn(
                          "border-b last:border-b-0 transition-colors",
                          selectedRows.has(req.id) ? "bg-purple-50 dark:bg-purple-500/5" : "hover:bg-slate-50 dark:hover:bg-white/5"
                        )}
                        style={{ borderColor: idx === filtered.length - 1 ? "transparent" : "hsl(var(--border))" }}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(req.id)}
                            onChange={() => toggleRow(req.id)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-[hsl(var(--border))] text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/requirements/${req.id}`)}
                            className="text-left hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          >
                            <div className="font-medium text-slate-900 dark:text-white">{req.clientName}</div>
                            <div className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                              {req.creatorName}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-600 dark:text-[hsl(var(--foreground))]">
                            {req.structuredData?.media_platform ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-[hsl(var(--foreground))]">
                          {req.structuredData?.daily_budget_usd != null
                            ? formatCurrency(req.structuredData.daily_budget_usd)
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold"
                            style={{ backgroundColor: priorityCfg.bg, color: priorityCfg.color }}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", priorityCfg.dot)} />
                            {priorityCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {aiScore != null ? (
                            <span
                              className={cn(
                                "inline-block text-xs px-2 py-1 rounded-full font-bold",
                                aiScore >= 80
                                  ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                  : aiScore >= 70
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              )}
                            >
                              {aiScore}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-[hsl(var(--muted-foreground))]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                          {formatDate(req.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) handleAssign(req.id, e.target.value);
                                }}
                                disabled={assigning === req.id}
                                className="appearance-none rounded-lg px-3 py-1.5 pr-8 text-xs outline-none border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--secondary))] text-slate-700 dark:text-[hsl(var(--foreground))] focus:border-purple-400 transition-colors disabled:opacity-50"
                              >
                                <option value="">选择优化师…</option>
                                {optimizers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            {assigning === req.id && (
                              <Loader2 size={14} className="animate-spin text-purple-500" />
                            )}
                          </div>
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

      {/* Toast */}
      {toast && (
        <div
          onClick={() => setToast(null)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl bg-purple-600 dark:bg-purple-600 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
        >
          <CheckCircle2 size={14} />
          {toast}
        </div>
      )}
    </>
  );
}
