import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  const body = await req.json();

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
    },
  });

  return NextResponse.json(updated);
}
