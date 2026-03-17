import { NextRequest, NextResponse } from "next/server";
import type { RequirementStatus } from "@/types";

interface PatchBody {
  status: RequirementStatus;
  rejectionReason?: string;
}

// NOTE: This route acts as a passthrough. All persistence is handled
// client-side via localStorage; the API simply validates and echoes success.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing requirement id" },
      { status: 400 }
    );
  }

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const validStatuses: RequirementStatus[] = [
    "PENDING",
    "EVALUATING",
    "ACCEPTED",
    "REJECTED",
    "IN_PROGRESS",
    "COMPLETED",
  ];

  if (!validStatuses.includes(body.status)) {
    return NextResponse.json(
      { success: false, error: `Invalid status: ${body.status}` },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, id, status: body.status });
}
