import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";
import { getDb } from "@/lib/firebase";

interface UpdateAgentBody {
  agent_id: string;
  agent_name?: string;
  voice_id?: string;
  language?: string;
  webhook_url?: string;
  set_active?: boolean;
  active_agent_ids?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: UpdateAgentBody;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.agent_id) return NextResponse.json({ error: "agent_id required" }, { status: 400 });

  try {
    const client = getRetellClient();
    const webhookBase = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL ?? "";

    const updatePayload: Record<string, unknown> = {};
    if (body.agent_name) updatePayload.agent_name = body.agent_name;
    if (body.voice_id) updatePayload.voice_id = body.voice_id;
    if (body.language) updatePayload.language = body.language;
    if (body.webhook_url !== undefined) updatePayload.webhook_url = body.webhook_url;

    if (body.set_active && webhookBase) {
      updatePayload.webhook_url = `${webhookBase}/api/webhooks/retell`;
      updatePayload.webhook_events = ["call_analyzed"];
    }

    const updated = await client.agent.update(
      body.agent_id,
      updatePayload as Parameters<typeof client.agent.update>[1]
    );

    // When activating, also save to Firestore settings so the whole
    // system knows which agent is active — no env var needed
    if (body.set_active) {
      try {
        const db = getDb();
        // Get the agent details to find its LLM ID
        const agentDetails = await client.agent.retrieve(body.agent_id);
        const responseEngine = agentDetails.response_engine as { llm_id?: string } | undefined;
        const llmId = responseEngine?.llm_id ?? "";

        await db.collection("settings").doc("active_agent").set({
          agent_id: body.agent_id,
          llm_id: llmId,
          agent_name: (agentDetails as Record<string, unknown>).agent_name ?? "",
          voice_id: agentDetails.voice_id ?? "",
          updated_at: new Date().toISOString(),
        });
        console.log(`[Settings] Active agent updated to ${body.agent_id}`);
      } catch (fbErr) {
        console.warn("[Settings] Failed to save active agent:", fbErr);
      }
    }

    // Multi-select: activate additional agents
    if (body.active_agent_ids && body.active_agent_ids.length > 0 && webhookBase) {
      await Promise.all(
        body.active_agent_ids.map((id) =>
          id !== body.agent_id
            ? client.agent.update(id, {
                webhook_url: `${webhookBase}/api/webhooks/retell`,
                webhook_events: ["call_analyzed"],
              } as Parameters<typeof client.agent.update>[1])
            : Promise.resolve()
        )
      );
    }

    return NextResponse.json({ success: true, agent_id: updated.agent_id }, { status: 200 });
  } catch (err) {
    console.error("[Retell] Failed to update agent:", err);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}
