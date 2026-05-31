import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

interface RetellAgentRaw {
  agent_id?: string;
  agent_name?: string;
  voice_id?: string;
  language?: string;
  webhook_url?: string;
  is_published?: boolean;
  last_modification_timestamp?: number;
  response_engine?: { type?: string; llm_id?: string };
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const client = getRetellClient();
    const raw = await client.agent.list();
    const agents = (raw as unknown as RetellAgentRaw[]).map((a) => ({
      agent_id: a.agent_id ?? "",
      agent_name: a.agent_name ?? "Unnamed Agent",
      voice_id: a.voice_id ?? "",
      language: a.language ?? "en-US",
      webhook_url: a.webhook_url ?? "",
      is_published: a.is_published ?? false,
      last_modified: a.last_modification_timestamp ?? 0,
      llm_id: a.response_engine?.llm_id ?? "",
    }));
    return NextResponse.json({ agents }, { status: 200 });
  } catch (err) {
    console.error("[Retell] Failed to list agents:", err);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}
