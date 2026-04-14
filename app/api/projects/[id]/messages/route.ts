import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const messages = await prisma.message.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const message = await prisma.message.create({
    data: {
      projectId: id,
      senderId: session.user.id,
      senderName: session.user.name ?? "",
      senderRole: (session.user.role as string) as import("@prisma/client").UserRole,
      content: body.content,
      type: body.type ?? "TEXT",
    },
  });

  return NextResponse.json(message, { status: 201 });
}
