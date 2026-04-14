import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const req = await prisma.requirement.findUnique({
    where: { id },
    include: {
      client: true,
      creator: { select: { id: true, name: true, role: true } },
      assignedOptimizer: { select: { id: true, name: true, role: true } },
      followUps: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(req);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
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
    include: {
      client: true,
      creator: { select: { id: true, name: true, role: true } },
      assignedOptimizer: { select: { id: true, name: true, role: true } },
      followUps: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(updated);
}
