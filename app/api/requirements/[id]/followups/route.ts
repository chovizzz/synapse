import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const followUps = await prisma.followUp.findMany({
    where: { requirementId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(followUps);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const followUp = await prisma.followUp.create({
    data: {
      requirementId: id,
      fromId: session.user.id,
      fromName: session.user.name ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fromRole: session.user.role as any,
      content: body.content,
    },
  });

  return NextResponse.json(followUp, { status: 201 });
}
