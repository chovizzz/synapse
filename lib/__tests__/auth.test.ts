import { describe, it, expect } from "vitest";
import { MOCK_USERS } from "@/lib/mock-data";

/**
 * 测 auth.ts 中 authorize 函数的业务逻辑：
 * 以邮箱匹配用户，密码任意（演示模式）。
 * 此处直接测 MOCK_USERS 数据层，避免引入 next-auth 初始化副作用。
 */

function authorizeByEmail(email: string | undefined) {
  if (!email) return null;
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

describe("authorizeByEmail (mock users)", () => {
  it("returns null when email is undefined", () => {
    expect(authorizeByEmail(undefined)).toBeNull();
  });

  it("returns null for unknown email", () => {
    expect(authorizeByEmail("nobody@unknown.com")).toBeNull();
  });

  it("returns user object for valid email (BUSINESS)", () => {
    const user = authorizeByEmail("wang@synapse.demo");
    expect(user).not.toBeNull();
    expect(user?.role).toBe("BUSINESS");
    expect(user?.name).toBe("商务小谢");
  });

  it("returns user object for valid email (OPTIMIZER)", () => {
    const user = authorizeByEmail("li@synapse.demo");
    expect(user).not.toBeNull();
    expect(user?.role).toBe("OPTIMIZER");
  });

  it("returned user has all required fields", () => {
    const user = authorizeByEmail("admin@synapse.demo");
    expect(user).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email: expect.any(String),
      role: expect.any(String),
    });
  });
});

describe("MOCK_USERS data shape", () => {
  it("contains at least one BUSINESS and one OPTIMIZER user", () => {
    const roles = MOCK_USERS.map((u) => u.role);
    expect(roles).toContain("BUSINESS");
    expect(roles).toContain("OPTIMIZER");
  });

  it("every user has a unique id", () => {
    const ids = MOCK_USERS.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every user has a valid email format", () => {
    for (const user of MOCK_USERS) {
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  });
});
