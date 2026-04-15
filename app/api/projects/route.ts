import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-helper";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rechargeRecords: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  return NextResponse.json(projects);
}
