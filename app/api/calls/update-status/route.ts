import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";

interface UpdateStatusBody {
  call_id: string;
  consultation_status: "pending" | "scheduled" | "completed" | "not_interested";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: UpdateStatusBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { call_id, consultation_status } = body;
  const validStatuses = ["pending", "scheduled", "completed", "not_interested"];

  if (!call_id || !validStatuses.includes(consultation_status)) {
    return NextResponse.json(
      { error: "Valid call_id and consultation_status required" },
      { status: 400 }
    );
  }

  try {
    await db.collection("calls").doc(call_id).update({ consultation_status });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[Firestore] Failed to update status:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
