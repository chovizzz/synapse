"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { MOCK_REQUIREMENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "首页看板",
  "/requirements": "需求管理",
  "/projects": "项目看板",
  "/knowledge": "经验库",
};

export function TopBar() {
  const pathname = usePathname();
  const { currentUser, setRole } = useRole();

  const title = PAGE_TITLES[pathname] ?? "首页看板";
  const pendingCount = MOCK_REQUIREMENTS.filter(
    (r) => r.status === "PENDING" || r.status === "EVALUATING"
  ).length;

  return (
    <header
      className="h-16 flex items-center px-6 border-b flex-shrink-0"
      style={{
        backgroundColor: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Page title */}
      <h1 className="text-lg font-semibold text-white flex-1">{title}</h1>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Role switch */}
        <div
          className="flex items-center gap-1 rounded-lg p-1"
          style={{ backgroundColor: "hsl(var(--background))" }}
        >
          <button
            onClick={() => setRole("BUSINESS")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              currentUser.role === "BUSINESS"
                ? "text-white"
                : "border hover:text-white"
            )}
            style={
              currentUser.role === "BUSINESS"
                ? { backgroundColor: "hsl(var(--primary))" }
                : {
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--muted-foreground))",
                  }
            }
          >
            商务视角
          </button>
          <button
            onClick={() => setRole("OPTIMIZER")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              currentUser.role === "OPTIMIZER"
                ? "text-white"
                : "border hover:text-white"
            )}
            style={
              currentUser.role === "OPTIMIZER"
                ? { backgroundColor: "hsl(var(--primary))" }
                : {
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--muted-foreground))",
                  }
            }
          >
            优化师视角
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6" style={{ backgroundColor: "hsl(var(--border))" }} />

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
        >
          <Bell size={18} style={{ color: "hsl(var(--muted-foreground))" }} />
          {pendingCount > 0 && (
            <span
              className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              {pendingCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.2)",
              color: "hsl(var(--primary))",
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium text-white leading-none">{currentUser.name}</div>
            <div
              className="text-[10px] mt-0.5"
              style={
                currentUser.role === "BUSINESS"
                  ? { color: "rgb(96,165,250)" }
                  : { color: "rgb(74,222,128)" }
              }
            >
              {currentUser.role === "BUSINESS" ? "商务" : "优化师"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
