"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Loader2, Bot, Sparkles, X, RefreshCw } from "lucide-react";
import type { AIChatMessage, StructuredRequirement, AIEvaluation } from "@/types";
import ReactMarkdown from "react-markdown";

// 触发重新评估的关键词
const REEVAL_KEYWORDS = ["重新评估", "重新打分", "更新评估", "重新生成", "重新计算", "重估"];

interface Props {
  requirementData: StructuredRequirement;
  evaluationData: AIEvaluation | undefined;
  messages: AIChatMessage[];
  onMessagesChange: (msgs: AIChatMessage[]) => void;
  loading: boolean;
  onLoadingChange: (v: boolean) => void;
  onReEvaluate: () => void;
  isReEvaluating: boolean;
}

const SUGGESTED_QUESTIONS = [
  "素材测试期预算怎么分配？",
  "ROI目标偏高，应该调整到多少？",
  "如果预算只有 $200/天，策略怎么变？",
  "第一周应该重点关注哪些指标？",
];

export default function AIChat({
  requirementData,
  evaluationData,
  messages,
  onMessagesChange,
  loading,
  onLoadingChange,
  onReEvaluate,
  isReEvaluating,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  // 流式输出中的内容（追加中）
  const [streamingContent, setStreamingContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: AIChatMessage = { role: "user", content: content.trim() };
    const nextMessages = [...messages, userMsg];
    onMessagesChange(nextMessages);
    setInputValue("");
    onLoadingChange(true);
    setStreamingContent("");

    // 检查关键词，决定完成后是否触发重新评估
    const shouldReEval = REEVAL_KEYWORDS.some((kw) => content.includes(kw));

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: nextMessages,
          requirementData,
          evaluationData,
        }),
      });

      if (!res.ok || !res.body) {
        onMessagesChange([...nextMessages, { role: "assistant", content: "抱歉，AI 暂时无法回复，请重试。" }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            // 流结束，写入 messages
            onMessagesChange([...nextMessages, { role: "assistant", content: fullContent || "（无内容）" }]);
            setStreamingContent("");
            if (shouldReEval) onReEvaluate();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              onMessagesChange([...nextMessages, { role: "assistant", content: parsed.error }]);
              setStreamingContent("");
              return;
            }
            if (parsed.chunk) {
              fullContent += parsed.chunk;
              setStreamingContent(fullContent);
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      // 若没收到 [DONE] 但 reader 结束了（正常情况 fallback）
      if (fullContent) {
        onMessagesChange([...nextMessages, { role: "assistant", content: fullContent }]);
        setStreamingContent("");
        if (shouldReEval) onReEvaluate();
      }
    } catch (err) {
      const isAbort = (err as Error)?.name === "AbortError";
      setStreamingContent("");
      if (isAbort) {
        onMessagesChange([...nextMessages, { role: "assistant", content: "已取消" }]);
      } else {
        onMessagesChange([...nextMessages, { role: "assistant", content: "网络错误，请检查连接后重试。" }]);
      }
    } finally {
      onLoadingChange(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  // 渲染消息列表（最后一条 assistant 消息若正在流式则用 streamingContent）
  const displayMessages: AIChatMessage[] = loading && streamingContent
    ? [...messages, { role: "assistant" as const, content: streamingContent }]
    : messages;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: "hsl(var(--border))",
        backgroundColor: "hsl(var(--card))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: "hsl(var(--primary))" }} />
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">AI 策略对话</span>
          {messages.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
            >
              {messages.filter((m) => m.role === "user").length} 轮
            </span>
          )}
        </div>
        <button
          onClick={onReEvaluate}
          disabled={isReEvaluating || loading || !evaluationData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "hsl(var(--primary) / 0.1)",
            color: "hsl(var(--primary))",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          {isReEvaluating ? (
            <><Loader2 size={11} className="animate-spin" />重新评估中…</>
          ) : (
            <><RefreshCw size={11} />重新生成评估</>
          )}
        </button>
      </div>

      {/* Suggested questions — show when no messages */}
      {messages.length === 0 && !loading && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs mb-2.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            快速发问：
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80 disabled:opacity-40"
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
      {(displayMessages.length > 0) && (
        <div
          className="max-h-[440px] overflow-y-auto px-4 py-3 space-y-4"
          style={{ backgroundColor: "hsl(var(--background))" }}
        >
          {displayMessages.map((msg, idx) => {
            const isStreamingMsg = loading && idx === displayMessages.length - 1 && msg.role === "assistant" && !!streamingContent;
            return (
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
                    msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                  }`}
                  style={{
                    backgroundColor: msg.role === "user" ? "hsl(var(--primary))" : "hsl(var(--card))",
                    color: msg.role === "user" ? "white" : "hsl(var(--foreground))",
                    border: msg.role === "assistant" ? "1px solid hsl(var(--border))" : "none",
                  }}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-sm text-[hsl(var(--foreground))]">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {isStreamingMsg && (
                        <span
                          className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                          style={{ backgroundColor: "hsl(var(--primary))" }}
                        />
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading spinner — only shown when stream hasn't started yet */}
          {loading && !streamingContent && (
            <div className="flex justify-start gap-2 items-center">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "hsl(var(--primary) / 0.2)" }}
              >
                <Bot size={12} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3 border flex items-center gap-3"
                style={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
              >
                <div className="flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" style={{ color: "hsl(var(--primary))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    AI 思考中…
                  </span>
                </div>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md transition-all hover:opacity-80"
                  style={{
                    backgroundColor: "hsl(var(--destructive) / 0.1)",
                    color: "hsl(var(--destructive))",
                    border: "1px solid hsl(var(--destructive) / 0.2)",
                  }}
                >
                  <X size={10} />
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Cancel button while streaming */}
          {loading && streamingContent && (
            <div className="flex justify-end">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                style={{
                  backgroundColor: "hsl(var(--destructive) / 0.08)",
                  color: "hsl(var(--destructive))",
                  border: "1px solid hsl(var(--destructive) / 0.2)",
                }}
              >
                <X size={10} />
                停止生成
              </button>
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
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(inputValue);
              }
            }}
            placeholder="问 AI 任何策略问题，或说「重新评估」触发重新打分…"
            rows={2}
            disabled={loading}
            className="flex-1 resize-none bg-transparent outline-none text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] leading-relaxed disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || loading}
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
          Enter 发送 · Shift+Enter 换行 · 说「重新评估」可重新生成评估报告
        </p>
      </div>
    </div>
  );
}
