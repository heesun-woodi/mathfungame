import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid player ID" }, { status: 400 });
    }
    const deleted = await storage.deletePlayer(id);
    if (!deleted) {
      return NextResponse.json({ message: "Player not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Player deleted" });
  } catch {
    return NextResponse.json({ message: "Failed to delete player" }, { status: 500 });
  }
}

export async function PATCH(
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
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ message: "Name is required and must be a non-empty string" }, { status: 400 });
    }
    const player = await storage.updatePlayerName(id, body.name.trim());
    if (!player) {
      return NextResponse.json({ message: "Player not found" }, { status: 404 });
    }
    return NextResponse.json(player);
  } catch {
    return NextResponse.json({ message: "Failed to update player" }, { status: 500 });
  }
}
