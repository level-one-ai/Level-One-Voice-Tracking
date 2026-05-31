import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

const SETTINGS_DOC = "active_agent";
const SETTINGS_COLLECTION = "settings";

export interface ActiveAgentSettings {
  agent_id: string;
  llm_id: string;
  agent_name: string;
  voice_id: string;
  updated_at: string;
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const db = getDb();
    const doc = await db
      .collection(SETTINGS_COLLECTION)
      .doc(SETTINGS_DOC)
      .get();

    if (!doc.exists) {
      // Fall back to env vars if no Firestore record yet
      const fallback: ActiveAgentSettings = {
        agent_id: process.env.RETELL_AGENT_ID ?? "",
        llm_id: process.env.RETELL_LLM_ID ?? "",
        agent_name: "",
        voice_id: "",
        updated_at: "",
      };
      return NextResponse.json({ settings: fallback }, { status: 200 });
    }

    return NextResponse.json(
      { settings: doc.data() as ActiveAgentSettings },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Settings] Failed to read:", err);
    // Graceful fallback to env vars if Firebase fails
    return NextResponse.json(
      {
        settings: {
          agent_id: process.env.RETELL_AGENT_ID ?? "",
          llm_id: process.env.RETELL_LLM_ID ?? "",
          agent_name: "",
          voice_id: "",
          updated_at: "",
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Partial<ActiveAgentSettings>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.agent_id || !body.llm_id) {
    return NextResponse.json(
      { error: "agent_id and llm_id are required" },
      { status: 400 }
    );
  }

  const settings: ActiveAgentSettings = {
    agent_id: body.agent_id,
    llm_id: body.llm_id,
    agent_name: body.agent_name ?? "",
    voice_id: body.voice_id ?? "",
    updated_at: new Date().toISOString(),
  };

  try {
    const db = getDb();
    await db
      .collection(SETTINGS_COLLECTION)
      .doc(SETTINGS_DOC)
      .set(settings);

    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (err) {
    console.error("[Settings] Failed to save:", err);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
