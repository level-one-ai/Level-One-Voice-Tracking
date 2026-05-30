import { NextRequest, NextResponse } from "next/server";
import retellClient from "@/lib/retell";
import { TelnyxWebhookPayload } from "@/lib/types";

function getLondonHour(): number {
  const now = new Date();
  const londonTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/London" })
  );
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

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telnyx reject failed: ${response.status} ${text}`);
  }
}

async function triggerRetellCall(toNumber: string): Promise<void> {
  if (!process.env.RETELL_AGENT_ID) {
    throw new Error("Missing RETELL_AGENT_ID environment variable.");
  }
  if (!process.env.TELNYX_FROM_NUMBER) {
    throw new Error("Missing TELNYX_FROM_NUMBER environment variable.");
  }

  await retellClient.call.createPhoneCall({
    from_number: process.env.TELNYX_FROM_NUMBER,
    to_number: toNumber,
    override_agent_id: process.env.RETELL_AGENT_ID,
    retell_llm_dynamic_variables: {
      caller_number: toNumber,
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let payload: TelnyxWebhookPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventType = payload?.data?.event_type;

  if (eventType !== "call.initiated") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { payload: callPayload } = payload.data;
  const callControlId = callPayload?.call_control_id;
  const fromNumber = callPayload?.from;
  const direction = callPayload?.direction;

  if (!callControlId || !fromNumber || direction !== "inbound") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    await rejectCall(callControlId);
  } catch (err) {
    console.error("[Telnyx] Failed to reject call:", err);
  }

  const londonHour = getLondonHour();
  const isBefore5PM = londonHour < 17;

  (async () => {
    try {
      if (isBefore5PM) {
        await new Promise((resolve) => setTimeout(resolve, 60_000));
      }
      await triggerRetellCall(fromNumber);
      console.log(`[Retell] Outbound call triggered to ${fromNumber}`);
    } catch (err) {
      console.error("[Retell] Failed to trigger outbound call:", err);
    }
  })();

  return NextResponse.json({ received: true }, { status: 200 });
}
