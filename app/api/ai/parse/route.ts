import { NextRequest, NextResponse } from "next/server";
import { parseRequirement } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawInput } = body as { rawInput: string };

    if (!rawInput || typeof rawInput !== "string" || rawInput.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "rawInput 不能为空" },
        { status: 400 }
      );
    }

    const data = await parseRequirement(rawInput.trim());
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[/api/ai/parse]", err);
    return NextResponse.json(
      { success: false, error: "AI 解析失败，请重试" },
      { status: 500 }
    );
  }
}
