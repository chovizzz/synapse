"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { Send, CheckSquare, Square, AlertCircle, TrendingUp } from "lucide-react";
import type { Project, Message, Task } from "@/types";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { getMessages, addMessage, getTasks } from "@/lib/store";
import { useRole } from "@/lib/role-context";
import { formatDate, generateId, formatCurrency } from "@/lib/utils";

const PROJECT_STATUS_LABEL: Record<string, string> = {
  STRATEGY: "策略制定",
  LAUNCHING: "启动投放",
  OPTIMIZING: "优化调整",
  REVIEWING: "复盘",
  COMPLETED: "已完成",
};

const PROJECT_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  STRATEGY: { bg: "rgba(59,130,246,0.1)", color: "rgb(96,165,250)" },
  LAUNCHING: { bg: "rgba(234,179,8,0.1)", color: "rgb(250,204,21)" },
  OPTIMIZING: { bg: "rgba(34,197,94,0.1)", color: "rgb(74,222,128)" },
  REVIEWING: { bg: "rgba(168,85,247,0.1)", color: "rgb(192,132,252)" },
  COMPLETED: { bg: "rgba(107,114,128,0.1)", color: "rgb(156,163,175)" },
};

const ROLE_TAG: Record<string, { label: string; color: string }> = {
  OPTIMIZER: { label: "优化师", color: "text-green-400" },
  BUSINESS: { label: "商务", color: "text-blue-400" },
  ADMIN: { label: "系统", color: "text-gray-400" },
};

function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  if (msg.type === "SYSTEM") {
    return (
      <div className="flex justify-center my-2">
        <span
          className="text-[11px] px-3 py-1 rounded-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          {msg.content}
        </span>
      </div>
    );
  }

  const roleTag = ROLE_TAG[msg.senderRole];

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-1 mb-3">
        <div
          className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white leading-relaxed"
          style={{ backgroundColor: "hsl(var(--primary))" }}
        >
          {msg.content}
        </div>
        <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
          {formatDate(msg.createdAt)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1 mb-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div
          className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ backgroundColor: "hsl(var(--secondary))" }}
        >
          {msg.senderName.slice(-1)}
        </div>
        <span className="text-xs text-white/70">{msg.senderName}</span>
        {roleTag && (
          <span className={`text-[10px] font-medium ${roleTag.color}`}>
            · {roleTag.label}
          </span>
        )}
      </div>
      <div
        className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed"
        style={{
          backgroundColor: "hsl(var(--secondary))",
          color: "hsl(var(--foreground))",
        }}
      >
        {msg.content}
      </div>
      <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
        {formatDate(msg.createdAt)}
      </span>
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string) => void;
}) {
  const isOverdue =
    task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <button
      onClick={() => onToggle(task.id)}
      className="w-full flex items-start gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-white/5"
    >
      {task.completed ? (
        <CheckSquare size={15} className="flex-shrink-0 mt-px text-green-400" />
      ) : (
        <Square
          size={15}
          className="flex-shrink-0 mt-px"
          style={{ color: "hsl(var(--muted-foreground))" }}
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs leading-snug ${task.completed ? "line-through" : "text-white"}`}
          style={task.completed ? { color: "hsl(var(--muted-foreground))" } : {}}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {task.assigneeName && (
            <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
              {task.assigneeName}
            </span>
          )}
          {isOverdue && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-400">
              <AlertCircle size={9} />
              逾期
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useRole();

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const proj = MOCK_PROJECTS.find((p) => p.id === id) ?? null;
    setProject(proj);
    setMessages(getMessages(id));
    setTasks(getTasks(id));
  }, [id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const msg: Message = {
      id: generateId(),
      projectId: id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: trimmed,
      type: "TEXT",
      createdAt: new Date().toISOString(),
    };

    addMessage(msg);
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  if (!project) {
    return (
      <div
        className="flex items-center justify-center h-64 text-sm"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        项目不存在
      </div>
    );
  }

  const statusCfg = PROJECT_STATUS_COLOR[project.status] ?? {
    bg: "rgba(107,114,128,0.1)",
    color: "rgb(156,163,175)",
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-4 h-full">
      {/* Top info bar */}
      <div
        className="rounded-xl border p-4"
        style={{
          borderColor: "hsl(var(--border))",
          backgroundColor: "hsl(var(--card))",
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold text-white">{project.clientName}</h1>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
              >
                {PROJECT_STATUS_LABEL[project.status] ?? project.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {[
                project.industry,
                project.mediaPlatform,
              ].map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "hsl(var(--secondary))",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            <div>
              <span>商务：</span>
              <span className="text-blue-400">{project.businessName}</span>
            </div>
            <div>
              <span>优化师：</span>
              <span className="text-green-400">{project.optimizerName}</span>
            </div>
            <div>创建于 {formatDate(project.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Main: left messages + right sidebar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start" style={{ minHeight: "400px", height: "calc(100vh - 280px)" }}>
        {/* ─── Message stream ─── */}
        <div
          className="w-full lg:flex-[60] min-w-0 flex flex-col rounded-xl border overflow-hidden"
          style={{
            height: "100%",
            minHeight: "300px",
            borderColor: "hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        >
          <div className="px-4 py-3 border-b text-xs font-medium text-white" style={{ borderColor: "hsl(var(--border))" }}>
            项目沟通
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.senderId === currentUser.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="px-4 py-3 border-t"
            style={{ borderColor: "hsl(var(--border))" }}
          >
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: "hsl(var(--secondary))" }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                rows={2}
                className="flex-1 resize-none bg-transparent outline-none text-sm text-white placeholder:text-white/30 leading-relaxed"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                style={{ backgroundColor: "hsl(var(--primary))" }}
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Right sidebar ─── */}
        <div className="w-full lg:flex-[40] min-w-0 space-y-3">
          {/* Task list */}
          <div
            className="rounded-xl border p-4"
            style={{
              borderColor: "hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                任务清单
              </h3>
              <span className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                {completedCount}/{tasks.length} 完成
              </span>
            </div>

            {/* Progress bar */}
            {tasks.length > 0 && (
              <div
                className="h-1 rounded-full mb-3 overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <motion.div
                  className="h-full rounded-full bg-green-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}

            <div className="space-y-0.5">
              {tasks.length === 0 ? (
                <p className="text-xs py-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  暂无任务
                </p>
              ) : (
                tasks.map((task) => (
                  <TaskItem key={task.id} task={task} onToggle={toggleTask} />
                ))
              )}
            </div>
          </div>

          {/* Campaign data summary */}
          {(project.budgetActual !== undefined || project.roiActual !== undefined) && (
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: "hsl(var(--border))",
                backgroundColor: "hsl(var(--card))",
              }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                投放数据摘要
              </h3>
              <div className="space-y-2.5">
                {project.budgetActual !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      累计花费
                    </span>
                    <span className="text-sm font-medium text-white">
                      {formatCurrency(project.budgetActual)}
                    </span>
                  </div>
                )}
                {project.roiActual !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      实际 ROI
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-white">
                        {project.roiActual.toFixed(2)}
                      </span>
                      <TrendingUp size={13} className="text-green-400" />
                    </div>
                  </div>
                )}
                {project.mediaPlatform && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      媒体平台
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      {project.mediaPlatform}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
