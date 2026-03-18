"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { MOCK_REQUIREMENTS, MOCK_PROJECTS } from "@/lib/mock-data";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RequirementCard } from "@/components/dashboard/RequirementCard";
import type { ProjectStatus } from "@/types";

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; color: string }> = {
  STRATEGY: { label: "策略制定", bg: "rgba(168,85,247,0.1)", color: "rgb(192,132,252)" },
  LAUNCHING: { label: "启动投放", bg: "rgba(59,130,246,0.1)", color: "rgb(96,165,250)" },
  OPTIMIZING: { label: "优化调整", bg: "rgba(234,179,8,0.1)", color: "rgb(250,204,21)" },
  REVIEWING: { label: "复盘中", bg: "rgba(249,115,22,0.1)", color: "rgb(251,146,60)" },
  COMPLETED: { label: "已完成", bg: "rgba(107,114,128,0.1)", color: "rgb(156,163,175)" },
};

export default function DashboardPage() {
  const { currentUser } = useRole();
  const router = useRouter();

  if (currentUser.role === "BUSINESS") {
    return <BusinessDashboard />;
  }
  return <OptimizerDashboard optimizerName={currentUser.name} />;
}

function BusinessDashboard() {
  const router = useRouter();

  const pendingRequirements = MOCK_REQUIREMENTS.filter(
    (r) => r.status === "PENDING" || r.status === "EVALUATING"
  );
  const activeProjects = MOCK_PROJECTS.filter((p) => p.status !== "COMPLETED");

  return (
    <div className="space-y-6">
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
            <h2 className="text-sm font-semibold text-white">待处理需求</h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(59,130,246,0.1)",
                color: "rgb(96,165,250)",
              }}
            >
              {pendingRequirements.length} 条
            </span>
          </div>

          {pendingRequirements.length === 0 ? (
            <div
              className="rounded-lg border p-8 text-center"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
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
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed text-sm font-medium transition-all hover:text-white"
            style={{
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary))";
              (e.currentTarget as HTMLElement).style.backgroundColor = "hsl(var(--primary) / 0.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
              (e.currentTarget as HTMLElement).style.backgroundColor = "";
            }}
          >
            <Plus size={16} />
            新建需求
          </button>
        </div>

        {/* Right: Active projects (40%) */}
        <div className="col-span-1 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">进行中项目</h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(34,197,94,0.1)",
                color: "rgb(74,222,128)",
              }}
            >
              {activeProjects.length} 个
            </span>
          </div>

          {activeProjects.length === 0 ? (
            <div
              className="rounded-lg border p-8 text-center"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              暂无进行中项目
            </div>
          ) : (
            <div className="space-y-3">
              {activeProjects.map((project) => {
                const status = PROJECT_STATUS_CONFIG[project.status];
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="rounded-lg border p-4 cursor-pointer transition-all"
                    style={{
                      borderColor: "hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white text-sm">{project.clientName}</div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {project.mediaPlatform} · {project.optimizerName}
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap"
                        style={{ backgroundColor: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                    {project.roiActual !== undefined && (
                      <div className="mt-2 flex items-center gap-1">
                        <span
                          className="text-xs"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          实际 ROI
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: project.roiActual >= 1 ? "rgb(74,222,128)" : "rgb(248,113,113)" }}
                        >
                          {project.roiActual.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OptimizerDashboard({ optimizerName }: { optimizerName: string }) {
  const router = useRouter();

  const evaluatingReqs = MOCK_REQUIREMENTS
    .filter((r) => r.status === "EVALUATING")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const myProjects = MOCK_PROJECTS.filter((p) => p.optimizerName === optimizerName);
  const activeProjectCount = myProjects.filter((p) => p.status !== "COMPLETED").length;
  const avgRoi =
    myProjects.length > 0
      ? myProjects.reduce((sum, p) => sum + (p.roiActual ?? 0), 0) / myProjects.length
      : 0;

  return (
    <div className="space-y-6">
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
            <h2 className="text-sm font-semibold text-white">待评估需求队列</h2>
            {evaluatingReqs.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "rgb(248,113,113)" }}
              >
                {evaluatingReqs.length} 条待处理
              </span>
            )}
          </div>

          {evaluatingReqs.length === 0 ? (
            <div
              className="rounded-lg border p-8 text-center"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              暂无待评估需求
            </div>
          ) : (
            <div className="space-y-3">
              {evaluatingReqs.map((req, idx) => (
                <div key={req.id} className="relative">
                  {idx === 0 && (
                    <span
                      className="absolute -top-1.5 -left-1.5 text-[9px] px-1.5 py-0.5 rounded font-bold z-10"
                      style={{ backgroundColor: "rgb(239,68,68)", color: "white" }}
                    >
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
            <h2 className="text-sm font-semibold text-white">我的项目</h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(59,130,246,0.1)",
                color: "rgb(96,165,250)",
              }}
            >
              {myProjects.length} 个
            </span>
          </div>

          {myProjects.length === 0 ? (
            <div
              className="rounded-lg border p-8 text-center"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              暂无分配项目
            </div>
          ) : (
            <div className="space-y-3">
              {myProjects.map((project) => {
                const status = PROJECT_STATUS_CONFIG[project.status];
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="rounded-lg border p-4 cursor-pointer transition-all"
                    style={{
                      borderColor: "hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white text-sm">{project.clientName}</div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {project.mediaPlatform} · {project.industry}
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-1 rounded-full font-medium whitespace-nowrap"
                        style={{ backgroundColor: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                    {project.roiActual !== undefined && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                          实际 ROI
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{
                            color: project.roiActual >= 1 ? "rgb(74,222,128)" : "rgb(248,113,113)",
                          }}
                        >
                          {project.roiActual.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
