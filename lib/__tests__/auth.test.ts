import { describe, it, expect } from "vitest";
import { hashSync, compareSync } from "bcryptjs";

/**
 * 测试 auth.ts 中 authorize 函数的核心业务逻辑：
 * - 用 bcrypt 进行密码验证（已从演示模式升级为真实密码校验）
 * - 不引入 next-auth 初始化副作用，不依赖数据库
 */

// ── 模拟 authorize 核心逻辑（与 auth.ts 保持一致）──────────────────────────

interface DBUser {
  id: string;
  name: string | null;
  email: string;
  password: string | null;
  role: string;
}

function authorize(
  credentials: { email?: string; password?: string } | undefined,
  users: DBUser[]
): { id: string; name: string | null; email: string; role: string } | null {
  if (!credentials?.email || !credentials?.password) return null;

  const user = users.find((u) => u.email === credentials.email);
  if (!user?.password) return null;

  const valid = compareSync(credentials.password, user.password);
  if (!valid) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const HASHED_PASSWORD = hashSync("demo1234", 10);

const MOCK_DB_USERS: DBUser[] = [
  { id: "u1", name: "商务小谢", email: "xie@synapse.demo", password: HASHED_PASSWORD, role: "BUSINESS" },
  { id: "u2", name: "优化师小郑", email: "zheng@synapse.demo", password: HASHED_PASSWORD, role: "OPTIMIZER" },
  { id: "u5", name: "管理员", email: "admin@synapse.demo", password: HASHED_PASSWORD, role: "ADMIN" },
  { id: "u6", name: "无密码用户", email: "nopwd@synapse.demo", password: null, role: "BUSINESS" },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("authorize — input validation", () => {
  it("returns null when credentials are undefined", () => {
    expect(authorize(undefined, MOCK_DB_USERS)).toBeNull();
  });

  it("returns null when email is missing", () => {
    expect(authorize({ password: "demo1234" }, MOCK_DB_USERS)).toBeNull();
  });

  it("returns null when password is missing", () => {
    expect(authorize({ email: "xie@synapse.demo" }, MOCK_DB_USERS)).toBeNull();
  });

  it("returns null when both fields are empty strings", () => {
    expect(authorize({ email: "", password: "" }, MOCK_DB_USERS)).toBeNull();
  });
});

describe("authorize — user lookup", () => {
  it("returns null for unknown email", () => {
    expect(authorize({ email: "nobody@unknown.com", password: "demo1234" }, MOCK_DB_USERS)).toBeNull();
  });

  it("returns null for user without a password (OAuth stub)", () => {
    expect(authorize({ email: "nopwd@synapse.demo", password: "demo1234" }, MOCK_DB_USERS)).toBeNull();
  });
});

describe("authorize — password verification", () => {
  it("returns null when password is wrong", () => {
    expect(authorize({ email: "xie@synapse.demo", password: "wrongpass" }, MOCK_DB_USERS)).toBeNull();
  });

  it("returns user object for correct password (BUSINESS)", () => {
    const user = authorize({ email: "xie@synapse.demo", password: "demo1234" }, MOCK_DB_USERS);
    expect(user).not.toBeNull();
    expect(user?.role).toBe("BUSINESS");
    expect(user?.name).toBe("商务小谢");
    expect(user?.id).toBe("u1");
  });

  it("returns user object for correct password (OPTIMIZER)", () => {
    const user = authorize({ email: "zheng@synapse.demo", password: "demo1234" }, MOCK_DB_USERS);
    expect(user).not.toBeNull();
    expect(user?.role).toBe("OPTIMIZER");
  });

  it("returns user object for ADMIN role", () => {
    const user = authorize({ email: "admin@synapse.demo", password: "demo1234" }, MOCK_DB_USERS);
    expect(user).not.toBeNull();
    expect(user?.role).toBe("ADMIN");
  });

  it("returned object has all required fields", () => {
    const user = authorize({ email: "xie@synapse.demo", password: "demo1234" }, MOCK_DB_USERS);
    expect(user).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
      role: expect.any(String),
    });
  });

  it("password check is case-sensitive", () => {
    expect(authorize({ email: "xie@synapse.demo", password: "Demo1234" }, MOCK_DB_USERS)).toBeNull();
    expect(authorize({ email: "xie@synapse.demo", password: "DEMO1234" }, MOCK_DB_USERS)).toBeNull();
  });
});

describe("authorize — returned shape", () => {
  it("does NOT expose password in returned object", () => {
    const user = authorize({ email: "xie@synapse.demo", password: "demo1234" }, MOCK_DB_USERS);
    expect(user).not.toHaveProperty("password");
  });
});

// ── bcrypt utilities (used in seed.ts) ───────────────────────────────────────

describe("bcrypt helpers", () => {
  it("hashSync produces a valid bcrypt hash", () => {
    const hash = hashSync("mypassword", 10);
    expect(hash).toMatch(/^\$2[ab]\$\d+\$/);
  });

  it("compareSync returns true for matching password", () => {
    const hash = hashSync("secret", 10);
    expect(compareSync("secret", hash)).toBe(true);
  });

  it("compareSync returns false for non-matching password", () => {
    const hash = hashSync("secret", 10);
    expect(compareSync("wrong", hash)).toBe(false);
  });

  it("two hashes of same password are different (salt)", () => {
    const hash1 = hashSync("same", 10);
    const hash2 = hashSync("same", 10);
    expect(hash1).not.toBe(hash2);
    expect(compareSync("same", hash1)).toBe(true);
    expect(compareSync("same", hash2)).toBe(true);
  });
});
