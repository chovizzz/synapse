import { NextRequest, NextResponse } from "next/server";
import { MOCK_KNOWLEDGE_CASES } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const industry = searchParams.get("industry") ?? "";
  const media = searchParams.get("media") ?? "";
  const region = searchParams.get("region") ?? "";
  const q = (searchParams.get("q") ?? "").toLowerCase();

  const results = MOCK_KNOWLEDGE_CASES.filter((c) => {
    if (industry && c.industry !== industry) return false;
    if (media && c.mediaPlatform !== media) return false;
    if (region && c.region !== region) return false;
    if (q) {
      const searchable = [c.title, c.industry, c.mediaPlatform, c.region, c.strategySummary, ...c.tags]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });

  return NextResponse.json({ data: results, total: results.length });
}

export async function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
