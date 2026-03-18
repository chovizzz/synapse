"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { AIChatMessage, StructuredRequirement, AIEvaluation } from "@/types";
import ReactMarkdown from "react-markdown";

interface Props {
  requirementData: StructuredRequirement;
  evaluationData: AIEvaluation;
}

const SUGGESTED_QUESTIONS = [
  "素材测试期预算怎么分配？",
  "ROI目标偏高，应该调整到多少？",
  "如果预算只有 $200/天，策略怎么变？",
  "第一周应该重点关注哪些指标？",
];

export default function AIChat({ requirementData, evaluationData }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: AIChatMessage = { role: "user", content: content.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          requirementData,
          evaluationData,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: json.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，AI 暂时无法回复，请重试。" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "网络错误，请检查连接后重试。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: open ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: "hsl(var(--primary))" }} />
          <span className="text-sm font-semibold text-white">继续与 AI 对话</span>
          {messages.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
            >
              {messages.filter((m) => m.role === "user").length} 轮对话
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {open ? "收起" : "展开"}
          </span>
          {open ? (
            <ChevronUp size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          ) : (
            <ChevronDown size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="border-t"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              {/* Suggested questions — show when no messages */}
              {messages.length === 0 && (
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs mb-2.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    快速发问：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                        style={{
                          backgroundColor: "hsl(var(--primary) / 0.1)",
                          color: "hsl(var(--primary))",
                          border: "1px solid hsl(var(--primary) / 0.2)",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 && (
                <div
                  className="max-h-[400px] overflow-y-auto px-4 py-3 space-y-4"
                  style={{ backgroundColor: "hsl(var(--background))" }}
                >
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                      {msg.role === "assistant" && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: "hsl(var(--primary) / 0.2)" }}
                        >
                          <Bot size={12} style={{ color: "hsl(var(--primary))" }} />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "rounded-tr-sm text-white"
                            : "rounded-tl-sm"
                        }`}
                        style={{
                          backgroundColor:
                            msg.role === "user"
                              ? "hsl(var(--primary))"
                              : "hsl(var(--card))",
                          color:
                            msg.role === "user"
                              ? "white"
                              : "hsl(var(--foreground))",
                          border:
                            msg.role === "assistant"
                              ? "1px solid hsl(var(--border))"
                              : "none",
                        }}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none text-sm">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {loading && (
                    <div className="flex justify-start gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "hsl(var(--primary) / 0.2)" }}
                      >
                        <Bot size={12} style={{ color: "hsl(var(--primary))" }} />
                      </div>
                      <div
                        className="rounded-2xl rounded-tl-sm px-4 py-3 border"
                        style={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Loader2 size={12} className="animate-spin" style={{ color: "hsl(var(--primary))" }} />
                          <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            AI 思考中…
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}

              {/* Input area */}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(input);
                      }
                    }}
                    placeholder="问 AI 任何策略问题，Enter 发送…"
                    rows={2}
                    disabled={loading}
                    className="flex-1 resize-none bg-transparent outline-none text-sm text-white placeholder:text-white/30 leading-relaxed disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  >
                    {loading ? (
                      <Loader2 size={13} className="animate-spin text-white" />
                    ) : (
                      <Send size={13} className="text-white" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] mt-1.5 text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                  AI 基于本需求数据和评估结论回答 · Enter 发送 · Shift+Enter 换行
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
