import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { insertReviewAttemptSchema } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = insertReviewAttemptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid data", errors: parsed.error.issues }, { status: 400 });
    }
    const reviewAttempt = await storage.createReviewAttempt(parsed.data);
    return NextResponse.json(reviewAttempt, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Failed to create review attempt" }, { status: 500 });
  }
}
