import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid player ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ message: "Invalid year or month" }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const stats = await storage.getDailyStats(id, startDate, endDate);
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ message: "Failed to get daily stats" }, { status: 500 });
  }
}
