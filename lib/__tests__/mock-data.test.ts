import { describe, it, expect } from "vitest";
import { generateAccountData } from "@/lib/account-data";

describe("generateAccountData", () => {
  const OVERSEAS_PLATFORMS = ["Meta", "Google Ads", "TikTok", "YouTube"];

  it("returns exactly 4 accounts", () => {
    expect(generateAccountData("project-1")).toHaveLength(4);
  });

  it("only contains overseas platforms (Meta, Google, TikTok, YouTube)", () => {
    const accounts = generateAccountData("project-abc");
    const platforms = accounts.map((a) => a.platform);
    expect(platforms).toEqual(OVERSEAS_PLATFORMS);
  });

  it("does not include Chinese domestic platforms", () => {
    const accounts = generateAccountData("project-x");
    const platforms = accounts.map((a) => a.platform);
    const domestic = ["巨量引擎", "腾讯广告", "百度推广", "快手商业化"];
    domestic.forEach((d) => {
      expect(platforms).not.toContain(d);
    });
  });

  it("account id uses the correct platform prefix", () => {
    const accounts = generateAccountData("project-1");
    const prefixMap: Record<string, string> = {
      Meta: "META",
      "Google Ads": "GAD",
      TikTok: "TTK",
      YouTube: "YTB",
    };
    accounts.forEach((a) => {
      const expectedPrefix = prefixMap[a.platform];
      expect(a.account.startsWith(expectedPrefix + "-")).toBe(true);
    });
  });

  it("spend is a positive integer", () => {
    generateAccountData("any-id").forEach((a) => {
      expect(Number.isInteger(a.spend)).toBe(true);
      expect(a.spend).toBeGreaterThan(0);
    });
  });

  it("roi is a positive float with at most 2 decimal places", () => {
    generateAccountData("any-id").forEach((a) => {
      expect(a.roi).toBeGreaterThan(0);
      expect(String(a.roi).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
    });
  });

  it("ctr is a positive float with at most 1 decimal place", () => {
    generateAccountData("any-id").forEach((a) => {
      expect(a.ctr).toBeGreaterThan(0);
      expect(String(a.ctr).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(1);
    });
  });

  it("conversions is a non-negative integer", () => {
    generateAccountData("any-id").forEach((a) => {
      expect(Number.isInteger(a.conversions)).toBe(true);
      expect(a.conversions).toBeGreaterThanOrEqual(0);
    });
  });

  it("is deterministic — same input always gives same output", () => {
    const first = generateAccountData("stable-project");
    const second = generateAccountData("stable-project");
    expect(first).toEqual(second);
  });

  it("produces different data for different project ids", () => {
    const a = generateAccountData("project-aaa");
    const b = generateAccountData("project-zzz");
    // At least one numeric field should differ
    const sameSpend = a.every((row, i) => row.spend === b[i].spend);
    expect(sameSpend).toBe(false);
  });
});
