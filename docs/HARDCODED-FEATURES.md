# Synapse 硬编码功能清单

本文档列出当前以硬编码方式实现、尚未接入配置或后端数据的功能，便于后续接真实 API/数据库时逐项替换。

---

## 1. 数据层（全部为 Mock，未接真实数据源）

| 位置 | 内容 | 说明 |
|------|------|------|
| `lib/mock-data.ts` | `MOCK_USERS` | 用户列表（商务/优化师/管理员），登录校验依赖此列表 |
| `lib/mock-data.ts` | `MOCK_CLIENTS` | 客户列表（星辰游戏、荣华电商、快乐学堂等） |
| `lib/mock-data.ts` | `MOCK_REQUIREMENTS` | 需求单列表，含结构化数据与 AI 评估 |
| `lib/mock-data.ts` | `MOCK_PROJECTS` | 项目列表 |
| `lib/mock-data.ts` | `MOCK_MESSAGES` | 项目内聊天消息 |
| `lib/mock-data.ts` | `MOCK_TASKS` | 项目任务 |
| `lib/mock-data.ts` | `MOCK_KNOWLEDGE_CASES` | 知识库案例 |
| `lib/mock-data.ts` | `MOCK_NOTIFICATIONS` | 通知列表 |
| `lib/store.ts` | 所有 `getFromStorage(..., MOCK_*)` | 本地优先读 localStorage，空则回退到上述 Mock |
| `auth.ts` | `getUsers()` → `MOCK_USERS` | 登录时用 Mock 用户做邮箱匹配，**任意密码**通过（演示模式） |
| `app/api/projects/route.ts` | 直接返回 `MOCK_PROJECTS` | 项目列表 API 未查库 |
| `app/api/requirements/route.ts` | 直接返回 `MOCK_REQUIREMENTS` | 需求列表 API 未查库 |
| `app/api/knowledge/route.ts` | 基于 `MOCK_KNOWLEDGE_CASES` 过滤 | 知识库 API 未查库 |
| `app/(dashboard)/projects/[id]/page.tsx` | `MOCK_PROJECTS.find(p => p.id === id)` | 项目详情从 Mock 取，无单独详情 API |
| `lib/account-data.ts` + `lib/mock-data.ts` | `AD_PLATFORMS` / `generateAccountData` | 投放账号数据为按 projectId 生成的假数据（Meta/Google/TikTok/YouTube） |

**建议**：接入真实用户表、客户表、需求表、项目表、消息表、任务表、知识库表、通知表；Auth 改为数据库/SSO 校验；API 与页面改为从服务端/DB 读写的唯一数据源。

---

## 2. 业务配置（写死在代码里，未抽成配置）

| 位置 | 内容 | 说明 |
|------|------|------|
| `app/(dashboard)/requirements/new/page.tsx` | `DEMO_INPUT` | 新建需求页默认占位示例文案 |
| `app/(dashboard)/requirements/new/page.tsx` | `FIELD_LABELS` | AI 解析字段的中文标签（投放地区、媒体平台等） |
| `app/(dashboard)/requirements/new/page.tsx` | `NUMBER_FIELDS` | 哪些字段用数字输入框 |
| `app/(dashboard)/requirements/new/page.tsx` | 默认客户 `MOCK_CLIENTS[0].id`、默认优化师 `MOCK_USERS.find(u => u.role === "OPTIMIZER")?.id` | 新建需求默认选中项 |
| `components/requirements/StepIndicator.tsx` | `STEPS` | 三步文案：「输入原话」「AI 解析」「确认提交」 |
| `lib/account-data.ts`（及 mock-data 内重复） | `AD_PLATFORMS` | 投放平台列表（Meta, Google Ads, TikTok, YouTube）及账号前缀 |
| `lib/gemini.ts` | 模型名 `deepseek-chat` / `gemini-2.0-flash`、temperature、max_tokens | AI 调用参数写死 |
| `lib/gemini.ts` | DeepSeek URL `https://api.deepseek.com/chat/completions` | 接口地址写死 |

**建议**：字段标签、步骤文案、投放平台列表等可放入 CMS/配置表或 i18n；AI 模型与参数可放入环境变量或后台配置。

---

## 3. 状态与角色配置（多处重复定义）

| 位置 | 内容 | 说明 |
|------|------|------|
| `types/index.ts` | `RequirementStatus` / `ProjectStatus` / `UserRole` | 类型定义（唯一来源，合理） |
| `components/dashboard/RequirementCard.tsx` | `STATUS_CONFIG`（待分配/评估中/已接单/投放中/已拒绝/已完成） | 需求状态 → 文案 + 颜色 |
| `app/(dashboard)/requirements/page.tsx` | `TABS` + `STATUS_CONFIG` | 需求列表 Tab 与状态样式，与上面重复 |
| `app/(dashboard)/requirements/[id]/page.tsx` | `STATUS_CONFIG` + `TABS` | 需求详情页状态与 Tab，再次重复 |
| `app/(dashboard)/projects/[id]/page.tsx` | 项目状态文案 + `ROLE_LABELS`（优化师/商务/系统） | 项目状态与角色展示 |
| `app/(dashboard)/projects/page.tsx` | `PROJECT_STATUS_CONFIG` | 项目列表状态样式 |
| `app/(dashboard)/page.tsx` | `PROJECT_STATUS_CONFIG` | 仪表盘项目状态样式 |
| `components/layout/NotificationPanel.tsx` | 通知类型 emoji（如 ACCEPTED ✅） | 通知类型 → 图标 |

**建议**：将「需求状态」「项目状态」「用户角色」的**展示配置**（文案、颜色、Tab、图标）集中到单一模块（如 `lib/status-config.ts` 或 i18n），各页面只引用，避免多处改同一语义。

---

## 4. 登录与权限（演示逻辑）

| 位置 | 内容 | 说明 |
|------|------|------|
| `auth.ts` | 仅校验邮箱是否在 `MOCK_USERS`，不校验密码 | 演示模式：任意密码可登录 |
| `app/login/page.tsx` | 快捷登录按钮（商务小谢、优化师小郑）的 label/email | 与 mock-data 中用户对应，写死 |
| `lib/role-context.tsx` | 默认用户 `email: "wang@synapse.demo"` | Session 为空时的 fallback 写死 |
| `app/login/page.tsx` | 错误提示「AUTH_SECRET 未设置」 | 文案写死 |

**建议**：正式环境改为数据库/SSO 校验密码；快捷登录可改为从配置或环境变量读取；默认 fallback 用户可去掉或改为配置。

---

## 5. 文案与占位符（未做 i18n）

以下为界面中文文案、placeholder、错误提示等，目前全部硬编码在组件内：

- 登录/注册页：`placeholder`、按钮与错误信息
- 需求列表/详情：Tab 名、状态名、按钮、追问输入 placeholder
- 新建需求：步骤名、字段标签、提交成功跳转逻辑
- 项目列表/详情：状态名、角色名、输入框 placeholder、报告占位
- 知识库：搜索 placeholder、筛选「全部行业/平台/地区」
- 通知面板：标题、全部已读等
- AI 聊天：输入框 placeholder
- 评估卡片：风险等级（高/中/低）、策略建议等

**建议**：若需多语言或统一运营文案，可接入 i18n（如 next-intl）或 CMS，将上述文案迁出代码。

---

## 6. 其他

| 位置 | 内容 | 说明 |
|------|------|------|
| `lib/gemini.ts` | AI 解析/评估的 system prompt 全文 | 写死在代码中，修改需发版 |
| `next.config.ts` | 远程图片域名等 | 当前为配置项，非业务硬编码 |

**建议**：重要 prompt 可考虑存数据库或配置中心，便于运营调参而不发版。

---

## 汇总：按优先级可落地的改造

1. **高**：Auth 接真实用户与密码校验；需求/项目/客户/消息等 API 接数据库，去掉对 Mock 的依赖。
2. **中**：状态与角色展示配置集中到一处；投放平台列表与账号生成逻辑改为可配置或从后端下发。
3. **低**：字段标签、步骤文案、DEMO_INPUT、placeholder 等抽成配置或 i18n；AI 模型名与部分参数环境变量化。

当前设计为 **Demo/演示**：数据与登录均为 Mock + localStorage，便于前端与联调；上线前需按上表逐项替换为真实数据源与鉴权。
