import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { z } from "zod";

const updateLevelSchema = z.object({
  level: z.number().min(1).max(10),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid player ID" }, { status: 400 });
    }
    
    const body = await request.json();
    const parsed = updateLevelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid data", errors: parsed.error.issues }, { status: 400 });
    }
    
    const player = await storage.updatePlayerLevel(id, parsed.data.level);
    if (!player) {
      return NextResponse.json({ message: "Player not found" }, { status: 404 });
    }
    
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ message: "Failed to update player level" }, { status: 500 });
  }
}
