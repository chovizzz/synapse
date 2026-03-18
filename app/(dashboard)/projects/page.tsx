"use client";

import { useRouter } from "next/navigation";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { ProjectStatus } from "@/types";
import { SparklineChart } from "@/components/charts/SparklineChart";
import { cn } from "@/lib/utils";

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; tw: string }> = {
  STRATEGY: { label: "策略制定", tw: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400" },
  LAUNCHING: { label: "启动投放", tw: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  OPTIMIZING: { label: "优化调整", tw: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400" },
  REVIEWING: { label: "复盘中", tw: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" },
  COMPLETED: { label: "已完成", tw: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400" },
};

function generateSparklineData(projectId: string): number[] {
  const seed = projectId.charCodeAt(projectId.length - 1);
  return Array.from({ length: 7 }, (_, i) => {
    return Math.round(5000 + (seed * (i + 1) * 17) % 20000 + Math.sin(i * 0.9 + seed * 0.1) * 4000);
  });
}

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">项目看板</h2>
          <p className="text-xs mt-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
            共 {MOCK_PROJECTS.length} 个项目
          </p>
        </div>
      </div>

      {/* Project cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MOCK_PROJECTS.map((project) => {
          const status = PROJECT_STATUS_CONFIG[project.status];
          const sparkData = generateSparklineData(project.id);

          return (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-5 cursor-pointer transition-all shadow-sm hover:shadow-md hover:shadow-slate-100 dark:hover:shadow-none hover:border-indigo-200 dark:hover:border-[hsl(var(--primary)/0.4)]"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{project.clientName}</h3>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", status.tw)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="text-xs mt-1 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                    {project.industry}
                  </div>
                </div>

                {/* Right: ROI + Sparkline */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {project.roiActual !== undefined && (
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 dark:text-[hsl(var(--muted-foreground))] font-medium">
                        实际 ROI
                      </div>
                      <div className={cn(
                        "text-xl font-bold mt-0.5",
                        project.roiActual >= 1 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                      )}>
                        {project.roiActual.toFixed(2)}x
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-400 dark:text-[hsl(var(--muted-foreground))]">近7日消耗</span>
                    <SparklineChart
                      data={sparkData}
                      color="#6366f1"
                      width={72}
                      height={32}
                    />
                  </div>
                </div>
              </div>

              {/* Meta info */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[hsl(var(--border))] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-slate-400 dark:text-[hsl(var(--muted-foreground))] mb-1 font-medium">媒体平台</div>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-600 dark:text-[hsl(var(--foreground))]">
                    {project.mediaPlatform}
                  </span>
                </div>
                <div>
                  <div className="text-slate-400 dark:text-[hsl(var(--muted-foreground))] mb-1 font-medium">商务</div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium">{project.businessName}</div>
                </div>
                <div>
                  <div className="text-slate-400 dark:text-[hsl(var(--muted-foreground))] mb-1 font-medium">优化师</div>
                  <div className="text-green-600 dark:text-green-400 font-medium">{project.optimizerName}</div>
                </div>
                <div>
                  <div className="text-slate-400 dark:text-[hsl(var(--muted-foreground))] mb-1 font-medium">启动时间</div>
                  <div className="text-slate-600 dark:text-[hsl(var(--foreground))]">{formatDate(project.createdAt)}</div>
                </div>
              </div>

              {project.budgetActual !== undefined && (
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 dark:text-[hsl(var(--muted-foreground))]">累计消耗</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(project.budgetActual)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
