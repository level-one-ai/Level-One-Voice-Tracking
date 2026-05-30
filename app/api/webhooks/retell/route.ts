import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { RetellWebhookPayload, CallRecord } from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: RetellWebhookPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Only process call_analyzed events
  if (payload.event !== "call_analyzed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { call } = payload;

  if (!call?.call_id) {
    return NextResponse.json({ error: "Missing call_id" }, { status: 400 });
  }

  // Extract dynamic variables set by the AI during the call
  const dynamicVars = call.retell_llm_dynamic_variables ?? {};

  const callRecord: CallRecord = {
    call_id: call.call_id,
    from_number: call.from_number ?? "",
    transcript: call.transcript ?? "",
    recording_url: call.recording_url ?? "",
    call_status: call.call_status ?? "unknown",
    sentiment: call.call_analysis?.user_sentiment ?? "unknown",
    duration_seconds: call.duration_ms ? Math.round(call.duration_ms / 1000) : 0,
    created_at: new Date().toISOString(),
    // CRM lead data extracted by AI
    lead_name: dynamicVars["Name"] ?? dynamicVars["name"] ?? "",
    lead_email: dynamicVars["Email"] ?? dynamicVars["email"] ?? "",
    business_type: dynamicVars["Business Type"] ?? dynamicVars["business_type"] ?? "",
    ai_objective: dynamicVars["AI Objective"] ?? dynamicVars["ai_objective"] ?? "",
    implementation_type: dynamicVars["Implementation Type"] ?? dynamicVars["implementation_type"] ?? "",
    consultation_status: "pending",
  };

  // Action 1: Save to Firestore
  try {
    await db.collection("calls").doc(call.call_id).set(callRecord);
    console.log(`[Firestore] Saved call record: ${call.call_id}`);
  } catch (err) {
    console.error("[Firestore] Failed to save call record:", err);
    return NextResponse.json(
      { error: "Failed to save to Firestore" },
      { status: 500 }
    );
  }

  // Action 2: Forward to Make.com for automated follow-up email
  if (process.env.MAKE_WEBHOOK_URL) {
    try {
      const makeResponse = await fetch(process.env.MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callRecord),
      });

      if (!makeResponse.ok) {
        console.warn(
          `[Make.com] Webhook returned non-OK status: ${makeResponse.status}`
        );
      } else {
        console.log("[Make.com] Follow-up email webhook triggered successfully");
      }
    } catch (err) {
      // Non-blocking: log but don't fail the whole request
      console.error("[Make.com] Failed to trigger webhook:", err);
    }
  }

  return NextResponse.json({ received: true, call_id: call.call_id }, { status: 200 });
}
