import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

interface CreateAgentBody {
  agent_name: string;
  llm_id: string;
  voice_id: string;
  language?: string;
  model?: string;
  begin_message?: string;
  webhook_url?: string;
  system_prompt?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: CreateAgentBody;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.agent_name?.trim()) return NextResponse.json({ error: "agent_name is required" }, { status: 400 });
  if (!body.voice_id?.trim()) return NextResponse.json({ error: "voice_id is required" }, { status: 400 });

  try {
    const client = getRetellClient();

    let llmId = body.llm_id?.trim();

    if (!llmId) {
      // Create a new LLM with the provided prompt and settings
      const llm = await client.llm.create({
        general_prompt: body.system_prompt?.trim() || "You are a helpful AI voice assistant.",
        model: (body.model as "gpt-4.1-mini") || "gpt-4.1-mini",
        begin_message: body.begin_message?.trim() || "Hello! How can I help you today?",
      });
      llmId = llm.llm_id;
    } else if (body.system_prompt?.trim()) {
      // Update existing LLM prompt if provided alongside an ID
      await client.llm.update(llmId, {
        general_prompt: body.system_prompt.trim(),
      });
    }

    const agentPayload: Parameters<typeof client.agent.create>[0] = {
      agent_name: body.agent_name.trim(),
      response_engine: { type: "retell-llm", llm_id: llmId },
      voice_id: body.voice_id.trim(),
      language: (body.language as "en-US") || "en-GB",
    };

    if (body.webhook_url?.trim()) {
      Object.assign(agentPayload, {
        webhook_url: body.webhook_url.trim(),
        webhook_events: ["call_analyzed" as const],
      });
    }

    const agent = await client.agent.create(agentPayload);

    return NextResponse.json(
      { success: true, agent_id: agent.agent_id, llm_id: llmId },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Retell] Failed to create agent:", err);
    return NextResponse.json({ error: "Failed to create agent in Retell. Check your RETELL_API_KEY." }, { status: 500 });
  }
}
