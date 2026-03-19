import { Requirement, Message, Task, KnowledgeCase, FollowUp, AppNotification, User, Client, Project, RechargeRecord } from "@/types";
import { MOCK_REQUIREMENTS, MOCK_MESSAGES, MOCK_TASKS, MOCK_KNOWLEDGE_CASES, MOCK_NOTIFICATIONS, MOCK_USERS, MOCK_CLIENTS, MOCK_PROJECTS } from "./mock-data";

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Users ─────────────────────────────────────────────────────────────────────
export function getStoredUsers(): User[] {
  return getFromStorage("synapse_users", MOCK_USERS);
}

export function saveStoredUsers(users: User[]): void {
  saveToStorage("synapse_users", users);
}

// ── Projects ──────────────────────────────────────────────────────────────────
export function getProjects(): Project[] {
  return getFromStorage("synapse_projects", MOCK_PROJECTS);
}

export function saveProjects(projects: Project[]): void {
  saveToStorage("synapse_projects", projects);
}

export function updateProject(updated: Project): void {
  const all = getProjects();
  saveProjects(all.map((p) => (p.id === updated.id ? updated : p)));
}

// ── RechargeRecords ───────────────────────────────────────────────────────────
export function getRechargeRecords(): RechargeRecord[] {
  return getFromStorage<RechargeRecord[]>("synapse_recharge_records", []);
}

export function addRechargeRecord(record: RechargeRecord): void {
  const all = getRechargeRecords();
  saveToStorage("synapse_recharge_records", [record, ...all]);
}

// ── Clients ───────────────────────────────────────────────────────────────────
export function getClients(): Client[] {
  return getFromStorage("synapse_clients", MOCK_CLIENTS);
}

export function saveClients(clients: Client[]): void {
  saveToStorage("synapse_clients", clients);
}

// ── Requirements ──────────────────────────────────────────────────────────────
export function getRequirements(): Requirement[] {
  return getFromStorage("synapse_requirements", MOCK_REQUIREMENTS);
}

export function saveRequirements(requirements: Requirement[]): void {
  saveToStorage("synapse_requirements", requirements);
}

// ── Messages ──────────────────────────────────────────────────────────────────
export function getMessages(projectId: string): Message[] {
  const all = getFromStorage("synapse_messages", MOCK_MESSAGES);
  return all.filter((m) => m.projectId === projectId);
}

export function addMessage(message: Message): void {
  const all = getFromStorage("synapse_messages", MOCK_MESSAGES);
  saveToStorage("synapse_messages", [...all, message]);
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export function getTasks(projectId: string): Task[] {
  const all = getFromStorage("synapse_tasks", MOCK_TASKS);
  return all.filter((t) => t.projectId === projectId);
}

// ── Knowledge ─────────────────────────────────────────────────────────────────
export function getKnowledgeCases(): KnowledgeCase[] {
  return getFromStorage("synapse_knowledge", MOCK_KNOWLEDGE_CASES);
}

// ── Follow-ups (追问) ─────────────────────────────────────────────────────────
export function getFollowUps(requirementId: string): FollowUp[] {
  const all = getFromStorage<FollowUp[]>("synapse_followups", []);
  return all.filter((f) => f.requirementId === requirementId);
}

export function addFollowUp(followUp: FollowUp): void {
  const all = getFromStorage<FollowUp[]>("synapse_followups", []);
  saveToStorage("synapse_followups", [...all, followUp]);
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function getNotifications(): AppNotification[] {
  return getFromStorage("synapse_notifications", MOCK_NOTIFICATIONS);
}

export function markNotificationRead(id: string): void {
  const all = getNotifications();
  saveToStorage(
    "synapse_notifications",
    all.map((n) => (n.id === id ? { ...n, read: true } : n))
  );
}

export function markAllNotificationsRead(): void {
  const all = getNotifications();
  saveToStorage(
    "synapse_notifications",
    all.map((n) => ({ ...n, read: true }))
  );
}

export function addNotification(notification: AppNotification): void {
  const all = getNotifications();
  saveToStorage("synapse_notifications", [notification, ...all]);
}
