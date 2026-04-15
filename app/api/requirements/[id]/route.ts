import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";

const REQ_INCLUDE = {
  client: true,
  creator: { select: { id: true, name: true, role: true } },
  assignedOptimizer: { select: { id: true, name: true, role: true } },
  followUps: { orderBy: { createdAt: "asc" as const } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const req = await prisma.requirement.findUnique({ where: { id }, include: REQ_INCLUDE });
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 扁平化嵌套关联对象为前端期望的字段名
  const formatted = {
    ...req,
    clientName: req.client.name,
    creatorName: req.creator.name,
    assignedOptimizerName: req.assignedOptimizer?.name,
    client: undefined,
    creator: undefined,
    assignedOptimizer: undefined,
  };

  return NextResponse.json(formatted);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.requirement.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.structuredData !== undefined && { structuredData: body.structuredData }),
      ...(body.aiEvaluation !== undefined && { aiEvaluation: body.aiEvaluation }),
      ...(body.assignedOptimizerId !== undefined && { assignedOptimizerId: body.assignedOptimizerId }),
      ...(body.rejectionReason !== undefined && { rejectionReason: body.rejectionReason }),
    },
    include: REQ_INCLUDE,
  });

  // 接单时自动创建对应 Project（幂等：先查再建）
  if (body.status === "ACCEPTED") {
    const existing = await prisma.project.findFirst({ where: { requirementId: id } });
    if (!existing) {
      const sd = updated.structuredData as Record<string, unknown> | null;
      const optimizer = updated.assignedOptimizerId
        ? await prisma.user.findUnique({ where: { id: updated.assignedOptimizerId }, select: { name: true } })
        : await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
      const creator = await prisma.user.findUnique({
        where: { id: updated.creatorId },
        select: { name: true },
      });
      await prisma.project.create({
        data: {
          requirementId: id,
          clientName: updated.client.name,
          industry: updated.client.industry,
          mediaPlatform: (sd?.media_platform as string) || "Unknown",
          businessName: creator?.name || "商务",
          optimizerName: optimizer?.name || "优化师",
          status: "STRATEGY",
        },
      });
    }
  }

  // 扁平化嵌套关联对象为前端期望的字段名
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
