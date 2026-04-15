import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";
import type { RequirementStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");

  const requirements = await prisma.requirement.findMany({
    where: statusParam ? { status: statusParam as RequirementStatus } : undefined,
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

  const formatted = requirements.map((req) => ({
    ...req,
    clientName: req.client.name,
    creatorName: req.creator.name,
    assignedOptimizerName: req.assignedOptimizer?.name,
    client: undefined,
    creator: undefined,
    assignedOptimizer: undefined,
  }));

  return NextResponse.json(formatted);
}
