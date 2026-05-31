import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { RetellWebhookPayload, CallRecord } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: RetellWebhookPayload;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (payload.event !== "call_analyzed") return NextResponse.json({ received: true }, { status: 200 });
  const { call } = payload;
  if (!call?.call_id) return NextResponse.json({ error: "Missing call_id" }, { status: 400 });
  const v = call.retell_llm_dynamic_variables ?? {};
  const callRecord: CallRecord = {
    call_id: call.call_id, from_number: call.from_number ?? "",
    transcript: call.transcript ?? "", recording_url: call.recording_url ?? "",
    call_status: call.call_status ?? "unknown",
    sentiment: call.call_analysis?.user_sentiment ?? "unknown",
    duration_seconds: call.duration_ms ? Math.round(call.duration_ms / 1000) : 0,
    created_at: new Date().toISOString(),
    lead_name: v["Name"] ?? v["name"] ?? "", lead_email: v["Email"] ?? v["email"] ?? "",
    business_type: v["Business Type"] ?? v["business_type"] ?? "",
    ai_objective: v["AI Objective"] ?? v["ai_objective"] ?? "",
    implementation_type: v["Implementation Type"] ?? v["implementation_type"] ?? "",
    consultation_status: "pending",
  };
  try {
    const db = getDb();
    await db.collection("calls").doc(call.call_id).set(callRecord);
  } catch (err) {
    console.error("[Firestore] Failed to save:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
  if (process.env.MAKE_WEBHOOK_URL) {
    try { await fetch(process.env.MAKE_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(callRecord) }); }
    catch (err) { console.error("[Make.com] Failed:", err); }
  }
  return NextResponse.json({ received: true, call_id: call.call_id }, { status: 200 });
}
