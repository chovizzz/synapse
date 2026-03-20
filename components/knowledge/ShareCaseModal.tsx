"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star } from "lucide-react";
import { generateId } from "@/lib/utils";
import { addKnowledgeCase } from "@/lib/store";
import type { KnowledgeCase } from "@/types";

interface ShareCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** 可选：用于下拉建议的已有案例（行业/媒体/地区） */
  existingCases?: KnowledgeCase[];
}

const defaultForm = {
  title: "",
  industry: "",
  mediaPlatform: "",
  region: "",
  budgetRange: "",
  targetKpi: "",
  targetRoi: "" as string | number,
  actualRoi: "" as string | number,
  strategySummary: "",
  keyInsightsText: "",
  tagsText: "",
  isHighlight: false,
};

function uniqueSorted(arr: string[]): string[] {
  return Array.from(new Set(arr)).filter(Boolean).sort();
}

export function ShareCaseModal({
  open,
  onClose,
  onSuccess,
  existingCases = [],
}: ShareCaseModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const industries = uniqueSorted(existingCases.map((c) => c.industry));
  const medias = uniqueSorted(existingCases.map((c) => c.mediaPlatform));
  const regions = uniqueSorted(existingCases.map((c) => c.region));

  const update = (patch: Partial<typeof defaultForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const title = form.title.trim();
    const industry = form.industry.trim();
    const mediaPlatform = form.mediaPlatform.trim();
    const region = form.region.trim();
    const budgetRange = form.budgetRange.trim();
    const targetKpi = form.targetKpi.trim();
    const strategySummary = form.strategySummary.trim();

    if (!title) {
      setError("请填写案例标题");
      return;
    }
    if (!industry) {
      setError("请填写行业");
      return;
    }
    if (!mediaPlatform) {
      setError("请填写媒体平台");
      return;
    }
    if (!region) {
      setError("请填写投放地区");
      return;
    }
    if (!budgetRange) {
      setError("请填写预算范围");
      return;
    }
    if (!targetKpi) {
      setError("请填写目标 KPI");
      return;
    }
    if (!strategySummary) {
      setError("请填写策略摘要");
      return;
    }

    setSubmitting(true);
    const keyInsights = form.keyInsightsText
      .trim()
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = form.tagsText
      .trim()
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const record: KnowledgeCase = {
      id: "k_" + generateId(),
      title,
      industry,
      mediaPlatform,
      region,
      budgetRange,
      targetKpi,
      targetRoi: form.targetRoi === "" ? undefined : Number(form.targetRoi),
      actualRoi: form.actualRoi === "" ? undefined : Number(form.actualRoi),
      strategySummary,
      keyInsights,
      tags,
      isHighlight: form.isHighlight,
      createdAt: new Date().toISOString(),
    };

    try {
      addKnowledgeCase(record);
      setForm(defaultForm);
      onSuccess();
      onClose();
    } catch (err) {
      setError("保存失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] shadow-2xl bg-white dark:bg-[hsl(var(--card))]">
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 dark:border-[hsl(var(--border))] bg-indigo-600 dark:bg-indigo-900/50 rounded-t-2xl">
                <h2 className="text-lg font-bold text-white">分享新案例</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 transition-colors hover:bg-white/20"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {error && (
                    <div
                      className="rounded-lg px-3 py-2 text-sm"
                      style={{
                        backgroundColor: "hsl(var(--destructive)/0.15)",
                        color: "hsl(var(--destructive))",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      案例标题 *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => update({ title: e.target.value })}
                      placeholder="如：手游北美 Facebook 用户获取"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                      style={{
                        borderColor: "hsl(var(--border))",
                        backgroundColor: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        行业 *
                      </label>
                      <input
                        type="text"
                        list="industries"
                        value={form.industry}
                        onChange={(e) => update({ industry: e.target.value })}
                        placeholder="如：手游、女装电商"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                        style={{
                          borderColor: "hsl(var(--border))",
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <datalist id="industries">
                        {industries.map((v) => (
                          <option key={v} value={v} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        媒体平台 *
                      </label>
                      <input
                        type="text"
                        list="medias"
                        value={form.mediaPlatform}
                        onChange={(e) => update({ mediaPlatform: e.target.value })}
                        placeholder="如：Facebook、TikTok"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                        style={{
                          borderColor: "hsl(var(--border))",
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <datalist id="medias">
                        {medias.map((v) => (
                          <option key={v} value={v} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        投放地区 *
                      </label>
                      <input
                        type="text"
                        list="regions"
                        value={form.region}
                        onChange={(e) => update({ region: e.target.value })}
                        placeholder="如：北美、东南亚"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                        style={{
                          borderColor: "hsl(var(--border))",
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <datalist id="regions">
                        {regions.map((v) => (
                          <option key={v} value={v} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        预算范围 *
                      </label>
                      <input
                        type="text"
                        value={form.budgetRange}
                        onChange={(e) => update({ budgetRange: e.target.value })}
                        placeholder="如：$300-800/天"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                        style={{
                          borderColor: "hsl(var(--border))",
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        目标 KPI *
                      </label>
                      <input
                        type="text"
                        value={form.targetKpi}
                        onChange={(e) => update({ targetKpi: e.target.value })}
                        placeholder="如：ROI、ROAS、CPA"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                        style={{
                          borderColor: "hsl(var(--border))",
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        目标 ROI（选填）
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={form.targetRoi}
                        onChange={(e) => update({ targetRoi: e.target.value })}
                        placeholder="如：1.2"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                        style={{
                          borderColor: "hsl(var(--border))",
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                        实际 ROI（选填）
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={form.actualRoi}
                        onChange={(e) => update({ actualRoi: e.target.value })}
                        placeholder="如：1.25"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                        style={{
                          borderColor: "hsl(var(--border))",
                          backgroundColor: "hsl(var(--secondary))",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      策略摘要 *
                    </label>
                    <textarea
                      value={form.strategySummary}
                      onChange={(e) => update({ strategySummary: e.target.value })}
                      placeholder="简要描述投放策略与关键动作..."
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600 resize-y"
                      style={{
                        borderColor: "hsl(var(--border))",
                        backgroundColor: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      关键洞察（选填，每行一条）
                    </label>
                    <textarea
                      value={form.keyInsightsText}
                      onChange={(e) => update({ keyInsightsText: e.target.value })}
                      placeholder="宽泛定向在测试期优于精准定向
游戏玩法展示类素材 CTR 更高"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600 resize-y"
                      style={{
                        borderColor: "hsl(var(--border))",
                        backgroundColor: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      标签（选填，逗号或空格分隔）
                    </label>
                    <input
                      type="text"
                      value={form.tagsText}
                      onChange={(e) => update({ tagsText: e.target.value })}
                      placeholder="如：手游, Facebook, 北美, ROI优化"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-600"
                      style={{
                        borderColor: "hsl(var(--border))",
                        backgroundColor: "hsl(var(--secondary))",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isHighlight}
                      onChange={(e) => update({ isHighlight: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: "hsl(var(--foreground))" }}>
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      标记为优秀案例
                    </span>
                  </label>
                </div>

                <div className="flex-shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-[hsl(var(--border))]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  >
                    {submitting ? "提交中…" : "提交案例"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
