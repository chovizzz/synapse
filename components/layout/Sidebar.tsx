"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Kanban, BookOpen, X } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "首页看板", icon: LayoutDashboard, href: "/" },
  { label: "需求管理", icon: FileText, href: "/requirements" },
  { label: "项目看板", icon: Kanban, href: "/projects" },
  { label: "经验库", icon: BookOpen, href: "/knowledge" },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useRole();

  return (
    <aside className="w-[240px] h-full flex flex-col flex-shrink-0 border-r bg-white dark:bg-[hsl(var(--card))] border-slate-200 dark:border-[hsl(var(--border))]">
      {/* Logo + close button */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-600 dark:bg-[hsl(var(--primary))]">
          <div className="w-3 h-3 rounded-full bg-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-white text-lg leading-none">Synapse</div>
          <div className="text-[10px] mt-0.5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
            广告协作平台
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="关闭菜单"
          >
            <X size={18} className="text-slate-400 dark:text-[hsl(var(--muted-foreground))]" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-[hsl(var(--primary)/0.15)] dark:text-[hsl(var(--primary))]"
                  : "text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-slate-200 dark:border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none dark:bg-[hsl(var(--primary)/0.2)] dark:text-[hsl(var(--primary))]">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{currentUser.name}</div>
            <span
              className={cn(
                "inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5",
                currentUser.role === "BUSINESS"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                  : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
              )}
            >
              {currentUser.role === "BUSINESS" ? "商务" : "优化师"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
