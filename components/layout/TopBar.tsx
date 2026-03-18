"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, LogOut } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { useState } from "react";
import NotificationPanel from "@/components/layout/NotificationPanel";

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
  const { currentUser, logout } = useRole();
  const [notifOpen, setNotifOpen] = useState(false);

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path)
  )?.[1] ?? "首页看板";

  return (
    <header
      className="h-14 sm:h-16 flex items-center px-3 sm:px-6 border-b flex-shrink-0 gap-2 relative"
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
        {/* Role badge */}
        <span
          className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full font-medium"
          style={
            currentUser.role === "BUSINESS"
              ? { backgroundColor: "rgba(59,130,246,0.12)", color: "rgb(96,165,250)" }
              : { backgroundColor: "rgba(34,197,94,0.12)", color: "rgb(74,222,128)" }
          }
        >
          {currentUser.role === "BUSINESS" ? "商务" : "优化师"}
        </span>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6" style={{ backgroundColor: "hsl(var(--border))" }} />

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
          >
            <Bell size={18} style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
          <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

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
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
          title="退出登录"
        >
          <LogOut size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
        </button>
      </div>
    </header>
  );
}
