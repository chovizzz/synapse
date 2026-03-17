# Synapse — 完整技术规格文档

> 请严格按照本文档的所有规格生成可运行的 Next.js 全栈项目代码。

---

## 一、产品概述

### 1.1 产品定位

**产品名称**：Synapse（神经元突触）

**Slogan**：让商务和优化师像同一个大脑一样协作

**产品类型**：面向广告代投公司内部的 AI 协作 SaaS 工具

**核心价值**：AI 自动处理 80% 的沟通杂务，让商务专注客户关系，让优化师专注策略。

---

### 1.2 用户角色

| 角色 | 英文 Key | 职责 | 核心诉求 |
|------|----------|------|---------|
| 商务（客户经理/销售） | `BUSINESS` | 对接客户、采集需求、维护关系 | 快速拿到评估结果、少做重复沟通 |
| 优化师（广告投放专家） | `OPTIMIZER` | 评估可行性、制定策略、执行投放 | 获取完整准确的需求信息、减少追问 |
| 管理员 | `ADMIN` | 系统管理、数据总览、权限配置 | 查看团队整体运营数据 |

---

### 1.3 核心业务流程

```
客户提出广告代投需求
        ↓
[商务] 打开 Synapse，语音或文字输入客户原话
        ↓
[AI - M1] NLP 解析：提取地区/媒体/预算/KPI 等字段，对模糊项追问
        ↓
生成《客户需求评估卡》，实时推送给匹配的优化师
        ↓
[AI - M2] 自动运行评估模型：输出接单评分 + 风险提示 + 初步策略建议
        ↓
[优化师] 查看评估结果，点击"接单"或"拒绝（附原因）"
        ↓
[商务] 实时收到通知，告知客户结果
        ↓
[项目协同看板] 双方在同一看板上协作：沟通记录、任务、文件、状态追踪
        ↓
项目完成后，系统自动归档至《经验知识库》，供未来推荐参考
```

---

### 1.4 核心痛点与解决方案对应

| 痛点 | Synapse 解法 |
|------|-------------|
| 商务采集需求时遗漏/不准确 | AI M1 结构化提取 + 自动追问 |
| 长链路沟通（客→商→优→商→客）信息损耗 | 协同看板实时同步，消除中间传话 |
| 优化师无法快速给出评估 | AI M2 自动生成评估报告，秒级响应 |
| 历史经验无法沉淀复用 | 知识库自动归档 + 相似案例推荐 |

---

## 二、技术栈

### 2.1 依赖清单（精确版本）

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.22.0",
    "next-auth": "^4.24.10",
    "@auth/prisma-adapter": "^2.7.2",
    "@google/generative-ai": "^0.21.0",
    "pusher": "^5.2.0",
    "pusher-js": "^8.4.0",
    "zod": "^3.23.8",
    "bcryptjs": "^2.4.3",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "lucide-react": "^0.462.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-badge": "^1.0.0",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.2.1",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-toast": "^1.2.2",
    "class-variance-authority": "^0.7.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^11.11.17"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.6",
    "prisma": "^5.22.0",
    "typescript": "^5.6.3",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

### 2.2 技术栈说明

| 层级 | 技术 | 选型理由 |
|------|------|---------|
| 框架 | Next.js 15 App Router | 前后端一体，Vercel 原生支持，Server Actions 减少 boilerplate |
| 语言 | TypeScript 5 | 类型安全，减少运行时错误 |
| UI | Tailwind CSS + shadcn/ui | 高度可定制，组件质量高，深色商务风格 |
| ORM | Prisma 5 | 类型安全的数据库访问，迁移管理方便 |
| 数据库 | Supabase PostgreSQL | Vercel 免费集成，自带连接池 |
| 认证 | NextAuth.js v4 + Prisma Adapter | 成熟方案，支持 RBAC，Session 管理简单 |
| AI | Google Gemini 1.5 Flash | 速度快、中文理解好、免费额度充足 |
| 实时通信 | Pusher Channels | Vercel Serverless 兼容，免费额度够用 |
| 动画 | Framer Motion | 字段填充动画效果好 |
| 验证 | Zod | 前后端共享 schema，API 类型安全 |

---

## 三、完整目录结构

```
synapse/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                    # 登录页面
│   ├── (dashboard)/
│   │   ├── layout.tsx                      # 主布局：侧边栏 + 顶栏
│   │   ├── page.tsx                        # 首页看板
│   │   ├── requirements/
│   │   │   ├── page.tsx                    # 需求列表页
│   │   │   ├── new/
│   │   │   │   └── page.tsx                # 新建需求（AI对话流程）
│   │   │   └── [id]/
│   │   │       └── page.tsx                # 需求详情 + AI评估卡
│   │   ├── projects/
│   │   │   ├── page.tsx                    # 项目列表
│   │   │   └── [id]/
│   │   │       └── page.tsx                # 项目协同看板
│   │   └── knowledge/
│   │       └── page.tsx                    # 经验知识库
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts                # NextAuth 处理器
│   │   ├── ai/
│   │   │   ├── parse/
│   │   │   │   └── route.ts                # POST: Gemini M1 需求解析
│   │   │   └── evaluate/
│   │   │       └── route.ts                # POST: Gemini M2 评估建议
│   │   ├── requirements/
│   │   │   ├── route.ts                    # GET: 列表 / POST: 创建
│   │   │   └── [id]/
│   │   │       └── route.ts                # GET: 详情 / PATCH: 更新状态
│   │   ├── projects/
│   │   │   ├── route.ts                    # GET: 列表
│   │   │   └── [id]/
│   │   │       ├── route.ts                # GET/PATCH: 项目详情
│   │   │       └── messages/
│   │   │           └── route.ts            # GET: 消息列表 / POST: 发送消息
│   │   ├── knowledge/
│   │   │   └── route.ts                    # GET: 案例列表 / POST: 创建案例
│   │   └── pusher/
│   │       └── auth/
│   │           └── route.ts                # Pusher 私有频道认证
│   ├── globals.css
│   └── layout.tsx                          # 根布局
├── components/
│   ├── ui/                                 # shadcn/ui 基础组件（自动生成）
│   ├── layout/
│   │   ├── Sidebar.tsx                     # 侧边导航栏
│   │   ├── TopBar.tsx                      # 顶部栏（用户头像+通知）
│   │   └── RoleSwitch.tsx                  # 角色视图切换（仅开发演示用）
│   ├── dashboard/
│   │   ├── StatsCard.tsx                   # 统计数字卡片
│   │   ├── RequirementQueue.tsx            # 待处理需求队列
│   │   └── ProjectList.tsx                 # 进行中项目列表
│   ├── requirements/
│   │   ├── RawInputForm.tsx                # 原话输入框 + 示例按钮
│   │   ├── ParseAnimation.tsx              # 字段逐个填充动画
│   │   ├── StructuredForm.tsx              # 结构化字段确认表单
│   │   ├── RequirementCard.tsx             # 需求卡片（列表用）
│   │   └── RequirementDetail.tsx           # 需求详情展示
│   ├── evaluation/
│   │   ├── ScoreCircle.tsx                 # 圆形评分进度条
│   │   ├── RiskBadge.tsx                   # 风险等级标签
│   │   ├── StrategyList.tsx                # 策略建议列表
│   │   ├── SimilarCases.tsx                # 相似历史案例
│   │   └── EvaluationCard.tsx              # 评估卡完整组件（组合以上）
│   ├── collaboration/
│   │   ├── MessageFeed.tsx                 # 消息流（支持实时更新）
│   │   ├── MessageInput.tsx                # 消息输入框（支持@提及）
│   │   ├── TaskList.tsx                    # 任务清单
│   │   ├── FileList.tsx                    # 文件列表
│   │   └── ProjectHeader.tsx               # 项目顶部信息栏
│   └── knowledge/
│       ├── CaseCard.tsx                    # 案例卡片
│       ├── CaseFilter.tsx                  # 筛选栏（行业/媒体/地区）
│       └── CaseDetail.tsx                  # 案例详情弹窗
├── lib/
│   ├── gemini.ts                           # Gemini 客户端 + Prompt 常量
│   ├── prisma.ts                           # Prisma 单例客户端
│   ├── auth.ts                             # NextAuth 配置
│   ├── pusher.ts                           # Pusher 服务端客户端
│   ├── pusher-client.ts                    # Pusher 浏览器端客户端
│   ├── utils.ts                            # cn() 工具函数等
│   └── validations.ts                      # Zod Schema 定义
├── types/
│   └── index.ts                            # 全局 TypeScript 类型定义
├── prisma/
│   ├── schema.prisma                       # 数据模型
│   └── seed.ts                             # 种子数据
├── .env.local.example                      # 环境变量模板
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 四、Prisma 数据模型（完整 Schema）

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ==================== 枚举 ====================

enum UserRole {
  BUSINESS    // 商务
  OPTIMIZER   // 优化师
  ADMIN       // 管理员
}

enum RequirementStatus {
  PENDING     // 待分配
  EVALUATING  // 评估中（已推送给优化师，AI正在/已完成评估）
  ACCEPTED    // 已接单
  REJECTED    // 已拒绝
  IN_PROGRESS // 投放中（已转为项目）
  COMPLETED   // 已完成
}

enum ProjectStatus {
  STRATEGY    // 策略制定中
  LAUNCHING   // 启动投放中
  OPTIMIZING  // 优化调整中
  REVIEWING   // 复盘中
  COMPLETED   // 已完成
}

enum MessageType {
  TEXT
  FILE
  SYSTEM      // 系统消息（如状态变更通知）
}

enum RiskLevel {
  HIGH
  MEDIUM
  LOW
}

// ==================== 模型 ====================

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // bcrypt hash
  role          UserRole  @default(BUSINESS)
  teamId        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 关联
  accounts           Account[]
  sessions           Session[]
  ownedClients       Client[]          @relation("ClientOwner")
  createdRequirements Requirement[]    @relation("RequirementCreator")
  assignedRequirements Requirement[]   @relation("RequirementOptimizer")
  sentMessages       Message[]
  projectMemberships ProjectMember[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Client {
  id          String   @id @default(cuid())
  name        String                    // 客户公司名
  industry    String                    // 行业（游戏/电商/金融/教育等）
  region      String                    // 主要市场区域
  contactName String?                   // 联系人姓名
  contactInfo String?                   // 联系方式
  notes       String?  @db.Text         // 备注
  ownerId     String                    // 负责的商务 userId
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner        User          @relation("ClientOwner", fields: [ownerId], references: [id])
  requirements Requirement[]

  @@map("clients")
}

model Requirement {
  id              String            @id @default(cuid())
  clientId        String
  creatorId       String                            // 创建的商务 userId
  assignedOptimizerId String?                       // 分配的优化师 userId

  // 原始输入
  rawInput        String  @db.Text                  // 商务输入的客户原话

  // AI 解析后的结构化数据（JSON）
  structuredData  Json?
  // 结构示例：
  // {
  //   "region": "北美",
  //   "media_platform": "Facebook",
  //   "daily_budget_usd": 500,
  //   "target_kpi": "ROI",
  //   "target_roi": 1.2,
  //   "product_type": "手游",
  //   "campaign_objective": "用户获取",
  //   "ambiguous_fields": []
  // }

  // AI 评估结果（JSON）
  aiEvaluation    Json?
  // 结构示例：
  // {
  //   "success_rate": 82,
  //   "confidence": "medium",
  //   "risks": [{"level": "high", "description": "目标ROI 1.2 在同类产品中仅30%达成"}],
  //   "strategy_suggestions": ["建议测试期先投Facebook", "出价方式选择自动出价", "初期预算可降至300"],
  //   "estimated_timeline": "7-14 天见效",
  //   "similar_case_hint": "类似游戏产品在北美ROI 1.0-1.1 成功率约65%"
  // }

  status          RequirementStatus @default(PENDING)
  rejectionReason String?  @db.Text                 // 拒绝原因

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  client          Client    @relation(fields: [clientId], references: [id])
  creator         User      @relation("RequirementCreator", fields: [creatorId], references: [id])
  assignedOptimizer User?   @relation("RequirementOptimizer", fields: [assignedOptimizerId], references: [id])
  project         Project?

  @@map("requirements")
}

model Project {
  id             String        @id @default(cuid())
  requirementId  String        @unique
  status         ProjectStatus @default(STRATEGY)

  // 投放数据（实际数据，后期填充）
  budgetActual   Float?                            // 实际花费（美元）
  roiActual      Float?                            // 实际 ROI
  impressions    Int?                              // 曝光量
  clicks         Int?                              // 点击量
  conversions    Int?                              // 转化量

  startDate      DateTime?
  endDate        DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  requirement    Requirement    @relation(fields: [requirementId], references: [id])
  members        ProjectMember[]
  messages       Message[]
  files          ProjectFile[]
  tasks          Task[]
  knowledgeCase  KnowledgeCase?

  @@map("projects")
}

model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  joinedAt  DateTime @default(now())

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@unique([projectId, userId])
  @@map("project_members")
}

model Message {
  id        String      @id @default(cuid())
  projectId String
  senderId  String
  content   String      @db.Text
  type      MessageType @default(TEXT)
  metadata  Json?       // 文件消息时存储文件信息
  createdAt DateTime    @default(now())

  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sender    User    @relation(fields: [senderId], references: [id])

  @@map("messages")
}

model ProjectFile {
  id          String   @id @default(cuid())
  projectId   String
  name        String
  url         String
  size        Int?
  mimeType    String?
  uploadedBy  String
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_files")
}

model Task {
  id          String    @id @default(cuid())
  projectId   String
  title       String
  assigneeId  String?
  dueDate     DateTime?
  completed   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("tasks")
}

model KnowledgeCase {
  id              String   @id @default(cuid())
  projectId       String   @unique
  title           String
  industry        String
  mediaPlatform   String
  region          String
  budgetRange     String   // 如 "$100-500/天"
  targetKpi       String
  targetRoi       Float?
  actualRoi       Float?
  strategySummary String   @db.Text  // 策略摘要（2-3段）
  keyInsights     String   @db.Text  // 关键洞察（要点列表，JSON字符串）
  tags            String[]           // 标签数组
  isHighlight     Boolean  @default(false)  // 是否为优秀案例

  createdAt       DateTime @default(now())

  project         Project  @relation(fields: [projectId], references: [id])

  @@map("knowledge_cases")
}
```

---

## 五、页面详细规格

### P1：首页看板（`/`）

**商务视角布局：**
```
┌─────────────────────────────────────────────────────┐
│  顶部统计栏（4个数字卡片）                             │
│  本月新需求：12  |  进行中：5  |  完成率：73%  |  平均评估时间：18分钟  │
├──────────────────────────┬──────────────────────────┤
│  待处理需求（左栏 60%）    │  我的项目（右栏 40%）      │
│                          │                          │
│  [需求卡片]               │  [项目列表]               │
│  客户名 + 行业标签         │  客户名 + 状态Tag         │
│  媒体平台 + 预算           │  优化师头像               │
│  状态 + 创建时间           │  最近消息预览             │
│                          │                          │
│  [新建需求 按钮]           │                          │
└──────────────────────────┴──────────────────────────┘
```

**优化师视角布局：**
```
┌─────────────────────────────────────────────────────┐
│  顶部统计栏：待评估：3  |  进行中：4  |  本月接单：8  |  平均ROI：1.18  │
├──────────────────────────┬──────────────────────────┤
│  待评估需求队列（左栏）    │  我的项目（右栏）          │
│  按创建时间降序            │  按状态分组               │
│  带 AI 评估等待动画         │                          │
└──────────────────────────┴──────────────────────────┘
```

**数据来源：**
- 统计数字：`/api/requirements?stats=true` + `/api/projects?stats=true`
- 需求列表：`/api/requirements?status=PENDING,EVALUATING&limit=10`
- 项目列表：`/api/projects?mine=true&limit=10`

**交互细节：**
- 点击需求卡 → 跳转 `/requirements/[id]`
- 点击项目卡 → 跳转 `/projects/[id]`
- 点击"新建需求"→ 跳转 `/requirements/new`
- 有未读消息时，顶栏铃铛图标显示红点数字

---

### P2：新建需求（`/requirements/new`）

**三步向导布局：**

**Step 1 - 原话输入：**
```
┌──────────────────────────────────────────────────────┐
│  页面标题：新建客户需求                                │
│  步骤指示器：① 输入原话  ②  AI解析  ③  确认提交         │
├──────────────────────────────────────────────────────┤
│  先选择/创建客户：[下拉选择框 或 输入新客户名]           │
├──────────────────────────────────────────────────────┤
│  textarea 大输入框（高度 160px）                      │
│  placeholder: "把客户说的原话粘贴在这里，比如："          │
│  "我们想在北美推一款手游，ROI 要到 1.2，                │
│   预算每天 500 美金，跑 Facebook"                     │
│                                                      │
│  [一键填入演示数据] 按钮（灰色小文字，右下角）           │
├──────────────────────────────────────────────────────┤
│                          [AI 解析 →] 按钮（蓝色大按钮）│
└──────────────────────────────────────────────────────┘
```

**Step 2 - AI 解析动画（核心演示效果）：**
- 顶部显示"AI 正在理解需求..." + 旋转动画
- 结构化表单的字段逐个出现（Framer Motion stagger 动画，每个字段间隔 200ms）
- 每个字段填充时有打字机效果
- `ambiguous_fields` 若有值，在底部用黄色卡片展示追问提示
- 字段说明：

| 字段 | 中文标签 | 类型 | 备注 |
|------|---------|------|------|
| region | 投放地区 | 文字 | 如"北美"/"东南亚" |
| media_platform | 媒体平台 | 文字 | 如"Facebook"/"TikTok" |
| daily_budget_usd | 日预算（美元） | 数字 | |
| target_kpi | 核心指标 | 文字 | ROI/ROAS/CPA/CPM |
| target_roi | 目标 ROI | 数字 | 可为 null |
| product_type | 产品类型 | 文字 | |
| campaign_objective | 推广目标 | 文字 | 用户获取/品牌曝光等 |

**Step 3 - 确认提交：**
- 展示填充好的字段，支持手动修改
- 选择指定优化师（可选，留空则系统分配）
- [提交需求] 按钮 → POST `/api/requirements` → 成功后跳转需求详情页
- 后台同时触发 Pusher 通知所有 OPTIMIZER 角色用户

---

### P3：需求详情 + AI 评估卡（`/requirements/[id]`）

**两栏布局：**
```
┌────────────────────────────┬────────────────────────┐
│  左栏（55%）               │  右栏（45%）            │
│  需求详情                  │  AI 评估卡              │
│                            │                        │
│  客户信息块                │  [圆形评分 82%]         │
│  ├ 客户名称                │  接单成功率             │
│  ├ 行业标签                │                        │
│  └ 商务负责人               │  风险提示               │
│                            │  🔴 高：ROI 目标激进    │
│  需求参数块                │  🟡 中：预算偏低         │
│  ├ 投放地区                │                        │
│  ├ 媒体平台                │  初步策略建议            │
│  ├ 日预算                  │  1. 建议测试期先...      │
│  ├ 目标 KPI                │  2. 出价方式选择...      │
│  └ 目标 ROI                │  3. 初期预算可...        │
│                            │                        │
│  原始输入（可折叠）          │  相似历史案例            │
│                            │  [案例卡片 x2]          │
│  状态时间线                │                        │
│  ○ 创建需求 10:30          │  ── 优化师操作区 ──      │
│  ○ AI 评估完成 10:31       │  [接单] [拒绝] [追问]   │
│  ● 等待优化师响应           │  （仅优化师可见）        │
└────────────────────────────┴────────────────────────┘
```

**数据来源：**
- `GET /api/requirements/[id]`（含 structuredData + aiEvaluation）

**交互：**
- 优化师点击"接单" → PATCH `/api/requirements/[id]` `{status: "ACCEPTED"}` → 系统自动创建 Project → 跳转协同看板
- 优化师点击"拒绝" → 弹出 Dialog 输入拒绝原因 → PATCH `{status: "REJECTED", rejectionReason: "..."}`
- 优化师点击"追问" → 向商务发送系统消息，请求补充信息

---

### P4：项目协同看板（`/projects/[id]`）

**顶部 + 三栏布局：**
```
┌─────────────────────────────────────────────────────────┐
│  项目顶部信息栏                                           │
│  客户名 · 行业 · 媒体平台 · 预算 ‖  状态：[投放中 🟢]   │
│  商务：小王 头像  |  优化师：小李 头像  |  创建：3天前    │
├──────────────────────┬────────────────────────────────┤
│  消息流（左 60%）     │  右侧栏（40%）                 │
│                      │  ┌─────────────────────────┐  │
│  [系统消息]           │  │ 任务清单                  │  │
│  需求已接单，项目启动  │  │ ☐ 搭建广告账户  [小李]    │  │
│                      │  │ ☑ 提交素材    [小王]      │  │
│  [小王 10:30]         │  │ ☐ 提交月报    [小李] ⚠️   │  │
│  客户说素材可以用      │  └─────────────────────────┘  │
│  蓝色系色调           │  ┌─────────────────────────┐  │
│                      │  │ 文件                     │  │
│  [小李 10:35]         │  │ 📎 创意素材.zip           │  │
│  好的，我明天开始搭    │  │ 📎 策略文档.pdf            │  │
│                      │  └─────────────────────────┘  │
│  [小王 14:20]         │  ┌─────────────────────────┐  │
│  @小李 客户要求加投    │  │ 投放数据摘要（Mock）      │  │
│  TikTok，临时需求      │  │ 花费: $1,240             │  │
│                      │  │ ROI: 1.08 📈             │  │
│  [输入框]             │  │ 点击: 3,420              │  │
│  [消息输入...]  [发送] │  └─────────────────────────┘  │
└──────────────────────┴────────────────────────────────┘
```

**实时消息实现（Pusher）：**
- 频道名：`private-project-${projectId}`
- 事件：`new-message`
- 发送消息后，服务端触发 Pusher 推送，客户端订阅更新 UI

**数据来源：**
- 项目信息：`GET /api/projects/[id]`
- 消息列表：`GET /api/projects/[id]/messages`（初始加载最近50条）
- 实时消息：Pusher subscription

---

### P5：经验知识库（`/knowledge`）

**布局：**
```
┌─────────────────────────────────────────────────────┐
│  页面标题：经验知识库    [+ 新增案例 按钮（仅Admin）]   │
├─────────────────────────────────────────────────────┤
│  搜索框：[搜索关键词...] [行业 ▾] [媒体平台 ▾] [地区 ▾] │
├─────────────────────────────────────────────────────┤
│  案例卡片网格（3列，响应式降为2/1列）                  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ ⭐ 优秀   │  │          │  │          │         │
│  │ 游戏     │  │ 电商     │  │ 金融     │         │
│  │ Facebook │  │ TikTok   │  │ Google   │         │
│  │ 北美     │  │ 东南亚   │  │ 欧洲     │         │
│  │ ROI 1.35 │  │ ROAS 4.2 │  │ CPA $12  │         │
│  │ [展开详情]│  │ [展开详情]│  │ [展开详情]│         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

**案例卡片字段：**
- 顶部：行业标签 + 媒体平台徽章 + ⭐ 优秀案例标记
- 主体：预算范围、目标KPI、实际ROI/ROAS、策略摘要（截断50字）
- 底部：地区标签组、创建时间

**点击展开 Dialog：**
- 完整策略摘要
- 关键洞察（要点列表）
- 所用素材类型
- 时间线效果数据
- 底部"参考此案例创建需求"按钮

---

## 六、API 路由规格

### 6.1 AI 相关

**`POST /api/ai/parse`**

Request:
```typescript
{
  rawInput: string  // 客户原话，最长 2000 字符
}
```

Response（成功）:
```typescript
{
  success: true,
  data: {
    region: string,
    media_platform: string,
    daily_budget_usd: number | null,
    target_kpi: string,
    target_roi: number | null,
    product_type: string,
    campaign_objective: string,
    ambiguous_fields: Array<{
      field: string,
      question: string
    }>
  }
}
```

Response（失败）:
```typescript
{
  success: false,
  error: string
}
```

实现要点：
- 调用 Gemini Flash，使用 M1 系统提示词
- 要求 JSON 输出，使用 `responseMimeType: "application/json"`
- 超时 15 秒
- 错误时返回友好提示

---

**`POST /api/ai/evaluate`**

Request:
```typescript
{
  requirementId: string,
  structuredData: {
    region: string,
    media_platform: string,
    daily_budget_usd: number | null,
    target_kpi: string,
    target_roi: number | null,
    product_type: string,
    campaign_objective: string
  }
}
```

Response（成功）:
```typescript
{
  success: true,
  data: {
    success_rate: number,      // 0-100
    confidence: "high" | "medium" | "low",
    risks: Array<{
      level: "high" | "medium" | "low",
      description: string
    }>,
    strategy_suggestions: string[],   // 3条
    estimated_timeline: string,
    similar_case_hint: string
  }
}
```

实现要点：
- 调用 Gemini Flash，使用 M2 系统提示词
- 同时将评估结果更新到 Requirement 的 `aiEvaluation` 字段
- 将 Requirement.status 更新为 `EVALUATING`
- 通过 Pusher 通知指定优化师

---

### 6.2 需求管理

**`GET /api/requirements`**

Query params:
- `status`: 逗号分隔的状态筛选（如 `PENDING,EVALUATING`）
- `mine`: `true` 则只返回自己创建/分配的
- `stats`: `true` 则返回统计数字而非列表
- `limit`: 数量限制，默认 20
- `cursor`: 游标分页

Response:
```typescript
{
  requirements: Array<{
    id: string,
    client: { name: string, industry: string },
    structuredData: object | null,
    status: RequirementStatus,
    creator: { name: string, image: string | null },
    assignedOptimizer: { name: string, image: string | null } | null,
    createdAt: string
  }>,
  nextCursor: string | null
}
```

权限控制：
- `BUSINESS`：只能看到自己创建的需求（`creatorId === userId`）
- `OPTIMIZER`：可以看到所有 PENDING/EVALUATING 状态 + 分配给自己的
- `ADMIN`：可以看到所有

---

**`POST /api/requirements`**

Request:
```typescript
{
  clientId: string,          // 已有客户 ID
  clientName?: string,       // 新客户名（clientId 为空时使用）
  rawInput: string,
  structuredData: object,    // 前端 AI 解析后的结构化数据
  assignedOptimizerId?: string
}
```

实现要点：
1. 若 `clientName` 有值且 `clientId` 为空，先创建 Client
2. 创建 Requirement
3. 异步触发 `POST /api/ai/evaluate`（不阻塞响应）
4. 通过 Pusher 频道 `requirements` 广播 `new-requirement` 事件

---

**`PATCH /api/requirements/[id]`**

Request:
```typescript
{
  status?: RequirementStatus,
  rejectionReason?: string,
  assignedOptimizerId?: string
}
```

实现要点：
- 若 status 变为 `ACCEPTED`：自动创建 Project + ProjectMember（商务+优化师）
- 状态变更后通过 Pusher 推送通知 `requirement-updated`

---

### 6.3 项目与消息

**`GET /api/projects/[id]`**

Response:
```typescript
{
  project: {
    id: string,
    status: ProjectStatus,
    requirement: {
      structuredData: object,
      client: { name: string, industry: string },
      creator: { name: string },
      assignedOptimizer: { name: string }
    },
    members: Array<{ user: { id, name, image, role } }>,
    tasks: Task[],
    files: ProjectFile[],
    // 投放数据摘要（Mock 字段）
    budgetActual: number | null,
    roiActual: number | null
  }
}
```

---

**`GET /api/projects/[id]/messages`**

Query: `limit=50&before=<messageId>`

Response:
```typescript
{
  messages: Array<{
    id: string,
    content: string,
    type: MessageType,
    sender: { id, name, image, role },
    createdAt: string
  }>,
  hasMore: boolean
}
```

---

**`POST /api/projects/[id]/messages`**

Request:
```typescript
{
  content: string,
  type: "TEXT" | "SYSTEM"
}
```

实现要点：
- 创建 Message 记录
- 触发 Pusher 事件 `new-message` 到频道 `private-project-${projectId}`

---

**`POST /api/pusher/auth`**

Pusher 私有频道认证端点，验证当前 session 用户是否有权限订阅该频道。

---

### 6.4 知识库

**`GET /api/knowledge`**

Query:
- `industry`, `mediaPlatform`, `region`: 筛选
- `q`: 关键词搜索（匹配 title + strategySummary + tags）
- `limit`: 默认 20

---

## 七、Gemini Prompt 完整规格

### 7.1 lib/gemini.ts 完整实现

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.2,
    maxOutputTokens: 1024,
  },
});

// ==================== M1：需求解析 ====================

export const PARSE_SYSTEM_PROMPT = `你是一个广告代投公司的AI需求助理，名叫 Synapse。
你的工作是从商务人员描述的客户原话中，精准提取广告投放需求的关键信息。

【提取规则】
1. region（投放地区）：提取目标投放的国家或地区，如"北美"、"美国"、"东南亚"、"全球"
2. media_platform（媒体平台）：提取广告平台，如 Facebook、TikTok、Google、Instagram、YouTube。若提到多个，取主要的一个
3. daily_budget_usd（日预算美元）：提取每日预算数字，统一转换为美元数字类型。若说"每月10万"则换算为日均
4. target_kpi（核心指标）：提取主要优化目标，如 ROI、ROAS、CPA、CPM、CTR、安装量
5. target_roi（目标ROI）：若 KPI 是 ROI，提取具体数值（纯数字）；否则为 null
6. product_type（产品类型）：提取产品品类，如"手游"、"女装"、"金融App"、"教育课程"
7. campaign_objective（推广目标）：提取推广目的，如"用户获取"、"品牌曝光"、"促销转化"、"App安装"
8. ambiguous_fields（模糊字段）：对于无法从原话中明确提取的字段，列出字段名和建议追问的话术

【边界情况处理】
- 若原话提到"ROI 1.2"，target_kpi = "ROI"，target_roi = 1.2
- 若提到"ROAS 4倍"，target_kpi = "ROAS"，target_roi = null（ROAS 不等于 ROI）
- 若预算单位是人民币，按当前汇率约 7 进行换算
- 若媒体平台说"社媒"，media_platform = "Facebook/Instagram" 并在 ambiguous_fields 中追问具体平台
- 若地区说"海外"，region = "全球" 并在 ambiguous_fields 中追问重点地区

【输出格式】严格按照以下 JSON 结构输出，不要有任何额外文字：
{
  "region": string,
  "media_platform": string,
  "daily_budget_usd": number | null,
  "target_kpi": string,
  "target_roi": number | null,
  "product_type": string,
  "campaign_objective": string,
  "ambiguous_fields": [
    {
      "field": string,
      "question": string
    }
  ]
}`;

// ==================== M2：评估建议 ====================

export const EVALUATE_SYSTEM_PROMPT = `你是一位拥有5年以上 Facebook、TikTok、Google 广告代投经验的资深评估专家。
你需要基于广告行业知识和经验，对给定的投放需求进行专业评估。

【评估维度】
1. success_rate（接单成功率）：基于需求可行性给出 0-100 的整数分。参考标准：
   - ROI 目标超过行业均值 20% 以上 → 降分 15-25 分
   - 日预算低于 $100 → 降分 10-15 分（数据积累慢）
   - 大众化产品（电商/游戏）可行性通常较高（70-85分基础）
   - 强监管行业（金融/医疗）可行性较低（50-65分基础）

2. confidence（置信度）：
   - high：需求信息完整，行业经验充足
   - medium：部分信息模糊，或行业案例有限
   - low：信息严重不足，或非常规需求

3. risks（风险列表，2-4条）：
   - level: "high" | "medium" | "low"
   - 常见风险：ROI目标过高、预算过低难以积累数据、竞争激烈的行业、不熟悉的地区等

4. strategy_suggestions（策略建议，严格3条）：
   - 具体可执行的建议，如出价方式、测试策略、素材方向
   - 使用专业术语但简洁易懂

5. estimated_timeline（预计见效时间）：如"7-14天"、"首月见效"

6. similar_case_hint（一句话历史案例参考）：
   - 描述一个类似的成功或失败案例，增加真实感
   - 例如："类似游戏产品在北美以 $300/天 起量，ROI 1.0-1.1 达成率约65%"

【输出格式】严格按照以下 JSON 结构输出，不要有任何额外文字：
{
  "success_rate": number,
  "confidence": "high" | "medium" | "low",
  "risks": [
    {
      "level": "high" | "medium" | "low",
      "description": string
    }
  ],
  "strategy_suggestions": [string, string, string],
  "estimated_timeline": string,
  "similar_case_hint": string
}`;
```

---

## 八、Demo 种子数据（prisma/seed.ts）

```typescript
// prisma/seed.ts 的数据规格（由 AI 根据此规格生成完整 TypeScript 代码）

/*
用户数据（密码统一为 "demo123456"，使用 bcrypt hash）：
1. 商务小王 | wang@synapse.demo | BUSINESS
2. 商务小张 | zhang@synapse.demo | BUSINESS
3. 优化师小李 | li@synapse.demo | OPTIMIZER
4. 优化师小陈 | chen@synapse.demo | OPTIMIZER
5. 管理员 Admin | admin@synapse.demo | ADMIN

客户数据：
1. 星辰游戏有限公司 | 行业：手游 | 地区：北美 | 负责商务：小王
2. 荣华电商科技 | 行业：女装电商 | 地区：东南亚 | 负责商务：小王
3. 快乐学堂 | 行业：在线教育 | 地区：欧洲 | 负责商务：小张

需求数据（3条，覆盖不同状态）：
1. 状态 EVALUATING（待优化师响应）
   - 客户：星辰游戏
   - rawInput: "我们想在北美推一款策略手游，ROI要到1.2，预算每天500美金，跑Facebook和Instagram"
   - structuredData: { region: "北美", media_platform: "Facebook", daily_budget_usd: 500, target_kpi: "ROI", target_roi: 1.2, product_type: "策略手游", campaign_objective: "用户获取" }
   - aiEvaluation: { success_rate: 72, confidence: "medium", risks: [...], strategy_suggestions: [...] }
   - 分配给优化师：小李

2. 状态 IN_PROGRESS（已接单，有关联项目）
   - 客户：荣华电商
   - rawInput: "双十一备战，东南亚TikTok，女装品类，ROAS要4以上，每天预算1000美金"
   - 分配给优化师：小陈
   - 关联项目：ProjectStatus = OPTIMIZING

3. 状态 COMPLETED（已完成）
   - 客户：快乐学堂
   - rawInput: "欧洲推广英语课，Google Ads，CPA控制在20欧以内，预算每天300欧"
   - 关联项目：ProjectStatus = COMPLETED，roiActual = 1.31

项目 2 的消息数据（5-6条消息模拟对话）：
- [SYSTEM] 需求已接单，项目正式启动
- [小陈 OPTIMIZER] 已收到需求，正在搭建广告账户，预计明天开始投放
- [小王 BUSINESS] 好的，客户催得比较紧，麻烦尽快
- [小陈 OPTIMIZER] @小王 素材收到了吗？需要客户提供1:1和9:16两种比例
- [小王 BUSINESS] 好的，我去催一下，今天下午给你
- [SYSTEM] 小王 已上传文件：创意素材包.zip

知识库案例（5条）：
1. 手游北美Facebook - ROI 1.25 - 优秀案例 isHighlight=true
   策略：测试期每天$200+自动出价+宽泛定向，7天后数据稳定切Manual Bid
2. 女装东南亚TikTok - ROAS 4.8 - 优秀案例 isHighlight=true
   策略：短视频素材测试5-8套，用达人混剪+产品展示各半，放量阶段日增预算不超20%
3. 在线教育欧洲Google - CPA €18 达成
   策略：搜索+智能购物组合，关键词长尾为主，否词保持每周更新
4. 金融App东南亚 - CPA 未达成，案例用于风险参考
   风险：监管审核导致素材频繁被拒，ROI未达标
5. 电商全球Meta - ROAS 3.2 - 普通案例
   策略：Advantage+ Shopping Campaign，SKU超500用Catalog Ads
*/
```

---

## 九、环境变量配置（.env.local.example）

```env
# ===== 数据库 =====
# Supabase PostgreSQL - 从 https://supabase.com 控制台获取
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# ===== 认证 =====
NEXTAUTH_SECRET="your-random-secret-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# ===== Gemini AI =====
# 从 https://aistudio.google.com/app/apikey 获取
GEMINI_API_KEY="AIza..."

# ===== Pusher 实时消息 =====
# 从 https://pusher.com 控制台创建 App 后获取
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-key"
PUSHER_SECRET="your-secret"
PUSHER_CLUSTER="ap1"
NEXT_PUBLIC_PUSHER_KEY="your-key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

---

## 十、Vercel + Supabase 部署步骤

### 10.1 Supabase 数据库配置

1. 访问 [supabase.com](https://supabase.com)，创建新项目
2. 进入项目 Settings → Database → Connection string
3. 复制 "Transaction" 模式的 URI 作为 `DATABASE_URL`（用于运行时）
4. 复制 "Direct" 模式的 URI 作为 `DIRECT_URL`（用于 Prisma 迁移）
5. 在本地执行：`npx prisma migrate deploy` + `npx prisma db seed`

### 10.2 Pusher 配置

1. 访问 [pusher.com](https://pusher.com)，注册并创建新 App
2. 选择 Cluster：`ap1`（亚太）
3. 记录 App ID、Key、Secret

### 10.3 Gemini API Key

1. 访问 [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. 创建 API Key，复制保存

### 10.4 Vercel 部署

```bash
# 1. 推送代码到 GitHub
git init && git add . && git commit -m "init"
gh repo create synapse --public && git push -u origin main

# 2. 在 Vercel 中导入 GitHub 仓库
# 3. 在 Vercel 项目 Settings → Environment Variables 中添加所有环境变量
# 4. 首次部署后，在 Vercel Functions 日志中确认 DB 连接正常
```

### 10.5 next.config.ts 配置

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
```

---

## 十一、UI 设计规范

### 11.1 颜色方案

深蓝专业商务风格（深色模式为主，支持浅色切换）：

```css
/* 主色调 */
--primary: #3B82F6;           /* 蓝色主色 */
--primary-dark: #1D4ED8;      /* 深蓝强调 */

/* 背景层次 */
--bg-base: #0F172A;           /* 最深背景 */
--bg-card: #1E293B;           /* 卡片背景 */
--bg-elevated: #334155;       /* 悬浮元素 */

/* 文字 */
--text-primary: #F1F5F9;      /* 主文字 */
--text-secondary: #94A3B8;    /* 次文字 */
--text-muted: #64748B;        /* 辅助文字 */

/* 状态色 */
--success: #10B981;            /* 绿色 */
--warning: #F59E0B;            /* 黄色 */
--danger: #EF4444;             /* 红色 */
--info: #06B6D4;               /* 青色 */
```

### 11.2 组件风格要求

- 卡片：`rounded-xl`，带轻微边框 `border border-slate-700/50`，`backdrop-blur` 效果
- 按钮：主操作蓝色渐变，悬停有 `scale(1.02)` 微动效
- 状态 Tag：填充色背景 + 圆点前缀
- 导航栏：左侧固定宽度 240px，深色背景，当前页高亮
- 字体：系统字体栈，中文优先 PingFang SC

---

## 十二、生成指令

> **请根据以上所有规格，从零开始生成完整的 Next.js 15 全栈项目代码。具体要求如下：**
>
> 1. **完整可运行**：生成 `package.json`、`tsconfig.json`、`tailwind.config.ts`、`next.config.ts`、`.env.local.example`、`prisma/schema.prisma`、`prisma/seed.ts` 及所有页面和 API 文件，代码之间无循环依赖，`npm install && npm run dev` 能直接启动
>
> 2. **目录结构**：严格按照第三节的目录树，使用 Next.js 15 App Router（`app/` 目录）
>
> 3. **数据库**：使用第四节的 Prisma Schema，不允许缺少任何字段或关联关系
>
> 4. **AI 集成**：`lib/gemini.ts` 中使用第七节的完整 Prompt 常量，API routes 中调用 Gemini Flash
>
> 5. **实时消息**：使用 Pusher，服务端在 `/api/projects/[id]/messages POST` 时触发推送，客户端在 `MessageFeed.tsx` 中订阅
>
> 6. **认证**：NextAuth v4 + CredentialsProvider（邮箱+密码），session 中包含 `id`、`role`、`name`
>
> 7. **UI 风格**：深蓝色专业商务风（深色模式），使用 shadcn/ui 组件 + Tailwind，参考第十一节颜色方案
>
> 8. **权限控制**：所有 API routes 校验 session，按第六节规格进行角色过滤
>
> 9. **种子数据**：`prisma/seed.ts` 按第八节规格生成，密码统一 bcrypt hash "demo123456"
>
> 10. **TypeScript**：全程使用 TypeScript，`tsconfig.json` 开启 strict mode，不允许 `any` 类型
>
> **首先生成以下文件（按此顺序）**：`package.json` → `tsconfig.json` → `tailwind.config.ts` → `next.config.ts` → `prisma/schema.prisma` → `lib/gemini.ts` → `lib/prisma.ts` → `lib/auth.ts` → `lib/pusher.ts` → `lib/utils.ts` → `types/index.ts` → 所有 API routes → 所有页面组件 → `prisma/seed.ts`
