/**
 * store.test.ts
 *
 * lib/store.ts 已迁移为 REST API 调用层。
 * 这里用 vi.fn() mock 全局 fetch，验证每个 store 函数：
 *   1. 调用了正确的 URL 和 HTTP method
 *   2. 正确解析并返回响应体
 *   3. 在请求失败时向上抛出错误
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRequirements,
  getRequirement,
  updateRequirement,
  createRequirement,
  getMessages,
  addMessage,
  getFollowUps,
  addFollowUp,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getKnowledgeCases,
  addKnowledgeCase,
  getProjects,
  updateProject,
  addRechargeRecord,
} from "@/lib/store";
import type { Requirement, Message, FollowUp, AppNotification, KnowledgeCase, Project } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── Requirements ──────────────────────────────────────────────────────────────

describe("getRequirements", () => {
  it("GET /api/requirements and returns array", async () => {
    const data = [{ id: "r1" }, { id: "r2" }];
    vi.stubGlobal("fetch", mockFetch(data));

    const result = await getRequirements();

    expect(fetch).toHaveBeenCalledWith("/api/requirements", expect.any(Object));
    expect(result).toEqual(data);
  });

  it("throws when response is not ok", async () => {
    vi.stubGlobal("fetch", mockFetch({ error: "Unauthorized" }, 401));
    await expect(getRequirements()).rejects.toThrow("API error 401");
  });
});

describe("getRequirement", () => {
  it("GET /api/requirements/:id", async () => {
    const data = { id: "r1", rawInput: "test" };
    vi.stubGlobal("fetch", mockFetch(data));

    const result = await getRequirement("r1");

    expect(fetch).toHaveBeenCalledWith("/api/requirements/r1", expect.any(Object));
    expect(result).toEqual(data);
  });
});

describe("updateRequirement", () => {
  it("PATCH /api/requirements/:id with correct body", async () => {
    const updated = { id: "r1", status: "ACCEPTED" };
    vi.stubGlobal("fetch", mockFetch(updated));

    const result = await updateRequirement("r1", { status: "ACCEPTED" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/requirements/r1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "ACCEPTED" }),
      })
    );
    expect(result).toEqual(updated);
  });
});

describe("createRequirement", () => {
  it("POST /api/requirements and returns created item", async () => {
    const created = { id: "r-new", status: "DRAFT" };
    vi.stubGlobal("fetch", mockFetch(created, 201));

    const payload = { clientId: "c1", rawInput: "test input", structuredData: {} };
    const result = await createRequirement(payload as Partial<Requirement> as any);

    expect(fetch).toHaveBeenCalledWith(
      "/api/requirements",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
    expect(result).toEqual(created);
  });
});

// ── Messages ──────────────────────────────────────────────────────────────────

describe("getMessages", () => {
  it("GET /api/projects/:id/messages", async () => {
    const msgs = [{ id: "m1", projectId: "p1" }];
    vi.stubGlobal("fetch", mockFetch(msgs));

    const result = await getMessages("p1");

    expect(fetch).toHaveBeenCalledWith("/api/projects/p1/messages", expect.any(Object));
    expect(result).toEqual(msgs);
  });
});

describe("addMessage", () => {
  it("POST /api/projects/:id/messages", async () => {
    const created = { id: "m-new", projectId: "p1", content: "hello" };
    vi.stubGlobal("fetch", mockFetch(created, 201));

    const msg: Pick<Message, "projectId" | "content" | "type"> = {
      projectId: "p1",
      content: "hello",
      type: "TEXT",
    };
    const result = await addMessage(msg);

    expect(fetch).toHaveBeenCalledWith(
      "/api/projects/p1/messages",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual(created);
  });
});

// ── Follow-ups ────────────────────────────────────────────────────────────────

describe("getFollowUps", () => {
  it("GET /api/requirements/:id/followups", async () => {
    const fups = [{ id: "f1", requirementId: "r1" }];
    vi.stubGlobal("fetch", mockFetch(fups));

    const result = await getFollowUps("r1");

    expect(fetch).toHaveBeenCalledWith(
      "/api/requirements/r1/followups",
      expect.any(Object)
    );
    expect(result).toEqual(fups);
  });
});

describe("addFollowUp", () => {
  it("POST /api/requirements/:id/followups", async () => {
    const created = { id: "f-new", requirementId: "r1", content: "追问内容" };
    vi.stubGlobal("fetch", mockFetch(created, 201));

    const fu: FollowUp = {
      id: "f-new",
      requirementId: "r1",
      fromId: "u1",
      fromName: "小王",
      fromRole: "BUSINESS",
      content: "追问内容",
      createdAt: new Date().toISOString(),
    };
    const result = await addFollowUp(fu);

    expect(fetch).toHaveBeenCalledWith(
      "/api/requirements/r1/followups",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "追问内容" }),
      })
    );
    expect(result).toEqual(created);
  });
});

// ── Notifications ─────────────────────────────────────────────────────────────

describe("getNotifications", () => {
  it("GET /api/notifications", async () => {
    const notifs = [{ id: "n1", read: false }];
    vi.stubGlobal("fetch", mockFetch(notifs));

    const result = await getNotifications();

    expect(fetch).toHaveBeenCalledWith("/api/notifications", expect.any(Object));
    expect(result).toEqual(notifs);
  });
});

describe("markNotificationRead", () => {
  it("POST /api/notifications/:id/read then fetches updated list", async () => {
    const notif: AppNotification = {
      id: "n1", type: "NEW_REQUIREMENT", title: "test",
      body: "body", read: false, createdAt: new Date().toISOString(),
    };
    // First call: POST /read, second call: GET /notifications
    vi.stubGlobal("fetch", vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) } as Response)
    );

    await markNotificationRead("n1");

    expect(fetch).toHaveBeenCalledWith(
      "/api/notifications/n1/read",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("markAllNotificationsRead", () => {
  it("reads unread notifications then marks each one", async () => {
    const notifs: AppNotification[] = [
      { id: "n1", type: "NEW_REQUIREMENT", title: "t", body: "b", read: false, createdAt: new Date().toISOString() },
      { id: "n2", type: "EVAL_DONE", title: "t", body: "b", read: true, createdAt: new Date().toISOString() },
      { id: "n3", type: "FOLLOW_UP", title: "t", body: "b", read: false, createdAt: new Date().toISOString() },
    ];

    // First call: GET /notifications; subsequent calls: POST /read for unread ones
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(notifs) } as Response)
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) } as Response)
    );

    await markAllNotificationsRead();

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0] as string);
    expect(calls).toContain("/api/notifications");
    expect(calls).toContain("/api/notifications/n1/read");
    expect(calls).toContain("/api/notifications/n3/read");
    // n2 is already read — should NOT be called
    expect(calls).not.toContain("/api/notifications/n2/read");
  });
});

// ── Knowledge ─────────────────────────────────────────────────────────────────

describe("getKnowledgeCases", () => {
  it("GET /api/knowledge", async () => {
    const cases = [{ id: "k1", title: "手游北美" }];
    vi.stubGlobal("fetch", mockFetch(cases));

    const result = await getKnowledgeCases();

    expect(fetch).toHaveBeenCalledWith("/api/knowledge", expect.any(Object));
    expect(result).toEqual(cases);
  });
});

describe("addKnowledgeCase", () => {
  it("POST /api/knowledge and returns created item", async () => {
    const created = { id: "k-new", title: "新案例" };
    vi.stubGlobal("fetch", mockFetch(created, 201));

    const payload = {
      title: "新案例", industry: "手游", mediaPlatform: "Facebook",
      region: "北美", budgetRange: "$500/天", targetKpi: "ROI",
      strategySummary: "测试策略", keyInsights: ["insight1"],
      tags: ["手游"], isHighlight: false,
    } as Omit<KnowledgeCase, "id" | "createdAt">;

    const result = await addKnowledgeCase(payload);

    expect(fetch).toHaveBeenCalledWith(
      "/api/knowledge",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual(created);
  });
});

// ── Projects ──────────────────────────────────────────────────────────────────

describe("getProjects", () => {
  it("GET /api/projects", async () => {
    const projects = [{ id: "p1", clientName: "星辰游戏" }];
    vi.stubGlobal("fetch", mockFetch(projects));

    const result = await getProjects();

    expect(fetch).toHaveBeenCalledWith("/api/projects", expect.any(Object));
    expect(result).toEqual(projects);
  });
});

describe("updateProject", () => {
  it("PATCH /api/projects/:id", async () => {
    const updated = { id: "p1", status: "COMPLETED" };
    vi.stubGlobal("fetch", mockFetch(updated));

    const result = await updateProject({ id: "p1", status: "COMPLETED" } as Partial<Project> & { id: string });

    expect(fetch).toHaveBeenCalledWith(
      "/api/projects/p1",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(result).toEqual(updated);
  });
});

describe("addRechargeRecord", () => {
  it("POST /api/projects/:id/recharge with amount and note", async () => {
    const response = { record: { id: "rec-1", amount: 500 }, project: { id: "p1" } };
    vi.stubGlobal("fetch", mockFetch(response, 201));

    const result = await addRechargeRecord("p1", 500, "测试充值");

    expect(fetch).toHaveBeenCalledWith(
      "/api/projects/p1/recharge",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ amount: 500, note: "测试充值" }),
      })
    );
    expect(result).toEqual(response);
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe("error handling", () => {
  it("throws with status code when API returns non-2xx", async () => {
    vi.stubGlobal("fetch", mockFetch({ error: "Not Found" }, 404));
    await expect(getRequirement("bad-id")).rejects.toThrow("API error 404");
  });

  it("propagates network errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")));
    await expect(getProjects()).rejects.toThrow("Network failure");
  });
});
