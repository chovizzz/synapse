/**
 * API 调用层 — 所有数据读写通过 REST API 而非 localStorage。
 * 保留原有导出签名，方便页面组件无缝迁移。
 */
import type {
  Requirement,
  Message,
  Task,
  KnowledgeCase,
  FollowUp,
  AppNotification,
  User,
  Client,
  Project,
  RechargeRecord,
  NotificationType,
} from "@/types";
import { generateId } from "@/lib/utils";

export const SYNAPSE_NOTIFICATIONS_EVENT = "synapse-notifications-updated";

function emitNotificationsUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SYNAPSE_NOTIFICATIONS_EVENT));
  }
}

// ── Generic fetch helpers ─────────────────────────────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${url}`);
  return res.json() as Promise<T>;
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function getStoredUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/users");
}

// ── Clients ───────────────────────────────────────────────────────────────────
export async function getClients(): Promise<Client[]> {
  return apiFetch<Client[]>("/api/clients");
}

export async function createClient(data: Omit<Client, "id" | "createdAt">): Promise<Client> {
  return apiFetch<Client>("/api/clients", { method: "POST", body: JSON.stringify(data) });
}

// ── Requirements ──────────────────────────────────────────────────────────────
export async function getRequirements(): Promise<Requirement[]> {
  return apiFetch<Requirement[]>("/api/requirements");
}

export async function getRequirement(id: string): Promise<Requirement> {
  return apiFetch<Requirement>(`/api/requirements/${id}`);
}

export async function createRequirement(
  data: Pick<Requirement, "clientId" | "rawInput" | "structuredData">
): Promise<Requirement> {
  return apiFetch<Requirement>("/api/requirements", { method: "POST", body: JSON.stringify(data) });
}

export async function updateRequirement(id: string, data: Partial<Requirement>): Promise<Requirement> {
  return apiFetch<Requirement>(`/api/requirements/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

// ── Follow-ups ────────────────────────────────────────────────────────────────
export async function getFollowUps(requirementId: string): Promise<FollowUp[]> {
  return apiFetch<FollowUp[]>(`/api/requirements/${requirementId}/followups`);
}

export async function addFollowUp(followUp: FollowUp): Promise<FollowUp> {
  return apiFetch<FollowUp>(`/api/requirements/${followUp.requirementId}/followups`, {
    method: "POST",
    body: JSON.stringify({ content: followUp.content }),
  });
}

// ── Projects ──────────────────────────────────────────────────────────────────
export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects");
}

export async function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${id}`);
}

export async function updateProject(updated: Partial<Project> & { id: string }): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${updated.id}`, {
    method: "PATCH",
    body: JSON.stringify(updated),
  });
}

// ── Recharge ──────────────────────────────────────────────────────────────────
export async function addRechargeRecord(
  projectId: string,
  amount: number,
  note?: string
): Promise<{ record: RechargeRecord; project: Project }> {
  return apiFetch(`/api/projects/${projectId}/recharge`, {
    method: "POST",
    body: JSON.stringify({ amount, note }),
  });
}

// ── Messages ──────────────────────────────────────────────────────────────────
export async function getMessages(projectId: string): Promise<Message[]> {
  return apiFetch<Message[]>(`/api/projects/${projectId}/messages`);
}

export async function addMessage(message: Pick<Message, "projectId" | "content" | "type">): Promise<Message> {
  return apiFetch<Message>(`/api/projects/${message.projectId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: message.content, type: message.type }),
  });
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export async function getTasks(projectId: string): Promise<Task[]> {
  return apiFetch<Task[]>(`/api/projects/${projectId}/tasks`);
}

export async function updateTask(projectId: string, taskId: string, data: Partial<Task>): Promise<Task> {
  return apiFetch<Task>(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Knowledge ─────────────────────────────────────────────────────────────────
export async function getKnowledgeCases(): Promise<KnowledgeCase[]> {
  return apiFetch<KnowledgeCase[]>("/api/knowledge");
}

export async function addKnowledgeCase(
  record: Omit<KnowledgeCase, "id" | "createdAt">
): Promise<KnowledgeCase> {
  return apiFetch<KnowledgeCase>("/api/knowledge", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

// ── Notifications ─────────────────────────────────────────────────────────────
export async function getNotifications(): Promise<AppNotification[]> {
  return apiFetch<AppNotification[]>("/api/notifications");
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
  emitNotificationsUpdated();
}

export async function markAllNotificationsRead(): Promise<void> {
  const all = await getNotifications();
  await Promise.all(all.filter((n) => !n.read).map((n) => markNotificationRead(n.id)));
  emitNotificationsUpdated();
}

/** 服务端创建通知（在 API route 中调用，走 Prisma 直写）*/
export function pushLocalNotification(_params: {
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read?: boolean;
}): void {
  // 客户端通知推送已迁移到服务端 API route，此处保留签名兼容性
  console.warn("pushLocalNotification is deprecated — use server-side notification creation.");
}

/** @deprecated 保留兼容 — 新代码请直接调用 updateRequirement */
export async function saveRequirements(_requirements: Requirement[]): Promise<void> {
  console.warn("saveRequirements is deprecated — updates are made per-requirement via PATCH /api/requirements/:id");
}

/** @deprecated 保留兼容 */
export async function saveProjects(_projects: Project[]): Promise<void> {
  console.warn("saveProjects is deprecated — updates are made per-project via PATCH /api/projects/:id");
}

/** @deprecated 保留兼容 */
export async function saveClients(_clients: Client[]): Promise<void> {
  console.warn("saveClients is deprecated — use createClient()");
}

/** @deprecated 保留兼容 */
export async function saveKnowledgeCases(_cases: KnowledgeCase[]): Promise<void> {
  console.warn("saveKnowledgeCases is deprecated — use addKnowledgeCase()");
}

/** @deprecated 保留兼容 */
export async function saveStoredUsers(_users: User[]): Promise<void> {
  console.warn("saveStoredUsers is deprecated — user management via admin API");
}

/** @deprecated 保留兼容 */
export async function addNotification(_notification: AppNotification): Promise<void> {
  console.warn("addNotification is deprecated — notifications are created server-side");
}

/** @deprecated 保留兼容 */
export async function getRechargeRecords(): Promise<RechargeRecord[]> {
  // 汇总所有项目的充值记录
  const projects = await getProjects();
  const records: RechargeRecord[] = [];
  for (const p of projects) {
    if ((p as unknown as { rechargeRecords?: RechargeRecord[] }).rechargeRecords) {
      records.push(...((p as unknown as { rechargeRecords: RechargeRecord[] }).rechargeRecords));
    }
  }
  return records;
}

export { generateId };
