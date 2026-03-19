"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { getRequirements, getProjects } from "@/lib/store";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RequirementCard } from "@/components/dashboard/RequirementCard";
import type { Requirement, Project, ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; tw: string }> = {
  STRATEGY: { label: "策略制定", tw: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
  LAUNCHING: { label: "启动投放", tw: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  OPTIMIZING: { label: "优化调整", tw: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
  REVIEWING: { label: "复盘中", tw: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" },
  COMPLETED: { label: "已完成", tw: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400" },
};

function fmt(n: number) {
  if (n >= 10000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

// ── 财务汇总统计 ─────────────────────────────────────────────────────────────
function useFinanceStats(projects: Project[]) {
  const totalRecharge = projects.reduce((s, p) => s + (p.totalRecharge ?? 0), 0);
  const totalSpend = projects.reduce((s, p) => s + (p.budgetActual ?? 0), 0);
  const dailySpend = projects.reduce((s, p) => s + (p.dailySpend ?? 0), 0);
  const dailyRecharge = projects.reduce((s, p) => s + (p.dailyRecharge ?? 0), 0);
  return { totalRecharge, totalSpend, dailySpend, dailyRecharge };
}

// ── 项目排名榜 ────────────────────────────────────────────────────────────────
type RankTab = "spend" | "roi";

function ProjectRanking({ projects }: { projects: Project[] }) {
  const [tab, setTab] = useState<RankTab>("spend");
  const router = useRouter();

  const ranked =
    tab === "spend"
      ? [...projects]
          .filter((p) => (p.budgetActual ?? 0) > 0)
          .sort((a, b) => (b.budgetActual ?? 0) - (a.budgetActual ?? 0))
      : [...projects]
          .filter((p) => p.roiActual !== undefined)
          .sort((a, b) => (b.roiActual ?? 0) - (a.roiActual ?? 0));

  const maxSpend = ranked.length > 0 ? (ranked[0].budgetActual ?? 1) : 1;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[hsl(var(--border))]">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">项目排名</h2>
        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-[hsl(var(--border))] text-[11px]">
          <button
            onClick={() => setTab("spend")}
            className={cn(
              "px-3 py-1 font-medium transition-colors",
              tab === "spend"
                ? "bg-indigo-600 text-white dark:bg-[hsl(var(--primary))]"
                : "text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:bg-slate-50 dark:hover:bg-white/5"
            )}
          >
            消耗
          </button>
          <button
            onClick={() => setTab("roi")}
            className={cn(
              "px-3 py-1 font-medium transition-colors",
              tab === "roi"
                ? "bg-indigo-600 text-white dark:bg-[hsl(var(--primary))]"
                : "text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:bg-slate-50 dark:hover:bg-white/5"
            )}
          >
            ROI
          </button>
        </div>
      </div>

      {/* Rank list */}
      <div className="divide-y divide-slate-50 dark:divide-[hsl(var(--border))]">
        {ranked.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
            暂无数据
          </div>
        ) : (
          ranked.slice(0, 6).map((project, idx) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
            >
              {/* Rank number */}
              <span
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                  idx === 0
                    ? "bg-amber-400 text-white"
                    : idx === 1
                    ? "bg-slate-400 text-white"
                    : idx === 2
                    ? "bg-orange-400 text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-[hsl(var(--muted-foreground))]"
                )}
              >
                {idx + 1}
              </span>

              {/* Project info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-medium text-slate-800 dark:text-white truncate">
                    {project.clientName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[hsl(var(--muted-foreground))] flex-shrink-0">
                    {project.mediaPlatform}
                  </span>
                </div>

                {tab === "spend" && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 dark:bg-[hsl(var(--primary))] transition-all"
                        style={{ width: `${((project.budgetActual ?? 0) / maxSpend) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {tab === "roi" && project.roiActual !== undefined && (
                  <div className="mt-0.5 text-[10px] text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                    {project.optimizerName}
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="flex-shrink-0 text-right">
                {tab === "spend" ? (
                  <span className="text-sm font-semibold text-slate-700 dark:text-white">
                    {fmt(project.budgetActual ?? 0)}
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    {project.roiActual !== undefined && project.roiActual >= 1 ? (
                      <TrendingUp size={11} className="text-green-500" />
                    ) : project.roiActual !== undefined && project.roiActual < 1 ? (
                      <TrendingDown size={11} className="text-red-400" />
                    ) : (
                      <Minus size={11} className="text-slate-400" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-bold",
                        project.roiActual !== undefined && project.roiActual >= 1
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500 dark:text-red-400"
                      )}
                    >
                      {project.roiActual?.toFixed(2) ?? "—"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── 小型项目卡片 ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const status = PROJECT_STATUS_CONFIG[project.status];
  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-4 cursor-pointer transition-all hover:shadow-md hover:shadow-slate-100 dark:hover:shadow-none hover:border-indigo-200 dark:hover:border-[hsl(var(--primary)/0.4)] shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{project.clientName}</div>
          <div className="text-xs mt-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
            {project.mediaPlatform} · {project.optimizerName ?? project.industry}
          </div>
        </div>
        <span className={cn("text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0", status.tw)}>
          {status.label}
        </span>
      </div>
      {project.roiActual !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-[hsl(var(--border))]">
          <span className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">实际 ROI</span>
          <span
            className={cn(
              "text-sm font-bold",
              project.roiActual >= 1 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
            )}
          >
            {project.roiActual.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Business 看板 ─────────────────────────────────────────────────────────────
function BusinessDashboard() {
  const router = useRouter();
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    setAllRequirements(getRequirements());
    setAllProjects(getProjects());
  }, []);

  const pendingRequirements = allRequirements.filter(
    (r) => r.status === "DRAFT" || r.status === "PENDING" || r.status === "EVALUATING"
  );
  const activeProjects = allProjects.filter((p) => p.status !== "COMPLETED");
  const { totalRecharge, totalSpend, dailySpend, dailyRecharge } = useFinanceStats(allProjects);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Finance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          label="累计充值"
          value={fmt(totalRecharge)}
          trend={{ direction: "up", value: `当日 ${fmt(dailyRecharge)}` }}
        />
        <StatsCard
          label="累计消耗"
          value={fmt(totalSpend)}
          trend={{ direction: "up", value: `当日 ${fmt(dailySpend)}` }}
        />
        <StatsCard
          label="当日充值"
          value={fmt(dailyRecharge)}
          highlight={dailyRecharge > 0}
        />
        <StatsCard
          label="当日消耗"
          value={fmt(dailySpend)}
          trend={
            dailySpend > 0
              ? { direction: "up", value: `${activeProjects.length} 个项目` }
              : undefined
          }
        />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Pending requirements (60%) */}
        <div className="col-span-1 lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">待处理需求</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-medium">
              {pendingRequirements.length} 条
            </span>
          </div>

          {pendingRequirements.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] p-8 text-center text-slate-400 dark:text-[hsl(var(--muted-foreground))] text-sm bg-white dark:bg-[hsl(var(--card))]">
              暂无待处理需求
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequirements.map((req) => (
                <RequirementCard key={req.id} requirement={req} />
              ))}
            </div>
          )}

          <button
            onClick={() => router.push("/requirements/new")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-[hsl(var(--border))] text-sm font-medium text-slate-400 dark:text-[hsl(var(--muted-foreground))] transition-all hover:border-indigo-400 dark:hover:border-[hsl(var(--primary))] hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-[hsl(var(--primary)/0.05)]"
          >
            <Plus size={16} />
            新建需求
          </button>
        </div>

        {/* Right: Ranking + Active projects (40%) */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <ProjectRanking projects={allProjects} />

          {activeProjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">进行中项目</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 font-medium">
                  {activeProjects.length} 个
                </span>
              </div>
              <div className="space-y-3">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => router.push(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Optimizer 看板 ────────────────────────────────────────────────────────────
function OptimizerDashboard({ optimizerName }: { optimizerName: string }) {
  const router = useRouter();
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    setAllRequirements(getRequirements().filter((r) => r.status !== "DRAFT"));
    setAllProjects(getProjects());
  }, []);

  const evaluatingReqs = allRequirements
    .filter((r) => r.status === "EVALUATING" || r.status === "PENDING")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const myProjects = allProjects.filter((p) => p.optimizerName === optimizerName);
  const activeProjectCount = myProjects.filter((p) => p.status !== "COMPLETED").length;
  const avgRoi =
    myProjects.length > 0
      ? myProjects.reduce((sum, p) => sum + (p.roiActual ?? 0), 0) / myProjects.length
      : 0;

  const { dailySpend } = useFinanceStats(myProjects);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          label="待评估需求"
          value={`${evaluatingReqs.length} 条`}
          highlight={evaluatingReqs.length > 0}
        />
        <StatsCard label="进行中项目" value={`${activeProjectCount} 个`} />
        <StatsCard
          label="当日消耗"
          value={fmt(dailySpend)}
          trend={dailySpend > 0 ? { direction: "up", value: `${activeProjectCount} 个项目` } : undefined}
        />
        <StatsCard
          label="平均实际 ROI"
          value={avgRoi > 0 ? avgRoi.toFixed(2) : "—"}
          trend={avgRoi >= 1 ? { direction: "up", value: "超额达成" } : undefined}
        />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Evaluating queue (60%) */}
        <div className="col-span-1 lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">待评估需求队列</h2>
            {evaluatingReqs.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {evaluatingReqs.length} 条待处理
              </span>
            )}
          </div>

          {evaluatingReqs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] p-8 text-center text-slate-400 dark:text-[hsl(var(--muted-foreground))] text-sm bg-white dark:bg-[hsl(var(--card))]">
              暂无待评估需求
            </div>
          ) : (
            <div className="space-y-3">
              {evaluatingReqs.map((req, idx) => (
                <div key={req.id} className="relative">
                  {idx === 0 && (
                    <span className="absolute -top-1.5 -left-1.5 text-[9px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold z-10">
                      最紧急
                    </span>
                  )}
                  <RequirementCard requirement={req} showScore />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Ranking + My projects (40%) */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <ProjectRanking projects={myProjects} />

          {myProjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">我的项目</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-medium">
                  {myProjects.length} 个
                </span>
              </div>
              <div className="space-y-3">
                {myProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => router.push(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useRole();
  if (currentUser.role === "BUSINESS") {
    return <BusinessDashboard />;
  }
  return <OptimizerDashboard optimizerName={currentUser.name} />;
}
