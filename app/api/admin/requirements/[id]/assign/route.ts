import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { optimizerId } = await req.json();

  if (!optimizerId) {
    return NextResponse.json({ error: "optimizerId is required" }, { status: 400 });
  }

  const updated = await prisma.requirement.update({
    where: { id },
    data: { assignedOptimizerId: optimizerId },
    include: {
      client: { select: { name: true, industry: true } },
      creator: { select: { name: true } },
      assignedOptimizer: { select: { name: true } },
    },
  });

  // 创建通知给优化师
  await prisma.notification.create({
    data: {
      userId: optimizerId,
      type: "NEW_REQUIREMENT",
      title: "管理员分配了新需求",
      body: `请查看并评估需求：${updated.client.name}`,
      link: `/requirements/${id}`,
    },
  });

  // 扁平化返回
  const formatted = {
    ...updated,
    clientName: updated.client.name,
    creatorName: updated.creator.name,
    assignedOptimizerName: updated.assignedOptimizer?.name,
    client: undefined,
    creator: undefined,
    assignedOptimizer: undefined,
  };

  return NextResponse.json(formatted);
}
