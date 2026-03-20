# Synapse — AI-Powered Ad Operations Collaboration Tool
## Project Instructions for AI Studio

---

## 1. What Is This Project

**Synapse** is an internal SaaS collaboration tool for digital advertising agencies.
Tagline: "Let business managers and optimizers work like one brain."

It automates the communication overhead between **Business Managers** (client-facing)
and **Ad Optimizers** (campaign execution) using AI to parse requirements, evaluate
feasibility, and support ongoing strategy dialogue.

**Current state**: Fully functional demo with localStorage persistence (no database).
All data resets when the browser storage is cleared.

---

## 2. Tech Stack (Exact Actual Versions)

```json
{
  "next": "^15.4.9",
  "react": "^19.2.1",
  "react-dom": "^19.2.1",
  "next-auth": "^5.0.0-beta.30",
  "@google/genai": "^1.17.0",
  "@base-ui/react": "^1.3.0",
  "recharts": "^3.8.0",
  "react-markdown": "^10.1.0",
  "motion": "^12.23.24",
  "framer-motion": "^11.11.17",
  "shadcn": "^4.0.8",
  "lucide-react": "^0.553.0",
  "zod": "^3.23.8",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.4",
  "class-variance-authority": "^0.7.1"
}
```

**Dev dependencies:**
```json
{
  "typescript": "^5.9.2",
  "tailwindcss": "^4.x",
  "vitest": "^3.x",
  "@testing-library/react": "latest"
}
```

**NOT used — do not add these:**
- `prisma` / `@prisma/client` (no database)
- `pusher` / `pusher-js` (no realtime)
- `bcryptjs` (no password hashing)
- `@radix-ui/*` (replaced by `@base-ui/react`)
- `@google/generative-ai` (replaced by `@google/genai`)
- `next-auth` v4 (use v5 beta)

---

## 3. AI Provider Setup

### Dual-provider auto-routing in `lib/gemini.ts`

```typescript
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || "";
const GEMINI_KEY   = process.env.GEMINI_API_KEY   || process.env.NEXT_PUBLIC_GEMINI_API_KEY   || "";
const useDeepSeek  = !!DEEPSEEK_KEY;
// If DEEPSEEK_API_KEY is set → use DeepSeek Chat (primary, better JSON output)
// Otherwise → use Google Gemini 2.0 Flash (fallback)
```

### Using AI Studio's built-in Gemini API key

When running in Google AI Studio the key is injected automatically.
Set the environment variable name to `GEMINI_API_KEY` or `NEXT_PUBLIC_GEMINI_API_KEY`.

Use the **new SDK** (`@google/genai`, not the old `@google/generative-ai`):

```typescript
import { GoogleGenAI } from "@google/genai";

let _ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  return _ai;
}

// Non-streaming (M1 parse, M2 evaluate — must return JSON)
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: userMessage,
  config: {
    systemInstruction: systemPrompt,
    responseMimeType: "application/json",
    temperature: 0.1,
  },
});

// Streaming (chat)
const stream = await ai.models.generateContentStream({
  model: "gemini-2.0-flash",
  contents: fullPrompt,
  config: { temperature: 0.6 },
});
for await (const chunk of stream) {
  if (chunk.text) onChunk(chunk.text);
}
```

### Environment Variables

```bash
# .env.local
NEXTAUTH_SECRET=any-random-string-here
NEXTAUTH_URL=http://localhost:3000

# Use at least one AI provider:
GEMINI_API_KEY=AIza...        # Google Gemini (AI Studio built-in key works here)
DEEPSEEK_API_KEY=sk-...       # DeepSeek Chat (optional, takes priority if present)
```

---

## 4. Authentication (NextAuth v5 Beta)

**No database. No password hashing. Demo mode only.**

```typescript
// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Demo: email match only, any password works
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async ({ email }) => {
        const users = [...MOCK_USERS, ...readRegisteredUsers()];
        return users.find(u => u.email === email) ?? null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) { token.id = user.id; token.role = user.role; }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id   = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
```

Registered users are persisted to `data/users.json` (server-side JSON file).
`middleware.ts` protects all routes except `/login`, `/register`, `/api/auth/*`.

**Pre-built demo accounts (any password accepted):**

| User       | Email                   | Role      |
|------------|-------------------------|-----------|
| 商务小谢   | wang@synapse.demo       | BUSINESS  |
| 商务小张   | zhang@synapse.demo      | BUSINESS  |
| 优化师小郑 | li@synapse.demo         | OPTIMIZER |
| 优化师小陈 | chen@synapse.demo       | OPTIMIZER |
| 管理员     | admin@synapse.demo      | ADMIN     |

---

## 5. Complete Directory Structure

```
synapse/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + TopBar shell, responsive drawer
│   │   ├── page.tsx                # Home dashboard (Business / Optimizer views)
│   │   ├── requirements/
│   │   │   ├── page.tsx            # Requirements list with status tabs
│   │   │   ├── new/page.tsx        # 3-step wizard: input → AI parse → confirm
│   │   │   └── [id]/page.tsx       # Detail: 4 tabs (info/evaluation/followup/aichat)
│   │   ├── projects/
│   │   │   ├── page.tsx            # Projects list
│   │   │   └── [id]/page.tsx       # Project board: chat/data tabs + recharge modal
│   │   └── knowledge/
│   │       └── page.tsx            # Case library with 3-axis filters
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── ai/
│   │   │   ├── parse/route.ts      # POST: M1 requirement parsing → StructuredRequirement
│   │   │   ├── evaluate/route.ts   # POST: M2 evaluation (accepts optional chatHistory)
│   │   │   └── chat/route.ts       # POST: streaming SSE chat
│   │   ├── requirements/[id]/route.ts
│   │   ├── projects/route.ts
│   │   ├── knowledge/route.ts
│   │   └── users/route.ts
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── RequirementCard.tsx
│   │   └── Sidebar.tsx             # Nav: 首页看板/需求管理/项目看板/经验库
│   ├── evaluation/
│   │   └── EvaluationCard.tsx      # Score ring + risks + strategy suggestions
│   ├── requirements/
│   │   └── AIChat.tsx              # Streaming chat (props-based lifted state)
│   ├── charts/
│   │   ├── SpendRoiChart.tsx
│   │   └── SparklineChart.tsx
│   ├── knowledge/
│   │   └── CaseFilter.tsx          # Industry / platform / region filters
│   ├── ThemeToggle.tsx
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── gemini.ts                   # AI provider abstraction (DeepSeek + Gemini)
│   ├── store.ts                    # All localStorage CRUD
│   ├── mock-data.ts                # Initial seed data
│   ├── role-context.tsx            # useRole() hook
│   ├── account-data.ts             # Mock ad account data generator
│   ├── theme-provider.tsx
│   ├── utils.ts                    # cn(), formatDate(), formatCurrency(), generateId()
│   └── __tests__/                  # Vitest test files
├── types/
│   └── index.ts                    # All TypeScript interfaces
├── data/
│   └── users.json                  # Registered users (server-side JSON, not DB)
├── auth.ts
├── middleware.ts
└── next.config.ts
```

---

## 6. User Roles & Permissions

```typescript
type UserRole = "BUSINESS" | "OPTIMIZER" | "ADMIN";
```

| Feature                             | BUSINESS | OPTIMIZER | ADMIN |
|-------------------------------------|----------|-----------|-------|
| Create requirements                 | ✅       | ❌        | ✅    |
| See DRAFT requirements              | ✅       | ❌        | ✅    |
| Submit requirement to optimizer     | ✅       | ❌        | ✅    |
| Accept / Reject requirements        | ❌       | ✅        | ✅    |
| Recharge project account            | ✅       | ❌        | ✅    |
| Dashboard: full financial stats     | ✅       | partial   | ✅    |

`useRole()` hook reads from NextAuth session; falls back to `wang@synapse.demo` in dev.

---

## 7. Complete TypeScript Data Models

```typescript
// types/index.ts

type UserRole = "BUSINESS" | "OPTIMIZER" | "ADMIN";

type RequirementStatus =
  | "DRAFT"       // Business-only preview; AI evaluated; not yet submitted
  | "PENDING"     // Submitted, awaiting optimizer
  | "EVALUATING"  // Optimizer reviewing
  | "ACCEPTED"    // Accepted
  | "REJECTED"    // Rejected with reason
  | "IN_PROGRESS" // Campaign live
  | "COMPLETED";

type ProjectStatus = "STRATEGY" | "LAUNCHING" | "OPTIMIZING" | "REVIEWING" | "COMPLETED";

interface User {
  id: string; name: string; email: string; role: UserRole; avatar?: string;
}

interface Client {
  id: string; name: string; industry: string; region: string; ownerId: string;
}

interface StructuredRequirement {
  // 15 fields extracted by AI M1:
  region: string;
  media_platform: string;       // Standardized: "TikTok", "Facebook", "Google Ads"...
  daily_budget_usd: number | null;
  target_kpi: string;           // "ROI", "ROAS", "CPA", "CPM", "安装量" etc.
  target_roi: number | null;
  product_type: string;
  campaign_objective: string;
  product_url: string | null;
  soft_kpi: string;
  test_period: string;
  third_party_tracking: string; // "Adjust", "AppsFlyer", "Firebase" etc.
  attribution_model: string;    // "自投" | "代投" | "自投+代投"
  expected_start_date: string;
  policy_notes: string;
  ambiguous_fields: Array<{ field: string; question: string }>;
}

interface AIEvaluation {
  success_rate: number;             // 0–100
  confidence: "high" | "medium" | "low";
  risks: Array<{ level: "high" | "medium" | "low"; description: string }>;
  strategy_suggestions: [string, string, string]; // Exactly 3
  estimated_timeline: string;
  similar_case_hint: string;
}

interface Requirement {
  id: string; clientId: string; clientName: string;
  creatorId: string; creatorName: string;
  assignedOptimizerId?: string; assignedOptimizerName?: string;
  rawInput: string;
  structuredData?: StructuredRequirement;
  aiEvaluation?: AIEvaluation;
  status: RequirementStatus;
  rejectionReason?: string;
  createdAt: string; updatedAt: string;
}

interface Project {
  id: string; requirementId: string; clientName: string;
  industry: string; mediaPlatform: string;
  businessName: string; optimizerName: string;
  status: ProjectStatus;
  budgetActual?: number;    // Cumulative spend (USD)
  roiActual?: number;
  totalRecharge?: number;   // Cumulative recharge (USD)
  dailySpend?: number;      // Today's spend (USD)
  dailyRecharge?: number;   // Today's recharge (USD)
  updatedAt?: string; createdAt: string;
}

interface RechargeRecord {
  id: string; projectId: string; projectName: string;
  amount: number; note?: string; createdAt: string;
}

interface Message {
  id: string; projectId: string; senderId: string; senderName: string;
  senderRole: UserRole; content: string; type: "TEXT" | "SYSTEM"; createdAt: string;
}

interface Task {
  id: string; projectId: string; title: string;
  assigneeName?: string; dueDate?: string; completed: boolean;
}

interface FollowUp {
  id: string; requirementId: string; fromId: string; fromName: string;
  fromRole: UserRole; content: string; createdAt: string;
}

interface AIChatMessage { role: "user" | "assistant"; content: string; }

interface KnowledgeCase {
  id: string; title: string; industry: string; mediaPlatform: string;
  region: string; budgetRange: string; targetKpi: string;
  targetRoi?: number; actualRoi?: number; strategySummary: string;
  keyInsights: string[]; tags: string[]; isHighlight: boolean; createdAt: string;
}

interface AppNotification {
  id: string;
  type: "NEW_REQUIREMENT" | "EVAL_DONE" | "FOLLOW_UP" | "ACCEPTED" | "REJECTED";
  title: string; body: string; read: boolean; link?: string; createdAt: string;
}
```

---

## 8. localStorage Keys (`lib/store.ts`)

```typescript
"synapse_users"            → User[]            (fallback: MOCK_USERS — 5 demo accounts)
"synapse_clients"          → Client[]          (fallback: MOCK_CLIENTS — 3 clients)
"synapse_requirements"     → Requirement[]     (fallback: MOCK_REQUIREMENTS — 3 items)
"synapse_projects"         → Project[]         (fallback: MOCK_PROJECTS — 4 items)
"synapse_messages"         → Message[]         (fallback: MOCK_MESSAGES — 5 items)
"synapse_tasks"            → Task[]            (fallback: MOCK_TASKS — 4 items)
"synapse_knowledge"        → KnowledgeCase[]   (fallback: MOCK_KNOWLEDGE_CASES — 5 items)
"synapse_notifications"    → AppNotification[] (fallback: MOCK_NOTIFICATIONS — 4 items)
"synapse_followups"        → FollowUp[]        (fallback: [])
"synapse_recharge_records" → RechargeRecord[]  (fallback: [])
```

**Exported store functions:**
- `getProjects / saveProjects / updateProject`
- `getRequirements / saveRequirements`
- `getClients / saveClients`
- `getStoredUsers / saveStoredUsers`
- `getMessages / addMessage`
- `getTasks`
- `getFollowUps / addFollowUp`
- `getNotifications / markNotificationRead / markAllNotificationsRead / addNotification`
- `getRechargeRecords / addRechargeRecord`
- `getKnowledgeCases`

---

## 9. AI Pipeline — Detailed Logic

### M1 — Requirement Parsing (`POST /api/ai/parse`)

Extracts 15 structured fields from raw Chinese client speech.
Must recognize and normalize 40+ ad platform aliases:

```
TT / tt / tiktok / 抖音海外  →  TikTok
FB / fb / facebook / 脸书    →  Facebook
IG / ig / instagram / ins    →  Instagram
FB+IG / Meta                 →  Meta(Facebook & Instagram)
GG / GA / google / 谷歌      →  Google Ads
DV360                        →  Google DV360
YT / youtube / 油管           →  YouTube
Snap / SC / snapchat         →  Snapchat
TW / twitter / X / 推特      →  X(Twitter)
Kwai / 快手海外               →  Kwai
BAI / 百度                    →  百度推广
Bing / 必应                   →  Bing
Pinterest / pin              →  Pinterest
Spotify                      →  Spotify
Yandex                       →  Yandex
Outbrain                     →  Outbrain
Taboola                      →  Taboola
LinkedIn / 领英               →  LinkedIn
Reddit                       →  Reddit
... (40+ total)
```

Multi-platform: joined with `" & "` (e.g., `"Facebook & TikTok"`).
Use `responseMimeType: "application/json"` (Gemini) or `response_format: { type: "json_object" }` (DeepSeek).
Temperature: `0.1` for deterministic structured output.

### M2 — Feasibility Evaluation (`POST /api/ai/evaluate`)

Request body:
```typescript
{ structuredData: StructuredRequirement, chatHistory?: AIChatMessage[] }
```

Scoring rules:
- Game / e-commerce base score: 70–85
- Finance / medical base score: 50–65
- ROI target >20% above industry average → deduct 15–25 pts
- Daily budget <$100 → deduct 10–15 pts
- `confidence`: `"high"` (complete info) / `"medium"` (partial) / `"low"` (severely incomplete)

**When `chatHistory` is provided**, AI must re-evaluate incorporating all parameter changes
discussed in chat (budget adjustments, ROI target changes, platform changes, etc.).
The re-evaluation result must reflect those negotiated updates.

### Chat — Streaming SSE (`POST /api/ai/chat`)

Server streams to client:
```
data: {"chunk": "part of response text"}\n\n
data: {"chunk": "more text"}\n\n
data: [DONE]\n\n

On error:
data: {"error": "AI 对话失败，请重试"}\n\n
```

Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`

Client reads with `response.body.getReader()`, decodes `data:` lines, appends chunks to
`streamingContent` state. On `[DONE]`, moves full content into `messages` array.

Supports `AbortSignal` — client can cancel mid-stream; server catches `AbortError` and closes stream cleanly.

**Keywords that auto-trigger re-evaluation** after the AI reply:
`"重新评估"`, `"重新打分"`, `"更新评估"`, `"重新生成"`, `"重新计算"`, `"重估"`

---

## 10. Sidebar Navigation

```typescript
const NAV_ITEMS = [
  { label: "首页看板", icon: LayoutDashboard, href: "/" },
  { label: "需求管理", icon: FileText,         href: "/requirements" },
  { label: "项目看板", icon: Kanban,           href: "/projects" },
  { label: "经验库",   icon: BookOpen,         href: "/knowledge" },
];
```

Behavior:
- Desktop (`lg+`): static 240px wide, always visible
- Mobile: hidden by default, opens as fixed drawer (`fixed inset-y-0 left-0 z-40`) with overlay
- Hamburger button: `lg:hidden` — only shown on mobile
- Bottom section: current user name + role badge (商务 / 优化师)

---

## 11. Dashboard — Two Role Views

### BusinessDashboard (`role === "BUSINESS"`)

Stats row (4 cards, computed from all projects in localStorage):
| Card | Value | Subtitle |
|------|-------|----------|
| 累计充值 | `sum(project.totalRecharge)` | 当日 `sum(project.dailyRecharge)` |
| 累计消耗 | `sum(project.budgetActual)` | 当日 `sum(project.dailySpend)` |
| 当日充值 | `sum(project.dailyRecharge)` | — |
| 当日消耗 | `sum(project.dailySpend)` | active project count |

Content (5-col grid, 3+2):
- Left (3 cols): pending requirements (DRAFT + PENDING + EVALUATING) + "New Requirement" button
- Right (2 cols): `ProjectRanking` component (spend/ROI tab toggle) + active projects list

### OptimizerDashboard (`role === "OPTIMIZER"`)

Stats row (4 cards):
| Card | Value |
|------|-------|
| 待评估需求 | count of PENDING + EVALUATING (highlighted if >0) |
| 进行中项目 | count of my non-completed projects |
| 当日消耗 | sum of my projects' `dailySpend` |
| 平均实际 ROI | average `roiActual` of my projects |

Content:
- Left: evaluation queue sorted by `createdAt` ascending; first item tagged "最紧急"
- Right: `ProjectRanking` (filtered to my projects) + my projects list

### ProjectRanking Component

Two-tab toggle: **消耗** (spend) / **ROI**

Spend tab: sorted by `budgetActual` descending, shows name + amount + progress bar
ROI tab: sorted by `roiActual` descending, shows name + ROI value with TrendingUp/Down icon

Top 3 ranks: gold / silver / bronze badge. Up to 6 items shown.

---

## 12. Requirement Detail — 4 Tabs

```
Tab "info"       → All 15 structured fields display
Tab "evaluation" → EvaluationCard (score ring + risks + strategy suggestions)
                   isReEvaluating spinner in header
                   EvaluationCard must have key={`${evaluation.success_rate}-${evaluation.confidence}`}
                   (BUSINESS + DRAFT only) submit-to-optimizer panel
Tab "followup"   → FollowUp message thread (both roles can message)
Tab "aichat"     → AIChat streaming component
```

### DRAFT Workflow (Business → Optimizer pipeline)

```
1. Business creates requirement → status: "DRAFT" (OPTIMIZER cannot see)
2. AI evaluation triggers automatically after creation (async, non-blocking)
3. Business reviews evaluation on "evaluation" tab
4. Business chats with AI on "aichat" tab to refine understanding
5. Business clicks "提交给优化师" → selects optimizer → status: "PENDING"
6. Optimizer now sees it in their queue and can accept/reject
```

### AIChat State Architecture (lifted to parent to survive tab switches)

```typescript
// In requirements/[id]/page.tsx:
const [chatMessages, setChatMessages]   = useState<AIChatMessage[]>([]);
const [chatLoading, setChatLoading]     = useState(false);
const [isReEvaluating, setIsReEvaluating] = useState(false);

// AIChat.tsx Props interface:
interface Props {
  requirementData: StructuredRequirement;
  evaluationData: AIEvaluation | undefined;
  messages: AIChatMessage[];
  onMessagesChange: (msgs: AIChatMessage[]) => void;
  loading: boolean;
  onLoadingChange: (v: boolean) => void;
  onReEvaluate: () => void;
  isReEvaluating: boolean;
}
```

### Re-evaluation on tab sync

After `handleReEvaluate` completes:
```typescript
setEvaluation(body.data as AIEvaluation);  // update state
setActiveTab("evaluation");                // auto-switch to evaluation tab
setToast("已结合对话内容重新生成评估");      // show toast
```

---

## 13. Project Board — 2 Tabs

```
Tab "chat" → Message stream (send/receive, localStorage) +
             Right sidebar:
               - Task checklist with completion progress bar
               - Financial data summary card
Tab "data" → Ad account table (mock data via generateAccountData()) +
             SpendRoiChart (Recharts line chart)
```

### Financial Data Summary Card (right sidebar)

Displays per-project:
- 累计充值 (emerald color)
- 累计消耗
- 当日消耗
- 实际 ROI (green if ≥1, red if <1)
- Balance = `totalRecharge - budgetActual` with progress bar
- "已消耗 X%" label

### Recharge Modal (BUSINESS role only)

Trigger: green "充值" button in top info bar + small button inside data summary card.

```typescript
// On confirm:
const record: RechargeRecord = { id: generateId(), projectId, projectName, amount, note, createdAt: now };
addRechargeRecord(record);

// Accumulate dailyRecharge only if updatedAt is today:
const today = new Date().toISOString().slice(0, 10);
const prevDaily = project.updatedAt?.slice(0, 10) === today ? (project.dailyRecharge ?? 0) : 0;
const updated: Project = {
  ...project,
  totalRecharge: (project.totalRecharge ?? 0) + amount,
  dailyRecharge: prevDaily + amount,
  updatedAt: new Date().toISOString(),
};
updateProject(updated);
```

Quick amount buttons: $500, $1,000, $2,000, $5,000

---

## 14. Requirements List Page

Tab filters:
- 全部 (all, except DRAFT hidden from OPTIMIZER)
- 待处理 (PENDING + EVALUATING)
- 进行中 (ACCEPTED + IN_PROGRESS)
- 已完成 (COMPLETED)
- 已拒绝 (REJECTED)

OPTIMIZER never sees DRAFT requirements — filtered at component level.
BUSINESS sees DRAFT in "待处理" bucket.

---

## 15. Knowledge Library Page

- 3-axis filter: industry / media platform / region (all use `@base-ui/react` Select with `itemToStringLabel`)
- Keyword search (title + tags)
- Responsive card grid: 1 → 2 → 3 columns
- Click card → `CaseDetail` modal (full strategy + key insights)
- "分享新案例" button → opens ShareCaseModal to add a new case (saved via addKnowledgeCase to localStorage)
- Stats: count of highlight cases, industries covered

---

## 16. UI Design System

### Color convention — always use CSS variables, never hardcode hex/rgb

```tsx
// Correct:
style={{ color: "hsl(var(--foreground))" }}
style={{ backgroundColor: "hsl(var(--card))" }}
style={{ borderColor: "hsl(var(--border))" }}
style={{ color: "hsl(var(--primary))" }}
style={{ color: "hsl(var(--muted-foreground))" }}

// Also acceptable Tailwind:
className="text-[hsl(var(--foreground))]"
className="bg-[hsl(var(--card))]"
className="border-[hsl(var(--border))]"
```

### Standard component patterns

```tsx
// Card container
<div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))]
                bg-white dark:bg-[hsl(var(--card))] p-5 shadow-sm">

// Primary action button
<button className="px-4 py-2 rounded-xl text-sm font-semibold text-white
                   bg-indigo-600 hover:bg-indigo-700 dark:bg-[hsl(var(--primary))]
                   transition-all">

// Status badge (tiny pill)
<span className="text-[10px] px-2 py-1 rounded-full font-semibold
                 bg-yellow-100 text-yellow-700
                 dark:bg-yellow-500/10 dark:text-yellow-400">

// Text input
<input className="w-full px-3 py-2.5 rounded-xl border border-slate-200
                  dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--secondary))]
                  text-sm outline-none focus:border-indigo-300
                  dark:focus:border-[hsl(var(--primary)/0.5)] transition-colors">

// Page enter animation (always on top-level div)
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

// Toast (fixed bottom-center, 3-second auto-dismiss)
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                flex items-center gap-2 rounded-xl px-4 py-3
                text-sm font-medium text-white shadow-xl
                bg-indigo-600 dark:bg-[hsl(var(--primary))]">
```

### Pill-style tab switcher (standard pattern across all pages)

```tsx
<div className="flex items-center gap-1 p-0.5 rounded-xl
                bg-slate-100 dark:bg-[hsl(var(--secondary))] w-fit">
  {TABS.map(({ key, label, icon: Icon }) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        activeTab === key
          ? "bg-white dark:bg-[hsl(var(--card))] text-slate-900 dark:text-white shadow-sm"
          : "text-slate-500 dark:text-[hsl(var(--muted-foreground))] hover:text-slate-700 dark:hover:text-white"
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  ))}
</div>
```

---

## 17. Responsive Design Rules (Mobile-First, Mandatory)

```tsx
// Grid: ALWAYS start at 1 column
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">  // ✅
<div className="grid grid-cols-4 gap-4">                                  // ❌

// Two-column layouts: ALWAYS stack on mobile
<div className="flex flex-col lg:flex-row gap-6">   // ✅
<div className="flex gap-6">                         // ❌

// Sidebar: drawer on mobile, static on desktop
<div className={`fixed inset-y-0 left-0 z-40 transition-transform
                 lg:static lg:translate-x-0
                 ${open ? "translate-x-0" : "-translate-x-full"}`}>

// Tables: ALWAYS wrap in overflow container
<div className="overflow-x-auto">
  <table className="w-full min-w-[600px]">

// Padding: smaller on mobile
<main className="p-4 sm:p-6">

// Hamburger: only on mobile
<button className="lg:hidden">

// Hide non-critical content on mobile
<span className="hidden sm:inline">Long label text</span>
```

---

## 18. @base-ui/react Select — Critical Usage Note

The `Select` from `@base-ui/react` **requires** `itemToStringLabel` prop to display
the selected item's label in the trigger. Without it, the raw `value` string is shown.

```tsx
<Select
  value={selectedValue}
  onValueChange={(v) => setSelected(v ?? "")}
  itemToStringLabel={(v) => {
    if (!v || v === "__all__") return "全部行业";
    return items.find(i => i.id === v)?.name ?? String(v);
  }}
>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="选择..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="__all__">全部</SelectItem>
    {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
  </SelectContent>
</Select>
```

Always add `itemToStringLabel` to every `Select` instance.

---

## 19. Key Business Rules

1. **DRAFT visibility**: DRAFT requirements are invisible to OPTIMIZER role at all levels
   (list page filter, dashboard stats, requirement cards).

2. **Re-evaluation with chat context**: `handleReEvaluate` passes `chatMessages` as
   `chatHistory` to `/api/ai/evaluate`. After completion:
   - `setEvaluation(newData)` — update evaluation state
   - `setActiveTab("evaluation")` — auto-navigate to show new result
   - `EvaluationCard` must use `key={evaluation.success_rate + "-" + evaluation.confidence}`
     to force re-render when evaluation data changes

3. **Daily recharge tracking**: Check `project.updatedAt` date vs today to decide
   whether to reset or accumulate `dailyRecharge`.

4. **Ad platform normalization**: M1 must map 40+ aliases to canonical names.
   Multi-platform joined with `" & "`.

5. **Project ranking**: Sorted by `budgetActual` (spend) or `roiActual` (ROI) descending.
   Top 3: gold / silver / bronze badges. Shown on both dashboard role views.

6. **Requirement creation (3-step)**:
   - Step 1: select/create client + paste raw text
   - Step 2: POST `/api/ai/parse` → animated field reveal → yellow cards for ambiguous_fields
   - Step 3: confirm/edit all 15 fields + optional optimizer selection → save as DRAFT
   - After save: async POST `/api/ai/evaluate` (non-blocking) → redirect to `/requirements/[id]`

7. **Streaming chat cancellation**: AbortController ref on `AIChat` component.
   On cancel: show "已取消" as final assistant message.
   While streaming: show cursor blink + "停止生成" button.

---

## 20. Absolute Rules (Never Violate)

- No database — no Prisma, no SQL, no MongoDB, no Redis
- No Pusher or WebSocket — use localStorage for message storage
- No password hashing — demo mode, any password accepted
- No `window` / `localStorage` in server components or API routes
- No hardcoded pixel widths for main layout (`w-[600px]` forbidden for layout)
- No grid starting above 1 column without a responsive prefix
- No `@google/generative-ai` — use `@google/genai` (new package name)
- No `next-auth` v4 — use v5 beta (`next-auth@^5.0.0-beta.30`)
- No `@radix-ui/*` — use `@base-ui/react` for headless primitives
- Always add `itemToStringLabel` when using `@base-ui/react` Select
- AI chat `messages` state must live in the parent page, not inside `AIChat` component
- Code comments: only explain non-obvious intent or trade-offs — never narrate what the code does
