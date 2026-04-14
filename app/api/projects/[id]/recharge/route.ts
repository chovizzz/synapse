import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const amount: number = body.amount;
  const note: string | undefined = body.note;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [record, updatedProject] = await prisma.$transaction([
    prisma.rechargeRecord.create({
      data: { projectId: id, projectName: project.clientName, amount, note },
    }),
    prisma.project.update({
      where: { id },
      data: { totalRecharge: (project.totalRecharge ?? 0) + amount, dailyRecharge: amount },
    }),
  ]);

  return NextResponse.json({ record, project: updatedProject }, { status: 201 });
}
