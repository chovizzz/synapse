"use client";

import { useRouter } from "next/navigation";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; color: string }> = {
  STRATEGY: { label: "策略制定", bg: "rgba(168,85,247,0.1)", color: "rgb(192,132,252)" },
  LAUNCHING: { label: "启动投放", bg: "rgba(59,130,246,0.1)", color: "rgb(96,165,250)" },
  OPTIMIZING: { label: "优化调整", bg: "rgba(234,179,8,0.1)", color: "rgb(250,204,21)" },
  REVIEWING: { label: "复盘中", bg: "rgba(249,115,22,0.1)", color: "rgb(251,146,60)" },
  COMPLETED: { label: "已完成", bg: "rgba(107,114,128,0.1)", color: "rgb(156,163,175)" },
};

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">项目看板</h2>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            共 {MOCK_PROJECTS.length} 个项目
          </p>
        </div>
      </div>

      {/* Project cards grid */}
      <div className="grid grid-cols-1 gap-4">
        {MOCK_PROJECTS.map((project) => {
          const status = PROJECT_STATUS_CONFIG[project.status];
          return (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="rounded-xl border p-5 cursor-pointer transition-all"
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
              <div className="flex items-start justify-between gap-4">
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{project.clientName}</h3>
                    <span
                      className="text-[10px] px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {project.industry}
                  </div>
                </div>

                {/* ROI badge */}
                {project.roiActual !== undefined && (
                  <div className="text-right">
                    <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      实际 ROI
                    </div>
                    <div
                      className="text-xl font-bold mt-0.5"
                      style={{
                        color: project.roiActual >= 1 ? "rgb(74,222,128)" : "rgb(248,113,113)",
                      }}
                    >
                      {project.roiActual.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div
                className="mt-4 pt-4 border-t grid grid-cols-4 gap-4 text-sm"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                <div>
                  <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    媒体平台
                  </div>
                  <div
                    className="text-xs px-2 py-1 rounded inline-block font-medium"
                    style={{
                      backgroundColor: "hsl(var(--secondary))",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {project.mediaPlatform}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    商务
                  </div>
                  <div className="text-xs text-white">{project.businessName}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    优化师
                  </div>
                  <div className="text-xs text-white">{project.optimizerName}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    启动时间
                  </div>
                  <div className="text-xs text-white">{formatDate(project.createdAt)}</div>
                </div>
              </div>

              {project.budgetActual !== undefined && (
                <div
                  className="mt-3 flex items-center gap-1 text-xs"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <span>累计消耗</span>
                  <span className="text-white font-medium">${project.budgetActual.toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
