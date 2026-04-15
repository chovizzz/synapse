import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: { createdAt: "asc" } },
      rechargeRecords: { orderBy: { createdAt: "desc" } },
      requirement: {
        include: {
          client: true,
          creator: { select: { id: true, name: true } },
          assignedOptimizer: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.budgetActual !== undefined && { budgetActual: body.budgetActual }),
      ...(body.roiActual !== undefined && { roiActual: body.roiActual }),
      ...(body.totalRecharge !== undefined && { totalRecharge: body.totalRecharge }),
      ...(body.dailySpend !== undefined && { dailySpend: body.dailySpend }),
      ...(body.dailyRecharge !== undefined && { dailyRecharge: body.dailyRecharge }),
    },
  });

  return NextResponse.json(updated);
}
