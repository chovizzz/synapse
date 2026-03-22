/**
 * 比赛 / 对外 Demo：将本地存储重置为一套完整演示数据（无数据库）。
 */
import {
  MOCK_USERS,
  MOCK_CLIENTS,
  MOCK_REQUIREMENTS,
  MOCK_PROJECTS,
  MOCK_MESSAGES,
  MOCK_TASKS,
  MOCK_KNOWLEDGE_CASES,
  MOCK_NOTIFICATIONS,
} from "@/lib/mock-data";

const KEYS = {
  users: "synapse_users",
  clients: "synapse_clients",
  requirements: "synapse_requirements",
  projects: "synapse_projects",
  messages: "synapse_messages",
  tasks: "synapse_tasks",
  knowledge: "synapse_knowledge",
  notifications: "synapse_notifications",
  followups: "synapse_followups",
  recharge: "synapse_recharge_records",
} as const;

export function seedDemoDataToLocalStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.users, JSON.stringify(MOCK_USERS));
  localStorage.setItem(KEYS.clients, JSON.stringify(MOCK_CLIENTS));
  localStorage.setItem(KEYS.requirements, JSON.stringify(MOCK_REQUIREMENTS));
  localStorage.setItem(KEYS.projects, JSON.stringify(MOCK_PROJECTS));
  localStorage.setItem(KEYS.messages, JSON.stringify(MOCK_MESSAGES));
  localStorage.setItem(KEYS.tasks, JSON.stringify(MOCK_TASKS));
  localStorage.setItem(KEYS.knowledge, JSON.stringify(MOCK_KNOWLEDGE_CASES));
  localStorage.setItem(KEYS.notifications, JSON.stringify(MOCK_NOTIFICATIONS));
  localStorage.setItem(KEYS.followups, JSON.stringify([]));
  localStorage.setItem(KEYS.recharge, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent("synapse-notifications-updated"));
}
