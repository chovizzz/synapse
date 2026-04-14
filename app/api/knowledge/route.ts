import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cases = await prisma.knowledgeCase.findMany({
    orderBy: [{ isHighlight: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(cases);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const newCase = await prisma.knowledgeCase.create({
    data: {
      title: body.title,
      industry: body.industry,
      mediaPlatform: body.mediaPlatform,
      region: body.region,
      budgetRange: body.budgetRange,
      targetKpi: body.targetKpi,
      targetRoi: body.targetRoi ?? null,
      actualRoi: body.actualRoi ?? null,
      strategySummary: body.strategySummary,
      keyInsights: Array.isArray(body.keyInsights) ? body.keyInsights : body.keyInsights.split("\n").filter(Boolean),
      tags: Array.isArray(body.tags) ? body.tags : body.tags.split(/[,\s]+/).filter(Boolean),
      isHighlight: body.isHighlight ?? false,
    },
  });

  return NextResponse.json(newCase, { status: 201 });
}
