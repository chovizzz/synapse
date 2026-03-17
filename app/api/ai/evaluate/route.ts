import { NextRequest, NextResponse } from "next/server";
import { evaluateRequirement } from "@/lib/gemini";
import { StructuredRequirement } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { structuredData } = body as { structuredData: StructuredRequirement };

    if (!structuredData || typeof structuredData !== "object") {
      return NextResponse.json(
        { success: false, error: "structuredData 不能为空" },
        { status: 400 }
      );
    }

    const data = await evaluateRequirement(structuredData as unknown as Record<string, unknown>);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[/api/ai/evaluate]", err);
    return NextResponse.json(
      { success: false, error: "AI 评估失败，请重试" },
      { status: 500 }
    );
  }
}
