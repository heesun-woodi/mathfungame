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
    const wrongAttempts = await storage.getWrongAttempts(id);
    return NextResponse.json(wrongAttempts);
  } catch {
    return NextResponse.json({ message: "Failed to get wrong attempts" }, { status: 500 });
  }
}
