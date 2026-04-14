import { PrismaClient, UserRole, RequirementStatus, RequirementPriority, ProjectStatus, NotificationType } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashSync } from "bcryptjs";

const connectionString = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL ?? "";
const sql = neon(connectionString);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaNeon(sql as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const u1 = await prisma.user.upsert({
    where: { email: "xie@synapse.demo" },
    update: {},
    create: {
      id: "u1",
      name: "商务小谢",
      email: "xie@synapse.demo",
      password: hashSync("demo1234", 10),
      role: UserRole.BUSINESS,
    },
  });

  const u2 = await prisma.user.upsert({
    where: { email: "zhang@synapse.demo" },
    update: {},
    create: {
      id: "u2",
      name: "商务小张",
      email: "zhang@synapse.demo",
      password: hashSync("demo1234", 10),
      role: UserRole.BUSINESS,
    },
  });

  const u3 = await prisma.user.upsert({
    where: { email: "zheng@synapse.demo" },
    update: {},
    create: {
      id: "u3",
      name: "优化师小郑",
      email: "zheng@synapse.demo",
      password: hashSync("demo1234", 10),
      role: UserRole.OPTIMIZER,
    },
  });

  const u4 = await prisma.user.upsert({
    where: { email: "chen@synapse.demo" },
    update: {},
    create: {
      id: "u4",
      name: "优化师小陈",
      email: "chen@synapse.demo",
      password: hashSync("demo1234", 10),
      role: UserRole.OPTIMIZER,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@synapse.demo" },
    update: {},
    create: {
      id: "u5",
      name: "管理员",
      email: "admin@synapse.demo",
      password: hashSync("demo1234", 10),
      role: UserRole.ADMIN,
    },
  });

  console.log("✓ Users");

  // ── Clients ────────────────────────────────────────────────────────────────
  const c1 = await prisma.client.upsert({
    where: { id: "c1" },
    update: {},
    create: { id: "c1", name: "星辰游戏有限公司", industry: "手游", region: "北美", ownerId: u1.id },
  });

  const c2 = await prisma.client.upsert({
    where: { id: "c2" },
    update: {},
    create: { id: "c2", name: "荣华电商科技", industry: "女装电商", region: "东南亚", ownerId: u1.id },
  });

  const c3 = await prisma.client.upsert({
    where: { id: "c3" },
    update: {},
    create: { id: "c3", name: "快乐学堂", industry: "在线教育", region: "欧洲", ownerId: u2.id },
  });

  console.log("✓ Clients");

  // ── Requirements ───────────────────────────────────────────────────────────
  const r1 = await prisma.requirement.upsert({
    where: { id: "r1" },
    update: {},
    create: {
      id: "r1",
      clientId: c1.id,
      creatorId: u1.id,
      assignedOptimizerId: u3.id,
      rawInput: "我们想在北美推一款策略手游，ROI要到1.2，预算每天500美金，跑Facebook和Instagram",
      structuredData: {
        region: "北美", media_platform: "Facebook & Instagram",
        daily_budget_usd: 500, target_kpi: "ROI", target_roi: 1.2,
        product_type: "策略手游", campaign_objective: "用户获取",
        product_url: null, soft_kpi: "", test_period: "",
        third_party_tracking: "Adjust", attribution_model: "代投",
        expected_start_date: "", policy_notes: "", ambiguous_fields: [],
      },
      aiEvaluation: {
        success_rate: 72, confidence: "medium",
        risks: [
          { level: "high", description: "目标ROI 1.2 在北美手游中仅30%能达成，建议调整至1.0-1.1" },
          { level: "medium", description: "日预算$500偏低，数据积累周期可能延长至14天以上" },
        ],
        strategy_suggestions: [
          "测试期先用自动出价（Advantage+），宽泛定向收集数据，7天后切换手动出价",
          "初期素材准备5-8套：竖版视频（9:16）+ 正方形图片各半，重点测试游戏玩法展示类",
          "建议预算分配：80%用于已验证受众，20%用于探索新受众，每周优化一次",
        ],
        estimated_timeline: "7-14天见效",
        similar_case_hint: "类似策略手游北美以$300/天起量，ROI 1.0达成率约65%，3周后稳定",
      },
      status: RequirementStatus.EVALUATING,
      priority: RequirementPriority.MEDIUM,
      tags: ["代投", "需追问"],
    },
  });

  const r2 = await prisma.requirement.upsert({
    where: { id: "r2" },
    update: {},
    create: {
      id: "r2",
      clientId: c2.id,
      creatorId: u1.id,
      assignedOptimizerId: u4.id,
      rawInput: "双十一备战，东南亚TikTok，女装品类，ROAS要4以上，每天预算1000美金，有达人合作素材可提供",
      structuredData: {
        region: "东南亚", media_platform: "TikTok",
        daily_budget_usd: 1000, target_kpi: "ROAS", target_roi: 4.0,
        product_type: "女装", campaign_objective: "电商转化",
        product_url: "https://shop.ronghua.example/tiktok",
        soft_kpi: "加购率", test_period: "2个月",
        third_party_tracking: "AppsFlyer", attribution_model: "代投",
        expected_start_date: "尽快",
        policy_notes: "东南亚部分国家有促销资质要求，需提前确认",
        ambiguous_fields: [],
      },
      aiEvaluation: {
        success_rate: 81, confidence: "high",
        risks: [
          { level: "medium", description: "ROAS 4+ 在东南亚女装品类属中高目标，需配合短视频素材质量" },
          { level: "low", description: "部分东南亚市场节假日竞价成本上涨，注意备用预算" },
        ],
        strategy_suggestions: [
          "优先测试达人合作素材与纯品牌素材效果对比，7天内确定主力创意",
          "越南、泰国、印尼三市场优先级分开测，避免预算稀释",
          "设置智能购物广告 + 视频广告组合，覆盖从认知到转化全链路",
        ],
        estimated_timeline: "5-10天见效",
        similar_case_hint: "同类女装品类东南亚TikTok投放，ROAS 3.5达成率约70%，强素材可达4.2",
      },
      status: RequirementStatus.IN_PROGRESS,
      priority: RequirementPriority.HIGH,
      tags: ["大客户", "高预算", "代投"],
    },
  });

  const r3 = await prisma.requirement.upsert({
    where: { id: "r3" },
    update: {},
    create: {
      id: "r3",
      clientId: c3.id,
      creatorId: u2.id,
      assignedOptimizerId: u3.id,
      rawInput: "欧洲推广英语课，Google Ads，CPA控制在20欧以内，预算每天300欧，已有独立站和落地页",
      structuredData: {
        region: "欧洲", media_platform: "Google Ads",
        daily_budget_usd: 320, target_kpi: "CPA", target_roi: null,
        product_type: "在线教育", campaign_objective: "用户注册",
        product_url: "https://happyclass.example/en",
        soft_kpi: "7日留存", test_period: "首月",
        third_party_tracking: "Firebase", attribution_model: "自投",
        expected_start_date: "2026-Q2",
        policy_notes: "GDPR 合规要求，需在着陆页加 Cookie 声明",
        ambiguous_fields: [],
      },
      aiEvaluation: {
        success_rate: 78, confidence: "high",
        risks: [
          { level: "medium", description: "欧洲教育品类竞争激烈，CPA 20欧需精准定向高意向用户" },
          { level: "low", description: "GDPR 合规若处理不当可能影响转化追踪精度" },
        ],
        strategy_suggestions: [
          "优先测试关键词广告（搜索词：learn English online），选取长尾词降低 CPC",
          "配合再营销广告对已访问落地页用户进行二次触达",
          "着陆页加载速度需优化至 3 秒内，移动端适配是核心",
        ],
        estimated_timeline: "10-14天稳定数据",
        similar_case_hint: "欧洲在线教育 Google Ads CPA 18欧可达，关键是落地页转化率需 > 5%",
      },
      status: RequirementStatus.COMPLETED,
      priority: RequirementPriority.LOW,
      tags: ["自投", "数据不全"],
    },
  });

  const r4 = await prisma.requirement.upsert({
    where: { id: "r4" },
    update: {},
    create: {
      id: "r4",
      clientId: c1.id,
      creatorId: u1.id,
      assignedOptimizerId: u3.id,
      rawInput: "新款 RPG 手游，日本+韩国市场，Apple Search Ads 为主，预算每天 800 美金，目标 ROAS 2.0",
      structuredData: {
        region: "日韩", media_platform: "Apple Search Ads",
        daily_budget_usd: 800, target_kpi: "ROAS", target_roi: 2.0,
        product_type: "RPG手游", campaign_objective: "应用安装",
        product_url: null, soft_kpi: "次日留存率 > 30%", test_period: "3周",
        third_party_tracking: "Adjust", attribution_model: "代投",
        expected_start_date: "2026-05-01",
        policy_notes: "日本市场内购合规要求，需本地化审核",
        ambiguous_fields: [{ field: "ASO 状态", question: "App Store 优化是否已完成？" }],
      },
      aiEvaluation: {
        success_rate: 85, confidence: "high",
        risks: [
          { level: "medium", description: "日本 ASA 竞争激烈，RPG 类 CPT 较高，需预留 10-15% 溢价空间" },
          { level: "low", description: "韩国市场 Google Play 占优，ASA 渗透率相对偏低" },
        ],
        strategy_suggestions: [
          "日本优先跑 Search Match + 品牌词，韩国以精准关键词广告起量",
          "素材需本地化：日本侧重角色立绘，韩国侧重玩法视频",
          "ROAS 2.0 在 RPG 品类日韩市场属可达目标，预计 3 周内稳定",
        ],
        estimated_timeline: "7-14天数据稳定",
        similar_case_hint: "同类 RPG 手游日韩市场 ASA，ROAS 2.0 达成率约 72%，ASO 质量是关键",
      },
      status: RequirementStatus.PENDING,
      priority: RequirementPriority.HIGH,
      tags: ["大客户", "KA", "紧急"],
    },
  });

  console.log("✓ Requirements");

  // ── Projects ───────────────────────────────────────────────────────────────
  const p1 = await prisma.project.upsert({
    where: { id: "p1" },
    update: {},
    create: {
      id: "p1", requirementId: r2.id,
      clientName: "荣华电商科技", industry: "女装电商", mediaPlatform: "TikTok",
      businessName: "商务小谢", optimizerName: "优化师小陈",
      status: ProjectStatus.OPTIMIZING,
      budgetActual: 3240, roiActual: 1.08, totalRecharge: 5000,
      dailySpend: 320, dailyRecharge: 0,
    },
  });

  const p2 = await prisma.project.upsert({
    where: { id: "p2" },
    update: {},
    create: {
      id: "p2", requirementId: r3.id,
      clientName: "快乐学堂", industry: "在线教育", mediaPlatform: "Google",
      businessName: "商务小张", optimizerName: "优化师小郑",
      status: ProjectStatus.COMPLETED,
      budgetActual: 4480, roiActual: 1.31, totalRecharge: 6000,
      dailySpend: 580, dailyRecharge: 1000,
    },
  });

  const p3 = await prisma.project.upsert({
    where: { id: "p3" },
    update: {},
    create: {
      id: "p3", requirementId: r1.id,
      clientName: "星辰手游", industry: "手游", mediaPlatform: "Facebook",
      businessName: "商务小谢", optimizerName: "优化师小陈",
      status: ProjectStatus.LAUNCHING,
      budgetActual: 1850, roiActual: 0.92, totalRecharge: 3000,
      dailySpend: 500, dailyRecharge: 500,
    },
  });

  await prisma.project.upsert({
    where: { id: "p4" },
    update: {},
    create: {
      id: "p4", requirementId: r4.id,
      clientName: "闪耀珠宝", industry: "珠宝首饰", mediaPlatform: "Instagram",
      businessName: "商务小张", optimizerName: "优化师小郑",
      status: ProjectStatus.STRATEGY,
      budgetActual: 720, roiActual: 1.55, totalRecharge: 2000,
      dailySpend: 180, dailyRecharge: 0,
    },
  });

  console.log("✓ Projects");

  // ── Messages ───────────────────────────────────────────────────────────────
  for (const msg of [
    { id: "m1", projectId: p1.id, senderId: "system", senderName: "系统", senderRole: "ADMIN" as const, content: "需求已接单，项目正式启动", type: "SYSTEM", minsAgo: 3 * 24 * 60 },
    { id: "m2", projectId: p1.id, senderId: u4.id, senderName: "优化师小陈", senderRole: "OPTIMIZER" as const, content: "已收到需求，正在搭建广告账户，预计明天开始投放", type: "TEXT", minsAgo: 3 * 24 * 60 - 30 },
    { id: "m3", projectId: p1.id, senderId: u1.id, senderName: "商务小谢", senderRole: "BUSINESS" as const, content: "好的，客户催得比较紧，麻烦尽快", type: "TEXT", minsAgo: 2 * 24 * 60 },
    { id: "m4", projectId: p1.id, senderId: u4.id, senderName: "优化师小陈", senderRole: "OPTIMIZER" as const, content: "@商务小谢 素材收到了吗？需要客户提供 1:1 和 9:16 两种比例的视频", type: "TEXT", minsAgo: 24 * 60 },
    { id: "m5", projectId: p1.id, senderId: u1.id, senderName: "商务小谢", senderRole: "BUSINESS" as const, content: "好的，我去催一下，今天下午给你。另外客户说预算可以追加到 $1500/天", type: "TEXT", minsAgo: 12 * 60 },
  ]) {
    await prisma.message.upsert({
      where: { id: msg.id },
      update: {},
      create: {
        id: msg.id, projectId: msg.projectId,
        senderId: msg.senderId, senderName: msg.senderName,
        senderRole: msg.senderRole as UserRole,
        content: msg.content, type: msg.type,
        createdAt: new Date(Date.now() - msg.minsAgo * 60 * 1000),
      },
    });
  }

  console.log("✓ Messages");

  // ── Tasks ──────────────────────────────────────────────────────────────────
  for (const task of [
    { id: "t1", projectId: p1.id, title: "搭建广告账户结构", assigneeName: "优化师小陈", completed: true, daysFromNow: null },
    { id: "t2", projectId: p1.id, title: "提交创意素材（1:1 + 9:16）", assigneeName: "商务小谢", completed: true, daysFromNow: null },
    { id: "t3", projectId: p1.id, title: "第一周数据报告", assigneeName: "优化师小陈", completed: false, daysFromNow: 2 },
    { id: "t4", projectId: p1.id, title: "客户月报沟通会议", assigneeName: "商务小谢", completed: false, daysFromNow: 5 },
    { id: "t5", projectId: p2.id, title: "欧洲词库整理", assigneeName: "优化师小郑", completed: true, daysFromNow: null },
    { id: "t6", projectId: p3.id, title: "素材 AB 测试启动", assigneeName: "优化师小陈", completed: false, daysFromNow: 3 },
  ]) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id, projectId: task.projectId,
        title: task.title, assigneeName: task.assigneeName,
        completed: task.completed,
        dueDate: task.daysFromNow != null ? new Date(Date.now() + task.daysFromNow * 86400_000) : null,
      },
    });
  }

  console.log("✓ Tasks");

  // ── Knowledge Cases ────────────────────────────────────────────────────────
  const knowledgeCases = [
    {
      id: "k1", title: "手游北美Facebook用户获取", industry: "手游",
      mediaPlatform: "Facebook", region: "北美", budgetRange: "$300-800/天",
      targetKpi: "ROI", targetRoi: 1.0, actualRoi: 1.25,
      strategySummary: "测试期采用 Advantage+ 自动出价，宽泛受众快速收集数据。第7天切换手动出价，重点投放 25-34 岁男性游戏爱好者。素材以游戏实录短视频（15-30秒）效果最佳，CTR 平均 3.2%。",
      keyInsights: ["宽泛定向 + Advantage+ 在测试期优于精准定向", "游戏玩法展示类素材 CTR 高于品牌宣传类 40%", "预算在 $500/天 以上数据积累速度最优"],
      tags: ["手游", "Facebook", "北美", "ROI优化", "用户获取"], isHighlight: true, daysAgo: 30,
    },
    {
      id: "k2", title: "女装电商东南亚TikTok爆品打法", industry: "女装电商",
      mediaPlatform: "TikTok", region: "东南亚", budgetRange: "$500-1500/天",
      targetKpi: "ROAS", targetRoi: null, actualRoi: 4.8,
      strategySummary: "采用达人混剪 + 产品展示各半的素材策略，印尼和越南市场单独建 Campaign。放量阶段日均预算增幅不超过 20%，避免学习期重置。",
      keyInsights: ["达人UGC素材比纯品牌素材 ROAS 高出 35%", "东南亚不同国家受众差异大，建议按国家分开测试", "大促期间提前2周建立账户权重"],
      tags: ["女装", "TikTok", "东南亚", "ROAS", "大促"], isHighlight: true, daysAgo: 20,
    },
    {
      id: "k3", title: "在线教育欧洲Google搜索投放", industry: "在线教育",
      mediaPlatform: "Google", region: "欧洲", budgetRange: "$200-400/天",
      targetKpi: "CPA", targetRoi: null, actualRoi: 1.31,
      strategySummary: "搜索广告为主，智能出价配合手动出价双管齐下。关键词以长尾词为主，每周更新否词列表。英语课类目竞争激烈，建议错峰投放。",
      keyInsights: ["长尾关键词转化率比宽泛词高 2-3 倍", "每周更新否词是保持效果的关键操作", "欧洲市场 GDPR 合规，不建议使用再营销列表"],
      tags: ["教育", "Google", "欧洲", "CPA", "搜索广告"], isHighlight: false, daysAgo: 10,
    },
    {
      id: "k4", title: "金融App东南亚投放风险案例", industry: "金融",
      mediaPlatform: "Facebook", region: "东南亚", budgetRange: "$300-600/天",
      targetKpi: "CPA", targetRoi: null, actualRoi: 0.7,
      strategySummary: "金融类目政策严格，素材频繁被拒导致起量慢。建议提前3-5个工作日申请政策豁免，素材避免承诺收益。",
      keyInsights: ["金融类目需提前申请资质审核，周期约5-7个工作日", "素材中避免出现百分比收益、保本等表述", "建议评估时将金融客户成功率下调 20%"],
      tags: ["金融", "Facebook", "东南亚", "风险案例", "政策合规"], isHighlight: false, daysAgo: 45,
    },
    {
      id: "k5", title: "全球电商Meta Advantage+购物活动", industry: "综合电商",
      mediaPlatform: "Meta", region: "全球", budgetRange: "$800-2000/天",
      targetKpi: "ROAS", targetRoi: null, actualRoi: 3.2,
      strategySummary: "使用 Advantage+ Shopping Campaign 全自动化投放，适合 SKU 数量超过 200 的电商客户。系统会自动选择最优受众和素材组合。",
      keyInsights: ["ASC 适合 SKU 多、数据积累充足的成熟账户", "新账户建议先用手动模式建立数据，3个月后切换 ASC", "全球化投放时可设置地区出价调整"],
      tags: ["电商", "Meta", "全球", "ROAS", "ASC"], isHighlight: false, daysAgo: 7,
    },
  ];

  for (const kc of knowledgeCases) {
    await prisma.knowledgeCase.upsert({
      where: { id: kc.id },
      update: {},
      create: {
        id: kc.id, title: kc.title, industry: kc.industry,
        mediaPlatform: kc.mediaPlatform, region: kc.region,
        budgetRange: kc.budgetRange, targetKpi: kc.targetKpi,
        targetRoi: kc.targetRoi ?? null, actualRoi: kc.actualRoi,
        strategySummary: kc.strategySummary, keyInsights: kc.keyInsights,
        tags: kc.tags, isHighlight: kc.isHighlight,
        createdAt: new Date(Date.now() - kc.daysAgo * 86400_000),
      },
    });
  }

  console.log("✓ Knowledge Cases");

  // ── Notifications（绑定到 u3 优化师） ─────────────────────────────────────
  for (const notif of [
    { id: "n1", userId: u3.id, type: NotificationType.NEW_REQUIREMENT, title: "新需求待评估", body: "商务小谢提交了星辰游戏的北美投放需求，请尽快评估", link: "/requirements/r1", read: false, minsAgo: 10 },
    { id: "n2", userId: u3.id, type: NotificationType.EVAL_DONE, title: "AI 评估已完成", body: "荣华电商的东南亚需求评估完成，成功率 81%，可查看详情", link: "/requirements/r2", read: false, minsAgo: 35 },
    { id: "n3", userId: u1.id, type: NotificationType.ACCEPTED, title: "优化师已接单", body: "优化师小郑接受了你的广告需求，项目正式启动", link: "/projects/p3", read: true, minsAgo: 120 },
    { id: "n4", userId: u1.id, type: NotificationType.FOLLOW_UP, title: "优化师有追问", body: "优化师小郑对星辰游戏需求提出追问：目标受众年龄段是否有限制？", link: "/requirements/r1", read: true, minsAgo: 300 },
  ]) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: {},
      create: {
        id: notif.id, userId: notif.userId, type: notif.type,
        title: notif.title, body: notif.body, link: notif.link,
        read: notif.read,
        createdAt: new Date(Date.now() - notif.minsAgo * 60_000),
      },
    });
  }

  console.log("✓ Notifications");
  console.log("✅ Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
