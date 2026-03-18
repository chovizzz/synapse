import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, generateId } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats positive integer", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
  });

  it("formats large number", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000");
  });
});

describe("formatDate", () => {
  it("accepts a Date object and returns a non-empty string", () => {
    const result = formatDate(new Date("2024-06-01T10:00:00"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts an ISO date string", () => {
    const result = formatDate("2024-06-01T10:00:00");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes month and day information", () => {
    const result = formatDate("2024-06-15T10:00:00");
    // zh-CN locale should include month/day digits
    expect(result).toMatch(/\d/);
  });
});

describe("generateId", () => {
  it("returns a non-empty string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates unique ids each call", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("contains only alphanumeric characters", () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
