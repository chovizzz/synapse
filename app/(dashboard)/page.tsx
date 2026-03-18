"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { getRequirements } from "@/lib/store";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RequirementCard } from "@/components/dashboard/RequirementCard";
import type { Requirement, ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; color: string; tw: string }> = {
  STRATEGY: { label: "策略制定", bg: "rgba(168,85,247,0.1)", color: "rgb(192,132,252)", tw: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
  LAUNCHING: { label: "启动投放", bg: "rgba(59,130,246,0.1)", color: "rgb(96,165,250)", tw: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  OPTIMIZING: { label: "优化调整", bg: "rgba(234,179,8,0.1)", color: "rgb(250,204,21)", tw: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
  REVIEWING: { label: "复盘中", bg: "rgba(249,115,22,0.1)", color: "rgb(251,146,60)", tw: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" },
  COMPLETED: { label: "已完成", bg: "rgba(107,114,128,0.1)", color: "rgb(156,163,175)", tw: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400" },
};

export default function DashboardPage() {
  const { currentUser } = useRole();
  if (currentUser.role === "BUSINESS") {
    return <BusinessDashboard />;
  }
  return <OptimizerDashboard optimizerName={currentUser.name} />;
}

function ProjectCard({ project, onClick }: { project: typeof MOCK_PROJECTS[0]; onClick: () => void }) {
  const status = PROJECT_STATUS_CONFIG[project.status];
  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-4 cursor-pointer transition-all hover:shadow-md hover:shadow-slate-100 dark:hover:shadow-none hover:border-indigo-200 dark:hover:border-[hsl(var(--primary)/0.4)] shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900 dark:text-white text-sm">{project.clientName}</div>
          <div className="text-xs mt-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
            {project.mediaPlatform} · {project.optimizerName ?? project.industry}
          </div>
        </div>
        <span className={cn("text-[10px] px-2 py-1 rounded-full font-semibold whitespace-nowrap", status.tw)}>
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

function BusinessDashboard() {
  const router = useRouter();
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);

  useEffect(() => {
    setAllRequirements(getRequirements());
  }, []);

  const pendingRequirements = allRequirements.filter(
    (r) => r.status === "DRAFT" || r.status === "PENDING" || r.status === "EVALUATING"
  );
  const activeProjects = MOCK_PROJECTS.filter((p) => p.status !== "COMPLETED");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="本月新需求" value="12 条" trend={{ direction: "up", value: "+3 vs 上月" }} />
        <StatsCard label="进行中项目" value="5 个" />
        <StatsCard label="评估完成率" value="87%" trend={{ direction: "up", value: "+5%" }} />
        <StatsCard label="平均响应时间" value="18 分钟" trend={{ direction: "down", value: "-4 分钟" }} />
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

        {/* Right: Active projects (40%) */}
        <div className="col-span-1 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">进行中项目</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 font-medium">
              {activeProjects.length} 个
            </span>
          </div>

          {activeProjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] p-8 text-center text-slate-400 dark:text-[hsl(var(--muted-foreground))] text-sm bg-white dark:bg-[hsl(var(--card))]">
              暂无进行中项目
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OptimizerDashboard({ optimizerName }: { optimizerName: string }) {
  const router = useRouter();
  const [allRequirements, setAllRequirements] = useState<Requirement[]>([]);

  useEffect(() => {
    // 优化师看不到 DRAFT 状态的需求
    setAllRequirements(getRequirements().filter((r) => r.status !== "DRAFT"));
  }, []);

  const evaluatingReqs = allRequirements
    .filter((r) => r.status === "EVALUATING" || r.status === "PENDING")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const myProjects = MOCK_PROJECTS.filter((p) => p.optimizerName === optimizerName);
  const activeProjectCount = myProjects.filter((p) => p.status !== "COMPLETED").length;
  const avgRoi =
    myProjects.length > 0
      ? myProjects.reduce((sum, p) => sum + (p.roiActual ?? 0), 0) / myProjects.length
      : 0;

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
        <StatsCard label="本月接单" value="8 个" trend={{ direction: "up", value: "+2 vs 上月" }} />
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

        {/* Right: My projects (40%) */}
        <div className="col-span-1 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">我的项目</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-medium">
              {myProjects.length} 个
            </span>
          </div>

          {myProjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] p-8 text-center text-slate-400 dark:text-[hsl(var(--muted-foreground))] text-sm bg-white dark:bg-[hsl(var(--card))]">
              暂无分配项目
            </div>
          ) : (
            <div className="space-y-3">
              {myProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
