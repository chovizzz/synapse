import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isOptimizer = session.user.role === "OPTIMIZER";
  const isBusiness = session.user.role === "BUSINESS";

  const requirements = await prisma.requirement.findMany({
    where: isOptimizer 
      ? { 
          status: { not: "DRAFT" },
          assignedOptimizerId: session.user.id  // 优化师只看分配给自己的
        }
      : isBusiness
      ? { creatorId: session.user.id }  // 商务看自己创建的
      : {},  // 管理员看全部
    include: {
      client: { select: { name: true, industry: true } },
      creator: { select: { name: true } },
      assignedOptimizer: { select: { name: true } },
    },
    orderBy: [
      { priority: "asc" },
      { createdAt: "desc" },
    ],
  });

  // 扁平化嵌套关联对象为前端期望的字段名
  const formatted = requirements.map((req) => ({
    ...req,
    clientName: req.client.name,
    creatorName: req.creator.name,
    assignedOptimizerName: req.assignedOptimizer?.name,
    client: undefined, // 移除嵌套对象
    creator: undefined,
    assignedOptimizer: undefined,
  }));

  return NextResponse.json(formatted);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const requirement = await prisma.requirement.create({
    data: {
      clientId: body.clientId,
      creatorId: session.user.id,
      rawInput: body.rawInput,
      structuredData: body.structuredData,
      status: "DRAFT",
      priority: "MEDIUM",
      tags: [],
    },
  });

  return NextResponse.json(requirement, { status: 201 });
}
