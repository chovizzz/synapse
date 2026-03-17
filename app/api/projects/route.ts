import { NextResponse } from "next/server";
import { MOCK_PROJECTS } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ data: MOCK_PROJECTS, total: MOCK_PROJECTS.length });
}
