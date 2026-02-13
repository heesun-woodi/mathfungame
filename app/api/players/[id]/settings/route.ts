import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { updatePlayerSettingsSchema } from "@/db/schema";

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
    const player = await storage.getPlayer(id);
    if (!player) {
      return NextResponse.json({ message: "Player not found" }, { status: 404 });
    }
    return NextResponse.json({ dailyLimit: player.dailyLimit });
  } catch {
    return NextResponse.json({ message: "Failed to get player settings" }, { status: 500 });
  }
}

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
    const parsed = updatePlayerSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid data", errors: parsed.error.issues }, { status: 400 });
    }
    const player = await storage.updatePlayerDailyLimit(id, parsed.data.dailyLimit);
    if (!player) {
      return NextResponse.json({ message: "Player not found" }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ message: "Failed to update player settings" }, { status: 500 });
  }
}
