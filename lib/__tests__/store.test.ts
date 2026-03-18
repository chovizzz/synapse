import { describe, it, expect, beforeEach } from "vitest";
import {
  getRequirements,
  saveRequirements,
  getMessages,
  addMessage,
  getFollowUps,
  addFollowUp,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  addNotification,
} from "@/lib/store";
import type { Message, FollowUp, AppNotification } from "@/types";

beforeEach(() => {
  localStorage.clear();
});

// ── Requirements ──────────────────────────────────────────────────────────────

describe("getRequirements", () => {
  it("returns mock defaults when localStorage is empty", () => {
    const reqs = getRequirements();
    expect(Array.isArray(reqs)).toBe(true);
    expect(reqs.length).toBeGreaterThan(0);
  });

  it("returns saved data after saveRequirements", () => {
    const original = getRequirements();
    const first = original[0];
    saveRequirements([first]);
    const loaded = getRequirements();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(first.id);
  });
});

// ── Messages ──────────────────────────────────────────────────────────────────

describe("getMessages / addMessage", () => {
  const makeMessage = (projectId: string, id: string): Message => ({
    id,
    projectId,
    senderId: "user-1",
    senderName: "Test User",
    senderRole: "BUSINESS",
    content: "Hello",
    type: "TEXT",
    createdAt: new Date().toISOString(),
  });

  it("returns empty array for unknown projectId when no data saved", () => {
    // clear so mock defaults don't interfere — seed with empty array
    localStorage.setItem("synapse_messages", JSON.stringify([]));
    const msgs = getMessages("nonexistent-project");
    expect(msgs).toHaveLength(0);
  });

  it("filters messages by projectId", () => {
    localStorage.setItem("synapse_messages", JSON.stringify([]));
    const msgA = makeMessage("project-a", "msg-1");
    const msgB = makeMessage("project-b", "msg-2");
    addMessage(msgA);
    addMessage(msgB);

    expect(getMessages("project-a")).toHaveLength(1);
    expect(getMessages("project-a")[0].id).toBe("msg-1");
    expect(getMessages("project-b")).toHaveLength(1);
  });

  it("accumulates multiple messages for the same project", () => {
    localStorage.setItem("synapse_messages", JSON.stringify([]));
    addMessage(makeMessage("project-a", "msg-1"));
    addMessage(makeMessage("project-a", "msg-2"));
    expect(getMessages("project-a")).toHaveLength(2);
  });
});

// ── Follow-ups ─────────────────────────────────────────────────────────────────

describe("getFollowUps / addFollowUp", () => {
  const makeFollowUp = (requirementId: string, id: string): FollowUp => ({
    id,
    requirementId,
    fromId: "user-1",
    fromName: "小王",
    fromRole: "BUSINESS",
    content: "追问内容",
    createdAt: new Date().toISOString(),
  });

  it("returns empty array when no follow-ups stored", () => {
    expect(getFollowUps("req-x")).toHaveLength(0);
  });

  it("filters follow-ups by requirementId", () => {
    addFollowUp(makeFollowUp("req-1", "fu-1"));
    addFollowUp(makeFollowUp("req-2", "fu-2"));

    const req1 = getFollowUps("req-1");
    expect(req1).toHaveLength(1);
    expect(req1[0].id).toBe("fu-1");

    const req2 = getFollowUps("req-2");
    expect(req2).toHaveLength(1);
    expect(req2[0].id).toBe("fu-2");
  });

  it("accumulates multiple follow-ups for the same requirement", () => {
    addFollowUp(makeFollowUp("req-1", "fu-1"));
    addFollowUp(makeFollowUp("req-1", "fu-2"));
    expect(getFollowUps("req-1")).toHaveLength(2);
  });
});

// ── Notifications ─────────────────────────────────────────────────────────────

describe("notifications", () => {
  const makeNotification = (id: string, read = false): AppNotification => ({
    id,
    type: "NEW_REQUIREMENT",
    title: "新需求",
    body: "有一条新需求",
    read,
    createdAt: new Date().toISOString(),
  });

  it("returns mock defaults when localStorage is empty", () => {
    const notifs = getNotifications();
    expect(Array.isArray(notifs)).toBe(true);
  });

  it("addNotification prepends to list", () => {
    localStorage.setItem("synapse_notifications", JSON.stringify([]));
    addNotification(makeNotification("n-1"));
    addNotification(makeNotification("n-2"));
    const all = getNotifications();
    expect(all[0].id).toBe("n-2");
    expect(all[1].id).toBe("n-1");
  });

  it("markNotificationRead only marks the target", () => {
    localStorage.setItem("synapse_notifications", JSON.stringify([
      makeNotification("n-1", false),
      makeNotification("n-2", false),
    ]));
    markNotificationRead("n-1");
    const all = getNotifications();
    expect(all.find((n) => n.id === "n-1")?.read).toBe(true);
    expect(all.find((n) => n.id === "n-2")?.read).toBe(false);
  });

  it("markAllNotificationsRead marks every notification", () => {
    localStorage.setItem("synapse_notifications", JSON.stringify([
      makeNotification("n-1", false),
      makeNotification("n-2", false),
      makeNotification("n-3", false),
    ]));
    markAllNotificationsRead();
    const all = getNotifications();
    expect(all.every((n) => n.read)).toBe(true);
  });
});
