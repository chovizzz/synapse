import { Requirement, Message, Task, KnowledgeCase } from "@/types";
import { MOCK_REQUIREMENTS, MOCK_MESSAGES, MOCK_TASKS, MOCK_KNOWLEDGE_CASES } from "./mock-data";

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

export function getRequirements(): Requirement[] {
  return getFromStorage("synapse_requirements", MOCK_REQUIREMENTS);
}

export function saveRequirements(requirements: Requirement[]): void {
  saveToStorage("synapse_requirements", requirements);
}

export function getMessages(projectId: string): Message[] {
  const all = getFromStorage("synapse_messages", MOCK_MESSAGES);
  return all.filter((m) => m.projectId === projectId);
}

export function addMessage(message: Message): void {
  const all = getFromStorage("synapse_messages", MOCK_MESSAGES);
  saveToStorage("synapse_messages", [...all, message]);
}

export function getTasks(projectId: string): Task[] {
  const all = getFromStorage("synapse_tasks", MOCK_TASKS);
  return all.filter((t) => t.projectId === projectId);
}

export function getKnowledgeCases(): KnowledgeCase[] {
  return getFromStorage("synapse_knowledge", MOCK_KNOWLEDGE_CASES);
}
