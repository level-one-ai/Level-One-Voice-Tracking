import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

interface CreateAgentBody {
  agent_name: string;
  voice_id: string;
  system_prompt: string;
  begin_message: string;
  language?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: CreateAgentBody;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { agent_name, voice_id, system_prompt, begin_message, language } = body;

  if (!agent_name?.trim() || !voice_id?.trim() || !system_prompt?.trim()) {
    return NextResponse.json(
      { error: "agent_name, voice_id, and system_prompt are required" },
      { status: 400 }
    );
  }

  try {
    const client = getRetellClient();

    // Step 1: Create the LLM engine
    const llm = await client.llm.create({
      general_prompt: system_prompt.trim(),
      begin_message: begin_message?.trim() || undefined,
    });

    // Step 2: Create the agent using the new LLM
    const agent = await client.agent.create({
      agent_name: agent_name.trim(),
      voice_id: voice_id.trim(),
      language: (language as "en-US") ?? "en-US",
      response_engine: {
        type: "retell-llm",
        llm_id: llm.llm_id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        agent_id: agent.agent_id,
        llm_id: llm.llm_id,
        agent_name: agent.agent_name,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Retell] Failed to create agent:", err);
    return NextResponse.json(
      { error: "Failed to create agent in Retell. Check your API key and parameters." },
      { status: 500 }
    );
  }
}
