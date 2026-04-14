import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isOptimizer = session.user.role === "OPTIMIZER";

  const requirements = await prisma.requirement.findMany({
    where: isOptimizer ? { status: { not: "DRAFT" } } : { creatorId: session.user.id },
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

  return NextResponse.json(requirements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
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
