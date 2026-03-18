"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, CheckSquare, Square, AlertCircle, TrendingUp, BarChart2,
  FileText, MessageSquare, X, Loader2, Download
} from "lucide-react";
import type { Project, Message, Task } from "@/types";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { generateAccountData } from "@/lib/account-data";
import { getMessages, addMessage, getTasks } from "@/lib/store";
import { useRole } from "@/lib/role-context";
import { generateId, formatCurrency, formatDate } from "@/lib/utils";
import { SpendRoiChart } from "@/components/charts/SpendRoiChart";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "刚刚";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

const PROJECT_STATUS_LABEL: Record<string, string> = {
  STRATEGY: "策略制定",
  LAUNCHING: "启动投放",
  OPTIMIZING: "优化调整",
  REVIEWING: "复盘",
  COMPLETED: "已完成",
};

const PROJECT_STATUS_TW: Record<string, string> = {
  STRATEGY: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  LAUNCHING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  OPTIMIZING: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  REVIEWING: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  COMPLETED: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
};

const ROLE_TAG: Record<string, { label: string; tw: string }> = {
  OPTIMIZER: { label: "优化师", tw: "text-green-600 dark:text-green-400" },
  BUSINESS: { label: "商务", tw: "text-blue-600 dark:text-blue-400" },
  ADMIN: { label: "系统", tw: "text-slate-400" },
};

type Tab = "chat" | "data" | "report";

function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  if (msg.type === "SYSTEM") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
          {msg.content}
        </span>
      </div>
    );
  }

  const roleTag = ROLE_TAG[msg.senderRole];

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-1 mb-3">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white leading-relaxed bg-indigo-600 dark:bg-[hsl(var(--primary))]">
          {msg.content}
        </div>
        <span className="text-[10px] text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
          {timeAgo(msg.createdAt)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1 mb-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-slate-300 dark:bg-[hsl(var(--secondary))]">
          {msg.senderName.slice(-1)}
        </div>
        <span className="text-xs text-slate-600 dark:text-white/70">{msg.senderName}</span>
        {roleTag && <span className={`text-[10px] font-medium ${roleTag.tw}`}>· {roleTag.label}</span>}
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-800 dark:text-[hsl(var(--foreground))]">
        {msg.content}
      </div>
      <span className="text-[10px] text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
        {timeAgo(msg.createdAt)}
      </span>
    </div>
  );
}

function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <button
      onClick={() => onToggle(task.id)}
      className="w-full flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
    >
      {task.completed ? (
        <CheckSquare size={15} className="flex-shrink-0 mt-px text-green-500" />
      ) : (
        <Square size={15} className="flex-shrink-0 mt-px text-slate-300 dark:text-[hsl(var(--muted-foreground))]" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-snug ${task.completed ? "line-through text-slate-400 dark:text-[hsl(var(--muted-foreground))]" : "text-slate-800 dark:text-white"}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {task.assigneeName && (
            <span className="text-[10px] text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
              {task.assigneeName}
            </span>
          )}
          {isOverdue && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-500">
              <AlertCircle size={9} />
              逾期
            </span>
          )}
        </div>
      </div>
    </button>
  );
}


function DataAnalysisTab({ project }: { project: Project }) {
  const accounts = generateAccountData(project.id);
  const totalSpend = accounts.reduce((s, a) => s + a.spend, 0);
  const avgRoi = accounts.reduce((s, a) => s + a.roi, 0) / accounts.length;

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "累计消耗", value: formatCurrency(totalSpend), color: "text-indigo-600 dark:text-indigo-400" },
          { label: "平均 ROI", value: `${avgRoi.toFixed(2)}x`, color: avgRoi >= 1 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400" },
          { label: "总转化数", value: accounts.reduce((s, a) => s + a.conversions, 0).toLocaleString(), color: "text-amber-600 dark:text-amber-400" },
          { label: "平均 CTR", value: `${(accounts.reduce((s, a) => s + a.ctr, 0) / accounts.length).toFixed(1)}%`, color: "text-purple-600 dark:text-purple-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-4 shadow-sm">
            <div className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))] font-medium mb-1">{kpi.label}</div>
            <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">投放趋势</h3>
        <SpendRoiChart projectId={project.id} />
      </div>

      {/* Account table */}
      <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[hsl(var(--border))]">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">账户明细</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[hsl(var(--border))]">
                {["平台", "账号", "消耗", "ROI", "CTR", "转化数"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-[hsl(var(--border))] hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-white text-sm">{acc.platform}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-[hsl(var(--muted-foreground))] text-xs">{acc.account}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{formatCurrency(acc.spend)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "font-semibold",
                      acc.roi >= 1.5 ? "text-green-600 dark:text-green-400" : acc.roi >= 1 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400"
                    )}>
                      {acc.roi}x
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-[hsl(var(--foreground))]">{acc.ctr}%</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-[hsl(var(--foreground))]">{acc.conversions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AIReportModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [reportText, setReportText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const accounts = generateAccountData(project.id);
  const totalSpend = accounts.reduce((s, a) => s + a.spend, 0);
  const avgRoi = accounts.reduce((s, a) => s + a.roi, 0) / accounts.length;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `请为以下广告投放项目生成一份结构化复盘报告（中文，约300字）：
客户：${project.clientName}
媒体平台：${project.mediaPlatform}
行业：${project.industry}
累计消耗：${formatCurrency(totalSpend)}
平均ROI：${avgRoi.toFixed(2)}x
项目状态：${PROJECT_STATUS_LABEL[project.status]}
优化师：${project.optimizerName}

报告结构：执行概述 → 核心数据 → 亮点与不足 → 下阶段优化建议`,
          }],
          systemPrompt: "你是一位资深广告投放分析师，擅长撰写专业的广告复盘报告。",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReportText(data.message);
        setGenerated(true);
      } else {
        setReportText(`【${project.clientName} 投放复盘报告】\n\n执行概述：本次投放累计消耗 ${formatCurrency(totalSpend)}，整体 ROI 达到 ${avgRoi.toFixed(2)}x。\n\n核心数据：共覆盖 ${accounts.length} 个媒体账户，总转化数 ${accounts.reduce((s, a) => s + a.conversions, 0)} 次，平均 CTR ${(accounts.reduce((s, a) => s + a.ctr, 0) / accounts.length).toFixed(1)}%。\n\n亮点：整体 ROI 超出预期，${accounts.find(a => a.roi === Math.max(...accounts.map(x => x.roi)))?.platform} 表现最佳。\n\n优化建议：建议下阶段重点加大 ROI 表现最优媒体的预算，同时对 CTR 较低的广告素材进行替换迭代。`);
        setGenerated(true);
      }
    } catch {
      setReportText("AI 生成失败，请检查网络或 API Key 配置后重试。");
      setGenerated(true);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[hsl(var(--border))] bg-indigo-600 dark:bg-indigo-900/40">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-white" />
            <h2 className="font-semibold text-white">AI 投放报告 — {project.clientName}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Left: Charts */}
          <div className="lg:w-2/5 p-5 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-[hsl(var(--border))] overflow-y-auto bg-slate-50 dark:bg-[hsl(var(--background))]">
            <h3 className="text-xs font-semibold text-slate-400 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-4">数据概览</h3>
            <div className="space-y-3 mb-4">
              {[
                { label: "累计消耗", value: formatCurrency(totalSpend), color: "text-indigo-600 dark:text-indigo-400" },
                { label: "平均 ROI", value: `${avgRoi.toFixed(2)}x`, color: "text-green-600 dark:text-green-400" },
                { label: "总转化数", value: accounts.reduce((s, a) => s + a.conversions, 0).toLocaleString(), color: "text-amber-600 dark:text-amber-400" },
              ].map((kpi) => (
                <div key={kpi.label} className="flex items-center justify-between rounded-xl bg-white dark:bg-[hsl(var(--card))] border border-slate-200 dark:border-[hsl(var(--border))] px-4 py-3">
                  <span className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">{kpi.label}</span>
                  <span className={`font-bold ${kpi.color}`}>{kpi.value}</span>
                </div>
              ))}
            </div>
            <SpendRoiChart projectId={project.id} />
          </div>

          {/* Right: Report text */}
          <div className="flex-1 flex flex-col p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider">AI 生成报告</h3>
              {!generated && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-[hsl(var(--primary))] disabled:opacity-50 transition-all"
                >
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  {generating ? "生成中…" : "AI 生成报告"}
                </button>
              )}
            </div>

            {!generated ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <FileText size={28} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                    点击右上角按钮，AI 将根据项目数据生成专业复盘报告
                  </p>
                </div>
              </div>
            ) : (
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="flex-1 resize-none rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-slate-50 dark:bg-[hsl(var(--secondary))] text-slate-800 dark:text-[hsl(var(--foreground))] text-sm leading-relaxed p-4 outline-none focus:border-indigo-300 dark:focus:border-[hsl(var(--primary)/0.5)] transition-colors"
                placeholder="报告内容（可编辑）…"
              />
            )}

            {generated && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-[hsl(var(--muted-foreground))] border border-slate-200 dark:border-[hsl(var(--border))] hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  {generating ? <Loader2 size={13} className="animate-spin" /> : null}
                  重新生成
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${project.clientName}_投放报告.txt`;
                    a.click();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-[hsl(var(--primary))] transition-all ml-auto"
                >
                  <Download size={13} />
                  导出报告
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useRole();

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [showReport, setShowReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const proj = MOCK_PROJECTS.find((p) => p.id === id) ?? null;
    setProject(proj);
    setMessages(getMessages(id));
    setTasks(getTasks(id));
  }, [id]);

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: messages.length > 1 ? "smooth" : "instant" });
    }
  }, [messages, activeTab]);

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
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)));
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
        项目不存在
      </div>
    );
  }

  const statusTw = PROJECT_STATUS_TW[project.status] ?? "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400";
  const completedCount = tasks.filter((t) => t.completed).length;

  const TABS = [
    { key: "chat" as Tab, label: "项目沟通", icon: MessageSquare },
    { key: "data" as Tab, label: "数据分析", icon: BarChart2 },
  ];

  return (
    <div className="space-y-4 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top info bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold text-slate-900 dark:text-white">{project.clientName}</h1>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", statusTw)}>
                {PROJECT_STATUS_LABEL[project.status] ?? project.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {[project.industry, project.mediaPlatform].map((tag) => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-500 dark:text-[hsl(var(--muted-foreground))]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
            <div>商务：<span className="text-blue-600 dark:text-blue-400">{project.businessName}</span></div>
            <div>优化师：<span className="text-green-600 dark:text-green-400">{project.optimizerName}</span></div>
            <div>创建于 {formatDate(project.createdAt)}</div>
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-[hsl(var(--primary))] transition-all shadow-sm"
            >
              <FileText size={12} />
              生成报告
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-[hsl(var(--secondary))] w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key
                ? "bg-white dark:bg-[hsl(var(--card))] text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:text-slate-700 dark:hover:text-white"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "chat" && (
        <div className="flex flex-col lg:flex-row gap-4 items-start" style={{ minHeight: "400px", height: "calc(100vh - 340px)" }}>
          {/* Message stream */}
          <div className="w-full lg:flex-[60] min-w-0 flex flex-col rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] shadow-sm overflow-hidden" style={{ height: "100%", minHeight: "300px" }}>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-[hsl(var(--border))] text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">
              项目沟通
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === currentUser.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-4 py-3 border-t border-slate-100 dark:border-[hsl(var(--border))]">
              <div className="flex items-end gap-2 rounded-xl px-3 py-2 bg-slate-50 dark:bg-[hsl(var(--secondary))]">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                  rows={2}
                  className="flex-1 resize-none bg-transparent outline-none text-sm text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/30 leading-relaxed"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 bg-indigo-600 dark:bg-[hsl(var(--primary))]"
                >
                  <Send size={14} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:flex-[40] min-w-0 space-y-3">
            {/* Task list */}
            <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                  任务清单
                </h3>
                <span className="text-[11px] text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                  {completedCount}/{tasks.length} 完成
                </span>
              </div>

              {tasks.length > 0 && (
                <div className="h-1 rounded-full mb-3 overflow-hidden bg-slate-100 dark:bg-white/8">
                  <motion.div
                    className="h-full rounded-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              )}

              <div className="space-y-0.5">
                {tasks.length === 0 ? (
                  <p className="text-xs py-2 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">暂无任务</p>
                ) : (
                  tasks.map((task) => <TaskItem key={task.id} task={task} onToggle={toggleTask} />)
                )}
              </div>
            </div>

            {/* Campaign data */}
            {(project.budgetActual !== undefined || project.roiActual !== undefined) && (
              <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                  投放数据摘要
                </h3>
                <div className="space-y-2.5">
                  {project.budgetActual !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">累计花费</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(project.budgetActual)}</span>
                    </div>
                  )}
                  {project.roiActual !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">实际 ROI</span>
                      <div className="flex items-center gap-1">
                        <span className={cn("text-sm font-semibold", project.roiActual >= 1 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}>
                          {project.roiActual.toFixed(2)}
                        </span>
                        <TrendingUp size={13} className="text-green-500" />
                      </div>
                    </div>
                  )}
                  {project.mediaPlatform && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">媒体平台</span>
                      <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[hsl(var(--secondary))] text-slate-600 dark:text-[hsl(var(--foreground))]">
                        {project.mediaPlatform}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "data" && <DataAnalysisTab project={project} />}

      {/* AI Report Modal */}
      <AnimatePresence>
        {showReport && <AIReportModal project={project} onClose={() => setShowReport(false)} />}
      </AnimatePresence>
    </div>
  );
}
