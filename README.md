# Synapse — 广告代投 AI 协作平台

> 让商务和优化师像同一个大脑一样协作

## 功能演示

### 核心演示流程（5分钟路演）

1. **首页看板** — 顶栏切换商务/优化师视角，感受信息差异
2. **新建需求** → 粘贴客户原话 → 点击"AI解析" → 观看字段逐个填充动画
3. **需求详情** → 查看 AI 评估卡（成功率评分 + 风险提示 + 策略建议）
4. **项目看板** → 模拟商务和优化师实时协作场景
5. **经验库** → 展示历史案例沉淀和搜索复用

### 演示账号（无需登录，直接切换）

| 角色 | 切换方式 |
|------|---------|
| 商务小王 | 顶部右侧点击"商务视角" |
| 优化师小李 | 顶部右侧点击"优化师视角" |

## 本地运行

### 前置条件

- Node.js 18+
- Gemini API Key（[获取地址](https://aistudio.google.com/app/apikey)）

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Gemini API Key：
# NEXT_PUBLIC_GEMINI_API_KEY=你的key
# GEMINI_API_KEY=你的key

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器
# http://localhost:3000
```

### 在 AI Studio 上运行

Gemini API Key 由 AI Studio 自动注入，无需手动配置，直接部署即可。

## 技术栈

- **框架**：Next.js 15 App Router + TypeScript
- **UI**：Tailwind CSS + shadcn/ui（深蓝商务风）
- **AI**：Google Gemini 2.0 Flash（`@google/genai`）
- **动画**：Framer Motion / Motion
- **数据**：localStorage（Demo 演示用，无需数据库）

## 产品背景

本产品针对广告代投公司内部协作痛点：

- 商务采集需求时遗漏/不准确
- 客户→商务→优化师长链路信息损耗
- 历史投放经验无法沉淀复用
