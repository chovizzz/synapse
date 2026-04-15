import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const task = await prisma.task.create({
    data: {
      projectId: id,
      title: body.title,
      assigneeName: body.assigneeName ?? "",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
