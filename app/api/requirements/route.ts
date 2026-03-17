import { NextRequest, NextResponse } from "next/server";
import { MOCK_REQUIREMENTS } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";

export async function GET() {
  return NextResponse.json({ data: MOCK_REQUIREMENTS, total: MOCK_REQUIREMENTS.length });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = generateId();
    return NextResponse.json({ id, ...body }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
