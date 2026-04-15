import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { requirementIds, optimizerId } = await req.json();

  if (!Array.isArray(requirementIds) || requirementIds.length === 0 || !optimizerId) {
    return NextResponse.json(
      { error: "requirementIds and optimizerId are required" },
      { status: 400 }
    );
  }

  await prisma.requirement.updateMany({
    where: { id: { in: requirementIds } },
    data: { assignedOptimizerId: optimizerId },
  });

  // 获取需求详情用于通知
  const requirements = await prisma.requirement.findMany({
    where: { id: { in: requirementIds } },
    include: { client: { select: { name: true } } },
  });

  // 批量创建通知
  const notifications = requirements.map((req) => ({
    userId: optimizerId,
    type: "NEW_REQUIREMENT" as const,
    title: "管理员批量分配了新需求",
    body: `请查看并评估需求：${req.client.name}`,
    link: `/requirements/${req.id}`,
  }));

  await prisma.notification.createMany({ data: notifications });

  return NextResponse.json({ success: true, count: requirementIds.length });
}
