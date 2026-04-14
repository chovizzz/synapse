"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { StepIndicator } from "@/components/requirements/StepIndicator";
import { ParseAnimation } from "@/components/requirements/ParseAnimation";
import { useRole } from "@/lib/role-context";
import { getClients, getStoredUsers, getKnowledgeCases, createRequirement, updateRequirement } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StructuredRequirement, Requirement, Client, User } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEMO_INPUT =
  "我们想在北美推一款策略手游，ROI要到1.2，预算每天500美金，跑Facebook和Instagram";

const FIELD_LABELS: Record<keyof Omit<StructuredRequirement, "ambiguous_fields">, string> = {
  region: "投放地区",
  media_platform: "投放媒体",
  daily_budget_usd: "测试日预算(美元)",
  target_kpi: "核心指标",
  target_roi: "目标ROI",
  product_type: "产品类型",
  campaign_objective: "推广目标",
  product_url: "产品链接",
  soft_kpi: "Soft KPI",
  test_period: "测试周期",
  third_party_tracking: "三方归因",
  attribution_model: "是否自投",
  expected_start_date: "期望启动时间",
  policy_notes: "政策说明",
};

const NUMBER_FIELDS: Array<keyof Omit<StructuredRequirement, "ambiguous_fields">> = [
  "daily_budget_usd",
  "target_roi",
];

// 字段类型配置：下拉选项 / 日期 / 多选标签 / 普通文本
type FieldConfig =
  | { type: "select"; options: string[] }
  | { type: "multiselect"; options: string[] }
  | { type: "date" }
  | { type: "number" }
  | { type: "text" }
  | { type: "url" };

const FIELD_CONFIG: Record<keyof Omit<StructuredRequirement, "ambiguous_fields">, FieldConfig> = {
  region: {
    type: "multiselect",
    options: ["北美", "欧洲", "东南亚", "日韩", "中东", "拉美", "大洋洲", "全球"],
  },
  media_platform: {
    type: "multiselect",
    options: ["Facebook & Instagram", "Google Ads", "TikTok", "YouTube", "Twitter/X", "Snapchat", "Pinterest", "Apple Search Ads", "其他小媒体"],
  },
  daily_budget_usd: { type: "number" },
  target_kpi: {
    type: "select",
    options: ["ROI", "ROAS", "CPI", "CPA", "CPM", "CTR", "其他"],
  },
  target_roi: { type: "number" },
  product_type: {
    type: "select",
    options: ["手游", "页游", "电商", "工具应用", "社交应用", "金融", "教育", "其他"],
  },
  campaign_objective: {
    type: "select",
    options: ["用户获取", "品牌曝光", "应用安装", "电商转化", "表单收集", "再营销", "其他"],
  },
  product_url: { type: "url" },
  soft_kpi: { type: "text" },
  test_period: {
    type: "select",
    options: ["1周", "1-2周", "2-4周", "1-2个月", "2-3个月", "3个月以上", "其他"],
  },
  third_party_tracking: {
    type: "select",
    options: ["Adjust", "AppsFlyer", "Branch", "Kochava", "Firebase", "无", "其他"],
  },
  attribution_model: {
    type: "select",
    options: ["代投", "自投", "混合"],
  },
  expected_start_date: { type: "date" },
  policy_notes: {
    type: "select",
    options: ["收取服务费", "不收服务费", "按比例提成", "其他"],
  },
};

// 表单模式的字段分组
const FORM_GROUPS: Array<{ title: string; fields: Array<keyof Omit<StructuredRequirement, "ambiguous_fields">> }> = [
  {
    title: "产品信息",
    fields: ["product_url", "product_type", "campaign_objective"],
  },
  {
    title: "投放配置",
    fields: ["region", "media_platform", "daily_budget_usd", "test_period"],
  },
  {
    title: "KPI & 目标",
    fields: ["target_kpi", "target_roi", "soft_kpi"],
  },
  {
    title: "合作方式",
    fields: ["attribution_model", "third_party_tracking", "expected_start_date", "policy_notes"],
  },
];

// 空白表单默认值
const EMPTY_FORM: Omit<StructuredRequirement, "ambiguous_fields"> = {
  region: "",
  media_platform: "",
  daily_budget_usd: null,
  target_kpi: "",
  target_roi: null,
  product_type: "",
  campaign_objective: "",
  product_url: null,
  soft_kpi: "",
  test_period: "",
  third_party_tracking: "",
  attribution_model: "",
  expected_start_date: "",
  policy_notes: "",
};

// SELECT_FIELDS 保留向后兼容（Step 3 确认页使用）
const SELECT_FIELDS: Partial<Record<keyof Omit<StructuredRequirement, "ambiguous_fields">, string[]>> = Object.fromEntries(
  Object.entries(FIELD_CONFIG)
    .filter(([, v]) => v.type === "select" || v.type === "multiselect")
    .map(([k, v]) => [k, (v as { type: string; options: string[] }).options])
);

/** 根据知识库案例生成可作「客户原话」的参考文案，供 AI 解析 */
function buildRawInputFromCase(
  title: string,
  industry: string,
  region: string,
  mediaPlatform: string,
  budgetRange: string,
  targetKpi: string,
  targetRoi: number | undefined,
  strategySummary: string
): string {
  const roiPart = targetRoi != null ? `，目标 ${targetKpi} 要到 ${targetRoi}` : `，目标 KPI 为 ${targetKpi}`;
  const budget = budgetRange.replace(/\/天$/, "").trim() || budgetRange;
  return `【参考案例】《${title}》\n客户想做 ${industry} 行业，投放地区 ${region}，媒体平台 ${mediaPlatform}，预算约 ${budget} 美金/天${roiPart}。\n策略要点：${strategySummary.slice(0, 280)}${strategySummary.length > 280 ? "…" : ""}`;
}

function NewRequirementPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useRole();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  // "chat" = 客户原话输入，"form" = 结构化表单填写
  const [inputMode, setInputMode] = useState<"chat" | "form">("chat");

  // 从 store 加载客户和优化师
  const [clients, setClients] = useState<Client[]>([]);
  const [optimizers, setOptimizers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([getClients(), getStoredUsers()]).then(([allClients, allUsers]) => {
      setClients(allClients);
      setOptimizers(allUsers.filter((u) => u.role === "OPTIMIZER"));
    });
  }, []);

  // Step 1
  const [rawInput, setRawInput] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [customClient, setCustomClient] = useState("");
  // 表单模式的字段状态
  const [formData, setFormData] = useState<Omit<StructuredRequirement, "ambiguous_fields">>(EMPTY_FORM);

  const setFormField = (key: keyof typeof EMPTY_FORM, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // 多选字段：value 存为逗号分隔字符串
  const toggleMultiValue = (key: keyof typeof EMPTY_FORM, option: string) => {
    const current = (formData[key] as string) || "";
    const parts = current ? current.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const idx = parts.indexOf(option);
    if (idx >= 0) parts.splice(idx, 1); else parts.push(option);
    setFormField(key, parts.join(", "));
  };

  // 从「参考此案例」带过来的案例 ID：预填客户原话
  useEffect(() => {
    const refCaseId = searchParams.get("refCase");
    if (!refCaseId || rawInput) return;
    getKnowledgeCases().then((cases) => {
    const refCase = cases.find((k) => k.id === refCaseId);
    if (!refCase) return;
    const filled = buildRawInputFromCase(
      refCase.title,
      refCase.industry,
      refCase.region,
      refCase.mediaPlatform,
      refCase.budgetRange,
      refCase.targetKpi,
      refCase.targetRoi,
      refCase.strategySummary
    );
    setRawInput(filled);
    });
  }, [searchParams, rawInput]);

  // Step 2
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<StructuredRequirement | null>(null);

  // Step 3
  const [editableData, setEditableData] = useState<StructuredRequirement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 客户加载完后设置默认选中
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const clientName =
    selectedClientId === "__custom__"
      ? customClient.trim() || "未知客户"
      : clients.find((c) => c.id === selectedClientId)?.name ?? "未知客户";

  // ── Step 1 → 2: AI 解析 ──────────────────────────────────────────────────
  async function handleParse() {
    if (!rawInput.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setStep(2);

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const data: StructuredRequirement = json.data;
      setParsedData(data);
      setEditableData({ ...data });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "解析失败，请重试");
    } finally {
      setIsParsing(false);
    }
  }

  // ── 表单模式：直接跳 Step 3 ──────────────────────────────────────────────
  function handleFormSubmit() {
    const data: StructuredRequirement = { ...formData, ambiguous_fields: [] };
    // 用表单内容生成一段 rawInput 摘要
    const parts: string[] = [];
    if (formData.product_type) parts.push(formData.product_type);
    if (formData.region) parts.push(`投放 ${formData.region}`);
    if (formData.media_platform) parts.push(formData.media_platform);
    if (formData.daily_budget_usd) parts.push(`日预算 $${formData.daily_budget_usd}`);
    if (formData.target_kpi) parts.push(`目标 ${formData.target_kpi}${formData.target_roi ? ` ${formData.target_roi}` : ""}`);
    setRawInput(parts.join("，") || "结构化表单填写");
    setParsedData(data);
    setEditableData({ ...data });
    setStep(3);
  }

  // ── Step 2 → 3: 确认 ─────────────────────────────────────────────────────
  function handleConfirm() {
    if (!parsedData) return;
    setStep(3);
  }

  // ── Step 3: 保存为草稿（DRAFT）──────────────────────────────────────────
  async function handleSubmit() {
    if (!editableData) return;
    setIsSubmitting(true);

    const newReq = await createRequirement({
      clientId: selectedClientId === "__custom__" ? `c-${generateId()}` : selectedClientId,
      rawInput,
      structuredData: editableData,
    });

    // 异步触发 AI 评估，不阻塞跳转
    fetch("/api/ai/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ structuredData: editableData }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          updateRequirement(newReq.id, { aiEvaluation: json.data });
        }
      })
      .catch(() => {/* 静默失败 */});

    router.push(`/requirements/${newReq.id}`);
  }

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">新建客户需求</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          粘贴客户原话，AI 自动解析为结构化需求单
        </p>
      </div>

      {/* 步骤指示器 */}
      <StepIndicator currentStep={step} />

      {/* Step 内容区 */}
      <AnimatePresence mode="wait">
        {/* ── STEP 1 ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* 客户选择 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">
                选择客户
              </label>
              <Select
                value={selectedClientId}
                onValueChange={(v) => setSelectedClientId(v ?? "")}
                itemToStringLabel={(v) => {
                  if (!v) return "选择客户";
                  if (v === "__custom__") return "+ 新客户（手动输入）";
                  return clients.find((c) => c.id === v)?.name ?? String(v);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">+ 新客户（手动输入）</SelectItem>
                </SelectContent>
              </Select>
              {selectedClientId === "__custom__" && (
                <input
                  type="text"
                  placeholder="输入新客户名称"
                  value={customClient}
                  onChange={(e) => setCustomClient(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border border-[hsl(var(--border))]",
                    "bg-[hsl(var(--card))] text-[hsl(var(--foreground))]",
                    "px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 mt-2"
                  )}
                />
              )}
            </div>

            {/* 输入方式 Tab */}
            <div className="space-y-3">
              <div className="flex rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/40 p-1 gap-1">
                {(["chat", "form"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setInputMode(mode)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                      inputMode === mode
                        ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                        : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    )}
                  >
                    {mode === "chat" ? "📝 客户原话" : "📋 结构化表单"}
                  </button>
                ))}
              </div>

              {/* ── 原话输入 ── */}
              {inputMode === "chat" && (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder="把客户说的原话粘贴在这里..."
                      rows={5}
                      className={cn(
                        "w-full rounded-lg border border-[hsl(var(--border))]",
                        "bg-[hsl(var(--card))] text-[hsl(var(--foreground))]",
                        "px-4 py-3 text-sm resize-none min-h-[120px]",
                        "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50",
                        "placeholder:text-[hsl(var(--muted-foreground))]"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setRawInput(DEMO_INPUT)}
                      className={cn(
                        "absolute bottom-3 right-3 text-xs px-2.5 py-1 rounded-md",
                        "border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]",
                        "hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]/50 transition-colors"
                      )}
                    >
                      填入演示
                    </button>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    AI 将自动提取投放地区、预算、KPI 等字段
                  </p>
                  <button
                    onClick={handleParse}
                    disabled={!rawInput.trim()}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
                      "bg-[hsl(var(--primary))] text-white font-semibold text-sm",
                      "transition-opacity duration-200",
                      !rawInput.trim() ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"
                    )}
                  >
                    AI 解析
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── 结构化表单 ── */}
              {inputMode === "form" && (
                <div className="space-y-5">
                  {FORM_GROUPS.map((group) => (
                    <div key={group.title} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
                      <div className="px-4 py-2.5 bg-[hsl(var(--secondary))]/50 border-b border-[hsl(var(--border))]">
                        <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                          {group.title}
                        </span>
                      </div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {group.fields.map((key) => {
                          const cfg = FIELD_CONFIG[key];
                          const label = FIELD_LABELS[key];
                          const val = formData[key];
                          const strVal = val != null ? String(val) : "";

                          const inputCls = cn(
                            "w-full rounded-lg border border-[hsl(var(--border))]",
                            "bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
                            "px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50",
                            "placeholder:text-[hsl(var(--muted-foreground))]"
                          );

                          return (
                            <div key={key} className={cn("space-y-1.5", (cfg.type === "multiselect") && "sm:col-span-2")}>
                              <label className="text-xs font-medium text-[hsl(var(--foreground))]/70">{label}</label>

                              {cfg.type === "select" && (
                                <select
                                  value={strVal}
                                  onChange={(e) => setFormField(key, e.target.value)}
                                  className={inputCls}
                                >
                                  <option value="">请选择…</option>
                                  {cfg.options.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}

                              {cfg.type === "multiselect" && (
                                <div className="flex flex-wrap gap-2">
                                  {cfg.options.map((opt) => {
                                    const selected = strVal.split(",").map((s) => s.trim()).includes(opt);
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => toggleMultiValue(key, opt)}
                                        className={cn(
                                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
                                          selected
                                            ? "bg-[hsl(var(--primary))]/15 border-[hsl(var(--primary))]/50 text-[hsl(var(--primary))]"
                                            : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]/40 hover:text-[hsl(var(--foreground))]"
                                        )}
                                      >
                                        {selected && <span className="mr-1">✓</span>}{opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {cfg.type === "number" && (
                                <input
                                  type="number"
                                  value={strVal}
                                  onChange={(e) => setFormField(key, e.target.value === "" ? null : Number(e.target.value))}
                                  placeholder={key === "daily_budget_usd" ? "200 以上（美元/天）" : "例如 1.2"}
                                  className={inputCls}
                                />
                              )}

                              {cfg.type === "date" && (
                                <input
                                  type="date"
                                  value={strVal}
                                  onChange={(e) => setFormField(key, e.target.value)}
                                  className={inputCls}
                                />
                              )}

                              {cfg.type === "url" && (
                                <input
                                  type="url"
                                  value={strVal}
                                  onChange={(e) => setFormField(key, e.target.value)}
                                  placeholder="https://..."
                                  className={inputCls}
                                />
                              )}

                              {cfg.type === "text" && (
                                <input
                                  type="text"
                                  value={strVal}
                                  onChange={(e) => setFormField(key, e.target.value)}
                                  placeholder={key === "soft_kpi" ? "如：次日留存 ≥ 35%、LTV > $5" : ""}
                                  className={inputCls}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleFormSubmit}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
                      "bg-[hsl(var(--primary))] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    )}
                  >
                    下一步，确认并保存
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 原话预览 */}
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 p-4">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">客户原话</p>
              <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed break-all">{rawInput}</p>
            </div>

            {/* 解析动画区 */}
            <ParseAnimation data={parsedData} isLoading={isParsing} />

            {/* 错误提示 */}
            {parseError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">
                ⚠️ {parseError}
              </div>
            )}

            {/* 底部按钮 */}
            {!isParsing && parsedData && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3"
              >
                <button
                  onClick={() => { setParsedData(null); setStep(1); }}
                  className={cn(
                    "flex-1 py-3 rounded-xl border border-[hsl(var(--border))]",
                    "text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  )}
                >
                  重新输入
                </button>
                <button
                  onClick={handleConfirm}
                  className={cn(
                    "flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl",
                    "bg-[hsl(var(--primary))] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  )}
                >
                  确认，进入下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {!isParsing && parseError && (
              <button
                onClick={() => { setParseError(null); setStep(1); }}
                className={cn(
                  "w-full py-3 rounded-xl border border-[hsl(var(--border))]",
                  "text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                )}
              >
                返回修改
              </button>
            )}
          </motion.div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && editableData && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--primary))]" />
                <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                  解析结果确认 — 可手动修改
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map((key) => {
                  const isNum = NUMBER_FIELDS.includes(key);
                  const selectOpts = SELECT_FIELDS[key];
                  const rawVal = editableData[key];
                  const displayVal = rawVal != null ? String(rawVal) : "";

                  const inputClass = cn(
                    "w-full rounded-lg border border-[hsl(var(--border))]",
                    "bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
                    "px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50"
                  );

                  const handleChange = (v: string) => {
                    setEditableData((prev) =>
                      prev
                        ? { ...prev, [key]: isNum ? (v === "" ? null : Number(v)) : v }
                        : prev
                    );
                  };

                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-[hsl(var(--muted-foreground))]">
                        {FIELD_LABELS[key]}
                      </label>
                      {selectOpts ? (
                        <select
                          value={displayVal}
                          onChange={(e) => handleChange(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">请选择…</option>
                          {selectOpts.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          {displayVal && !selectOpts.includes(displayVal) && (
                            <option value={displayVal}>{displayVal}（AI 解析）</option>
                          )}
                        </select>
                      ) : (
                        <input
                          type={isNum ? "number" : "text"}
                          value={displayVal}
                          onChange={(e) => handleChange(e.target.value)}
                          className={inputClass}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 提示说明 */}
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 flex gap-3">
              <div className="text-violet-400 mt-0.5 flex-shrink-0">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-violet-400">保存为草稿，先预览 AI 评估</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  需求将保存为草稿（仅你可见），AI 会自动运行评估。你可以和 AI 对话调整评估，满意后再提交给优化师。
                </p>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-3">
              <button
                onClick={() => { inputMode === "form" ? setStep(1) : setStep(2); }}
                className={cn(
                  "flex-1 py-3 rounded-xl border border-[hsl(var(--border))]",
                  "text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                )}
              >
                返回修改
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl",
                  "bg-[hsl(var(--primary))] text-white font-semibold text-sm",
                  "transition-opacity duration-200",
                  isSubmitting ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    保存草稿并预览评估
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NewRequirementPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto flex items-center justify-center py-24 text-sm text-[hsl(var(--muted-foreground))]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          加载中…
        </div>
      }
    >
      <NewRequirementPageInner />
    </Suspense>
  );
}
