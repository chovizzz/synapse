import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: session.user.role === "ADMIN" ? {} : { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      name: body.name,
      industry: body.industry,
      region: body.region,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
