import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { agent_id: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.agent_id) return NextResponse.json({ error: "agent_id required" }, { status: 400 });

  try {
    const client = getRetellClient();
    // Deactivate = remove webhook so it no longer receives calls from our system
    await client.agent.update(body.agent_id, {
      webhook_url: "",
      webhook_events: [],
    } as Parameters<typeof client.agent.update>[1]);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[Retell] Failed to deactivate agent:", err);
    return NextResponse.json({ error: "Failed to deactivate agent" }, { status: 500 });
  }
}
