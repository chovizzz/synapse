"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/store";
import type { AppNotification } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

const TYPE_ICON: Record<AppNotification["type"], string> = {
  NEW_REQUIREMENT: "📋",
  EVAL_DONE: "🤖",
  FOLLOW_UP: "💬",
  ACCEPTED: "✅",
  REJECTED: "❌",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ open, onClose }: Props) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (open) setNotifications(getNotifications());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (n: AppNotification) => {
    markNotificationRead(n.id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
    if (n.link) {
      router.push(n.link);
      onClose();
    }
  };

  const handleMarkAll = () => {
    markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <>
      {/* Badge on bell */}
      {unreadCount > 0 && (
        <span
          className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center pointer-events-none"
          style={{ backgroundColor: "hsl(var(--primary))" }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border shadow-xl z-50 overflow-hidden"
            style={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: "hsl(var(--primary))" }} />
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">通知</span>
                {unreadCount > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  >
                    {unreadCount} 未读
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs transition-colors hover:text-[hsl(var(--foreground))]"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <CheckCheck size={13} />
                  全部已读
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div
                  className="py-10 text-center text-sm"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  暂无通知
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[hsl(var(--accent))] border-b last:border-b-0"
                    style={{
                      borderColor: "hsl(var(--border))",
                      backgroundColor: n.read ? "transparent" : "hsl(var(--primary) / 0.04)",
                    }}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {TYPE_ICON[n.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-sm font-medium leading-snug ${n.read ? "" : "text-[hsl(var(--foreground))]"}`}
                          style={n.read ? { color: "hsl(var(--muted-foreground))" } : {}}
                        >
                          {n.title}
                        </span>
                        {!n.read && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: "hsl(var(--primary))" }}
                          />
                        )}
                      </div>
                      <p
                        className="text-xs mt-0.5 leading-relaxed line-clamp-2"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {n.body}
                      </p>
                      <span
                        className="text-[11px] mt-1 block"
                        style={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div
                className="px-4 py-2.5 border-t text-center"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                <button
                  className="text-xs transition-colors hover:text-[hsl(var(--foreground))]"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                  onClick={() => { handleMarkAll(); onClose(); }}
                >
                  <Check size={11} className="inline mr-1" />
                  全部标为已读并关闭
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
