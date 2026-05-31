import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";
import { TelnyxWebhookPayload } from "@/lib/types";
import { getDb } from "@/lib/firebase";

function getLondonHour(): number {
  const now = new Date();
  const londonTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
  return londonTime.getHours();
}

async function rejectCall(callControlId: string): Promise<void> {
  const url = `https://api.telnyx.com/v2/calls/${callControlId}/actions/reject`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
    },
    body: JSON.stringify({ cause: "USER_BUSY" }),
  });
  if (!response.ok) throw new Error(`Telnyx reject failed: ${response.status}`);
}

async function getActiveAgentId(): Promise<string> {
  // 1. Try Firestore (set when agent is created from dashboard)
  try {
    const db = getDb();
    const doc = await db.collection("settings").doc("active_agent").get();
    if (doc.exists) {
      const data = doc.data() as { agent_id?: string };
      if (data?.agent_id) return data.agent_id;
    }
  } catch {
    // Fall through to env var
  }
  // 2. Fall back to env var
  if (process.env.RETELL_AGENT_ID) return process.env.RETELL_AGENT_ID;
  throw new Error("No active agent ID found. Create an agent from the dashboard or set RETELL_AGENT_ID.");
}

async function triggerRetellCall(toNumber: string): Promise<void> {
  if (!process.env.TELNYX_FROM_NUMBER) throw new Error("Missing TELNYX_FROM_NUMBER");
  const agentId = await getActiveAgentId();
  const client = getRetellClient();
  await client.call.createPhoneCall({
    from_number: process.env.TELNYX_FROM_NUMBER,
    to_number: toNumber,
    override_agent_id: agentId,
    retell_llm_dynamic_variables: { caller_number: toNumber },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: TelnyxWebhookPayload;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (payload?.data?.event_type !== "call.initiated") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { payload: p } = payload.data;
  if (!p?.call_control_id || !p?.from || p?.direction !== "inbound") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try { await rejectCall(p.call_control_id); }
  catch (err) { console.error("[Telnyx] Failed to reject:", err); }

  const isBefore5PM = getLondonHour() < 17;
  (async () => {
    try {
      if (isBefore5PM) await new Promise((r) => setTimeout(r, 60_000));
      await triggerRetellCall(p.from);
      console.log(`[Retell] Outbound call triggered to ${p.from}`);
    } catch (err) { console.error("[Retell] Failed to trigger outbound:", err); }
  })();

  return NextResponse.json({ received: true }, { status: 200 });
}
