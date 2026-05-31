import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

interface AgentItem {
  agent_id?: string;
  agent_name?: string;
  is_published?: boolean;
  voice_id?: string;
  last_modification_timestamp?: number;
  response_engine?: { type: string; llm_id?: string };
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const client = getRetellClient();
    const raw = await client.agent.list();
    const agents = (raw as unknown as AgentItem[]).map((a) => ({
      agent_id: a.agent_id ?? "",
      agent_name: a.agent_name ?? "Unnamed Agent",
      is_published: a.is_published ?? false,
      voice_id: a.voice_id ?? "",
      llm_id: a.response_engine?.llm_id ?? "",
      last_modified: a.last_modification_timestamp ?? 0,
    }));
    return NextResponse.json({ agents }, { status: 200 });
  } catch (err) {
    console.error("[Retell] Failed to list agents:", err);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}
