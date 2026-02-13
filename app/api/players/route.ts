import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { insertPlayerSchema } from "@/db/schema";

export async function GET() {
  try {
    const players = await storage.getAllPlayers();
    return NextResponse.json(players);
  } catch {
    return NextResponse.json({ message: "Failed to get players" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = insertPlayerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid data", errors: parsed.error.issues }, { status: 400 });
    }
    const player = await storage.createPlayer(parsed.data);
    return NextResponse.json(player, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create player" }, { status: 500 });
  }
}
