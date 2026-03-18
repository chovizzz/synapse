"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { MOCK_REQUIREMENTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "首页看板",
  "/requirements": "需求管理",
  "/projects": "项目看板",
  "/knowledge": "经验库",
};

interface TopBarProps {
  onMenuToggle?: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const { currentUser, setRole } = useRole();

  const title = PAGE_TITLES[pathname] ?? "首页看板";
  const pendingCount = MOCK_REQUIREMENTS.filter(
    (r) => r.status === "PENDING" || r.status === "EVALUATING"
  ).length;

  return (
    <header
      className="h-14 sm:h-16 flex items-center px-3 sm:px-6 border-b flex-shrink-0 gap-2"
      style={{
        backgroundColor: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Hamburger menu — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
        aria-label="打开菜单"
      >
        <Menu size={20} style={{ color: "hsl(var(--muted-foreground))" }} />
      </button>

      {/* Page title */}
      <h1 className="text-base sm:text-lg font-semibold text-white flex-1 truncate">{title}</h1>

      {/* Right section */}
      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        {/* Role switch — hidden on very small screens, shown sm+ */}
        <div
          className="hidden sm:flex items-center gap-1 rounded-lg p-1"
          style={{ backgroundColor: "hsl(var(--background))" }}
        >
          <button
            onClick={() => setRole("BUSINESS")}
            className={cn(
              "px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all",
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
            商务
          </button>
          <button
            onClick={() => setRole("OPTIMIZER")}
            className={cn(
              "px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all",
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
            优化师
          </button>
        </div>

        {/* Mobile role toggle (compact) */}
        <button
          onClick={() => setRole(currentUser.role === "BUSINESS" ? "OPTIMIZER" : "BUSINESS")}
          className="sm:hidden px-2 py-1 rounded-md text-xs font-medium text-white transition-all flex-shrink-0"
          style={{ backgroundColor: "hsl(var(--primary))" }}
        >
          {currentUser.role === "BUSINESS" ? "商务" : "优化师"}
        </button>

        {/* Divider — desktop only */}
        <div className="hidden sm:block w-px h-6" style={{ backgroundColor: "hsl(var(--border))" }} />

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg transition-colors hover:bg-white/5">
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

        {/* User avatar + name */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.2)",
              color: "hsl(var(--primary))",
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
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
