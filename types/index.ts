// 用户角色
export type UserRole = "BUSINESS" | "OPTIMIZER" | "ADMIN";

// 需求状态
export type RequirementStatus =
  | "DRAFT"        // 草稿（商务预审中，仅商务可见）
  | "PENDING"      // 待分配
  | "EVALUATING"   // 评估中
  | "ACCEPTED"     // 已接单
  | "REJECTED"     // 已拒绝
  | "IN_PROGRESS"  // 投放中
  | "COMPLETED";   // 已完成

// 项目状态
export type ProjectStatus =
  | "STRATEGY"    // 策略制定
  | "LAUNCHING"   // 启动投放
  | "OPTIMIZING"  // 优化调整
  | "REVIEWING"   // 复盘
  | "COMPLETED";  // 已完成

// AI 解析后的结构化需求
export interface StructuredRequirement {
  // 基础字段
  region: string;
  media_platform: string;
  daily_budget_usd: number | null;
  target_kpi: string;
  target_roi: number | null;
  product_type: string;
  campaign_objective: string;
  // 扩展字段
  product_url: string | null;        // 产品链接（App Store / 官网）
  soft_kpi: string;                  // Soft KPI（次留、LTV 等）
  test_period: string;               // 测试周期（如"2-3个月"）
  third_party_tracking: string;      // 三方归因（Adjust/AppsFlyer 等）
  attribution_model: string;         // 自投 / 代投 / 混合
  expected_start_date: string;       // 期望启动时间 / 合同预计完成时间
  policy_notes: string;              // 政策特殊要求
  ambiguous_fields: Array<{ field: string; question: string }>;
}

// AI 评估结果
export interface AIEvaluation {
  success_rate: number;
  confidence: "high" | "medium" | "low";
  risks: Array<{ level: "high" | "medium" | "low"; description: string }>;
  strategy_suggestions: [string, string, string];
  estimated_timeline: string;
  similar_case_hint: string;
}

// 用户
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// 客户
export interface Client {
  id: string;
  name: string;
  industry: string;
  region: string;
  ownerId: string;
}

// 需求单
export interface Requirement {
  id: string;
  clientId: string;
  clientName: string;
  creatorId: string;
  creatorName: string;
  assignedOptimizerId?: string;
  assignedOptimizerName?: string;
  rawInput: string;
  structuredData?: StructuredRequirement;
  aiEvaluation?: AIEvaluation;
  status: RequirementStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// 项目
export interface Project {
  id: string;
  requirementId: string;
  clientName: string;
  industry: string;
  mediaPlatform: string;
  businessName: string;
  optimizerName: string;
  status: ProjectStatus;
  budgetActual?: number;
  roiActual?: number;
  createdAt: string;
}

// 消息
export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  type: "TEXT" | "SYSTEM";
  createdAt: string;
}

// 任务
export interface Task {
  id: string;
  projectId: string;
  title: string;
  assigneeName?: string;
  dueDate?: string;
  completed: boolean;
}

// 追问消息（优化师→商务 or 商务→优化师，挂在需求上）
export interface FollowUp {
  id: string;
  requirementId: string;
  fromId: string;
  fromName: string;
  fromRole: UserRole;
  content: string;
  createdAt: string;
}

// 通知
export type NotificationType =
  | "NEW_REQUIREMENT"
  | "EVAL_DONE"
  | "FOLLOW_UP"
  | "ACCEPTED"
  | "REJECTED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// AI 多轮对话消息
export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

// 知识库案例
export interface KnowledgeCase {
  id: string;
  title: string;
  industry: string;
  mediaPlatform: string;
  region: string;
  budgetRange: string;
  targetKpi: string;
  targetRoi?: number;
  actualRoi?: number;
  strategySummary: string;
  keyInsights: string[];
  tags: string[];
  isHighlight: boolean;
  createdAt: string;
}
