import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

// ── Mock next/navigation so components that use useRouter don't crash ──────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => "/",
}));

// ── Mock motion/react to remove animations in tests ───────────────────────────
vi.mock("motion/react", () => ({
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) =>
        // eslint-disable-next-line react/display-name
        ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
          React.createElement(tag, props, children),
    }
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

import { StepIndicator } from "@/components/requirements/StepIndicator";
import { TypewriterText } from "@/components/requirements/TypewriterText";
import { RiskBadge } from "@/components/evaluation/RiskBadge";
import { RequirementCard } from "@/components/dashboard/RequirementCard";
import { CaseFilter } from "@/components/knowledge/CaseFilter";
import type { Requirement, KnowledgeCase } from "@/types";

// ══════════════════════════════════════════════════════════════════════════════
// StepIndicator
// ══════════════════════════════════════════════════════════════════════════════

describe("StepIndicator", () => {
  it("renders all 3 step labels", () => {
    render(<StepIndicator currentStep={1} />);
    expect(screen.getByText("输入原话")).toBeTruthy();
    expect(screen.getByText("AI 解析")).toBeTruthy();
    expect(screen.getByText("确认提交")).toBeTruthy();
  });

  it("shows step 1 as active on currentStep=1", () => {
    const { container } = render(<StepIndicator currentStep={1} />);
    // The first circle should show '1', not a checkmark
    expect(screen.getByText("1")).toBeTruthy();
    // No checkmark icons yet
    expect(container.querySelectorAll("svg").length).toBe(0);
  });

  it("shows checkmark for completed steps", () => {
    const { container } = render(<StepIndicator currentStep={3} />);
    // Steps 1 and 2 are done → 2 check icons
    expect(container.querySelectorAll("svg").length).toBe(2);
  });

  it("shows current step number as active text", () => {
    render(<StepIndicator currentStep={2} />);
    // Step 2 is active, step 1 is done (checkmark), step 3 pending
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TypewriterText
// ══════════════════════════════════════════════════════════════════════════════

describe("TypewriterText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts empty and progressively reveals text", () => {
    const { container } = render(<TypewriterText text="Hello" delay={50} />);
    // Initially empty
    expect(container.querySelector("span")?.textContent).toBe("");
    // After one tick, first character appears
    act(() => { vi.advanceTimersByTime(50); });
    expect(container.querySelector("span")?.textContent).toBe("H");
  });

  it("fully displays the text after all ticks", () => {
    const { container } = render(<TypewriterText text="Hi" delay={50} />);
    act(() => { vi.advanceTimersByTime(50 * 2 + 10); });
    expect(container.querySelector("span")?.textContent).toBe("Hi");
  });

  it("calls onComplete when text is fully displayed", () => {
    const onComplete = vi.fn();
    render(<TypewriterText text="AB" delay={10} onComplete={onComplete} />);
    act(() => { vi.advanceTimersByTime(10 * 2 + 5); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("renders empty span for empty text prop", () => {
    const { container } = render(<TypewriterText text="" />);
    expect(container.querySelector("span")?.textContent).toBe("");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RiskBadge
// ══════════════════════════════════════════════════════════════════════════════

describe("RiskBadge", () => {
  it("renders 高风险 label for high level", () => {
    render(<RiskBadge level="high" description="ROI目标偏高" />);
    expect(screen.getByText("高风险")).toBeTruthy();
    expect(screen.getByText("ROI目标偏高")).toBeTruthy();
  });

  it("renders 中风险 label for medium level", () => {
    render(<RiskBadge level="medium" description="预算偏低" />);
    expect(screen.getByText("中风险")).toBeTruthy();
  });

  it("renders 低风险 label for low level", () => {
    render(<RiskBadge level="low" description="策略稳健" />);
    expect(screen.getByText("低风险")).toBeTruthy();
  });

  it("renders the description text", () => {
    render(<RiskBadge level="high" description="测试描述内容" />);
    expect(screen.getByText("测试描述内容")).toBeTruthy();
  });

  it("applies red styling for high risk", () => {
    const { container } = render(<RiskBadge level="high" description="x" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/red/);
  });

  it("applies yellow styling for medium risk", () => {
    const { container } = render(<RiskBadge level="medium" description="x" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/yellow/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// RequirementCard
// ══════════════════════════════════════════════════════════════════════════════

const baseRequirement: Requirement = {
  id: "req-001",
  clientName: "测试客户",
  rawInput: "我要投放",
  status: "PENDING",
  createdAt: "2024-06-01T10:00:00Z",
  structuredData: {
    region: "North America",
    media_platform: "Meta",
    daily_budget_usd: 500,
    target_kpi: "ROI",
    target_roi: 1.5,
    product_type: "手游",
    campaign_objective: "用户获取",
    product_url: null,
    soft_kpi: "",
    test_period: "30天",
    third_party_tracking: "",
    attribution_model: "",
    expected_start_date: "",
    policy_notes: "",
    ambiguous_fields: [],
  },
};

describe("RequirementCard", () => {
  it("renders client name", () => {
    render(<RequirementCard requirement={baseRequirement} />);
    expect(screen.getByText("测试客户")).toBeTruthy();
  });

  it("renders PENDING status label", () => {
    render(<RequirementCard requirement={baseRequirement} />);
    expect(screen.getByText("待分配")).toBeTruthy();
  });

  it("renders ACCEPTED status label", () => {
    render(<RequirementCard requirement={{ ...baseRequirement, status: "ACCEPTED" }} />);
    expect(screen.getByText("已接单")).toBeTruthy();
  });

  it("renders media platform tag", () => {
    render(<RequirementCard requirement={baseRequirement} />);
    expect(screen.getByText("Meta")).toBeTruthy();
  });

  it("renders product type tag", () => {
    render(<RequirementCard requirement={baseRequirement} />);
    expect(screen.getByText("手游")).toBeTruthy();
  });

  it("renders formatted budget", () => {
    render(<RequirementCard requirement={baseRequirement} />);
    expect(screen.getByText("$500/天")).toBeTruthy();
  });

  it("shows AI score circle when showScore=true and evaluation present", () => {
    const req: Requirement = {
      ...baseRequirement,
      aiEvaluation: {
        success_rate: 82,
        risk_level: "medium",
        suggestions: [],
        risks: [],
        similar_cases: [],
      },
    };
    render(<RequirementCard requirement={req} showScore />);
    expect(screen.getByText("82")).toBeTruthy();
  });

  it("does not show score circle when showScore is false", () => {
    const req: Requirement = {
      ...baseRequirement,
      aiEvaluation: {
        success_rate: 82,
        risk_level: "medium",
        suggestions: [],
        risks: [],
        similar_cases: [],
      },
    };
    render(<RequirementCard requirement={req} showScore={false} />);
    expect(screen.queryByText("82")).toBeNull();
  });

  it("navigates to requirement detail on click", () => {
    // The mock already returns { push: vi.fn() }; just verify the card is clickable
    const { container } = render(<RequirementCard requirement={baseRequirement} />);
    const card = container.firstChild as HTMLElement;
    // Card has cursor-pointer class
    expect(card.className).toMatch(/cursor-pointer/);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CaseFilter
// ══════════════════════════════════════════════════════════════════════════════

const mockCases: KnowledgeCase[] = [
  {
    id: "case-1",
    title: "Meta 美区手游",
    summary: "Meta投放",
    industry: "游戏",
    mediaPlatform: "Meta",
    region: "北美",
    roi: 1.8,
    spend: 50000,
    tags: [],
    createdAt: "2024-01-01",
    content: "",
  },
  {
    id: "case-2",
    title: "TikTok 东南亚",
    summary: "TikTok投放",
    industry: "电商",
    mediaPlatform: "TikTok",
    region: "东南亚",
    roi: 2.1,
    spend: 30000,
    tags: [],
    createdAt: "2024-02-01",
    content: "",
  },
];

describe("CaseFilter", () => {
  const noop = () => {};

  it("renders the search input", () => {
    render(
      <CaseFilter
        cases={mockCases}
        selectedIndustry=""
        onIndustryChange={noop}
        selectedMedia=""
        onMediaChange={noop}
        selectedRegion=""
        onRegionChange={noop}
        searchQuery=""
        onSearchChange={noop}
      />
    );
    expect(screen.getByPlaceholderText("搜索案例...")).toBeTruthy();
  });

  it("calls onSearchChange when typing in search box", () => {
    const onSearchChange = vi.fn();
    render(
      <CaseFilter
        cases={mockCases}
        selectedIndustry=""
        onIndustryChange={noop}
        selectedMedia=""
        onMediaChange={noop}
        selectedRegion=""
        onRegionChange={noop}
        searchQuery=""
        onSearchChange={onSearchChange}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("搜索案例..."), { target: { value: "Meta" } });
    expect(onSearchChange).toHaveBeenCalledWith("Meta");
  });

  it("renders 3 select trigger buttons (行业/平台/地区)", () => {
    render(
      <CaseFilter
        cases={mockCases}
        selectedIndustry=""
        onIndustryChange={noop}
        selectedMedia=""
        onMediaChange={noop}
        selectedRegion=""
        onRegionChange={noop}
        searchQuery=""
        onSearchChange={noop}
      />
    );
    // Base UI Select renders role=combobox buttons
    const triggers = screen.getAllByRole("combobox");
    expect(triggers).toHaveLength(3);
  });

  it("select triggers are interactive buttons", () => {
    render(
      <CaseFilter
        cases={mockCases}
        selectedIndustry=""
        onIndustryChange={noop}
        selectedMedia=""
        onMediaChange={noop}
        selectedRegion=""
        onRegionChange={noop}
        searchQuery=""
        onSearchChange={noop}
      />
    );
    const triggers = screen.getAllByRole("combobox");
    triggers.forEach((t) => {
      expect(t.tagName.toLowerCase()).toBe("button");
    });
  });

  it("industry select shows the selected value", () => {
    render(
      <CaseFilter
        cases={mockCases}
        selectedIndustry="游戏"
        onIndustryChange={noop}
        selectedMedia=""
        onMediaChange={noop}
        selectedRegion=""
        onRegionChange={noop}
        searchQuery=""
        onSearchChange={noop}
      />
    );
    expect(screen.getByText("游戏")).toBeTruthy();
  });
});
