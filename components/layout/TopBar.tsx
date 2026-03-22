"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, LogOut } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { useState, useEffect } from "react";
import NotificationPanel from "@/components/layout/NotificationPanel";
import { getNotifications, SYNAPSE_NOTIFICATIONS_EVENT } from "@/lib/store";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const { currentUser, logout } = useRole();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const sync = () => setUnreadCount(getNotifications().filter((n) => !n.read).length);
    sync();
    window.addEventListener(SYNAPSE_NOTIFICATIONS_EVENT, sync);
    return () => window.removeEventListener(SYNAPSE_NOTIFICATIONS_EVENT, sync);
  }, []);

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path)
  )?.[1] ?? "首页看板";

  return (
    <header className="h-14 sm:h-16 flex items-center px-3 sm:px-6 border-b flex-shrink-0 gap-2 relative bg-white dark:bg-[hsl(var(--card))] border-slate-200 dark:border-[hsl(var(--border))] shadow-sm dark:shadow-none">
      {/* Hamburger menu — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex-shrink-0"
        aria-label="打开菜单"
      >
        <Menu size={20} className="text-slate-400 dark:text-[hsl(var(--muted-foreground))]" />
      </button>

      {/* Page title */}
      <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex-1 truncate">{title}</h1>

      {/* Right section */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Role badge */}
        <span
          className={cn(
            "hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full font-medium",
            currentUser.role === "BUSINESS"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/12 dark:text-blue-400"
              : "bg-green-100 text-green-700 dark:bg-green-500/12 dark:text-green-400"
          )}
        >
          {currentUser.role === "BUSINESS" ? "商务" : "优化师"}
        </span>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-[hsl(var(--border))]" />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
            aria-label="通知"
          >
            <Bell size={18} className="text-slate-400 dark:text-[hsl(var(--muted-foreground))]" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center pointer-events-none"
                style={{ backgroundColor: "hsl(var(--primary))" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none dark:bg-[hsl(var(--primary)/0.2)] dark:text-[hsl(var(--primary))]">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-900 dark:text-white leading-none">{currentUser.name}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
          title="退出登录"
        >
          <LogOut size={16} className="text-slate-400 dark:text-[hsl(var(--muted-foreground))]" />
        </button>
      </div>
    </header>
  );
}
