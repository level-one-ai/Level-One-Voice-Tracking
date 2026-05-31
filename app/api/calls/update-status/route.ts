import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

interface UpdateStatusBody {
  call_id: string;
  consultation_status: "pending" | "scheduled" | "completed" | "not_interested";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: UpdateStatusBody;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { call_id, consultation_status } = body;
  if (!call_id || !["pending","scheduled","completed","not_interested"].includes(consultation_status)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }
  try {
    const db = getDb();
    await db.collection("calls").doc(call_id).update({ consultation_status });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[Firestore] Failed to update:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
