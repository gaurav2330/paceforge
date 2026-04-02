import { NextRequest, NextResponse } from "next/server";
import { getRunById } from "../../../../lib/db/runs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "INVALID_ID", message: "Run ID must be a positive integer" },
      { status: 400 }
    );
  }

  try {
    const run = await getRunById(id);

    if (!run) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: run, success: true });
  } catch {
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to fetch run" },
      { status: 500 }
    );
  }
}
