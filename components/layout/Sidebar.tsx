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
    <aside
      className="w-[240px] h-full flex flex-col flex-shrink-0 border-r"
      style={{
        backgroundColor: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
      }}
    >
      {/* Logo + close button */}
      <div className="p-6 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "hsl(var(--primary))" }}
        >
          <div className="w-3 h-3 rounded-full bg-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-lg leading-none">Synapse</div>
          <div className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            广告协作平台
          </div>
        </div>
        {/* Close button — only shown on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="关闭菜单"
          >
            <X size={18} style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "text-[hsl(var(--primary))]"
                  : "hover:text-white"
              )}
              style={
                isActive
                  ? { backgroundColor: "hsl(var(--primary) / 0.15)" }
                  : { color: "hsl(var(--muted-foreground))" }
              }
              onMouseEnter={!isActive ? (e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
              } : undefined}
              onMouseLeave={!isActive ? (e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "";
              } : undefined}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.2)",
              color: "hsl(var(--primary))",
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
            <span
              className="inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5"
              style={
                currentUser.role === "BUSINESS"
                  ? { backgroundColor: "rgba(59,130,246,0.1)", color: "rgb(96,165,250)" }
                  : { backgroundColor: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)" }
              }
            >
              {currentUser.role === "BUSINESS" ? "商务" : "优化师"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
