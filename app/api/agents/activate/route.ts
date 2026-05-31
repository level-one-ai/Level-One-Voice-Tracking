import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

interface ActivateBody {
  agent_ids: string[];   // one or more agent IDs to mark as active
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: ActivateBody;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { agent_ids } = body;

  if (!Array.isArray(agent_ids) || agent_ids.length === 0) {
    return NextResponse.json({ error: "agent_ids array is required" }, { status: 400 });
  }

  try {
    const db = getDb();
    // Store active agent selection in Firestore so it persists
    await db.collection("settings").doc("active_agents").set({
      active_agent_ids: agent_ids,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, active_agent_ids: agent_ids },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Firestore] Failed to save active agents:", err);
    return NextResponse.json({ error: "Failed to save active agents" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const db = getDb();
    const doc = await db.collection("settings").doc("active_agents").get();
    if (!doc.exists) {
      return NextResponse.json({ active_agent_ids: [] }, { status: 200 });
    }
    return NextResponse.json(doc.data(), { status: 200 });
  } catch (err) {
    console.error("[Firestore] Failed to get active agents:", err);
    return NextResponse.json({ error: "Failed to get active agents" }, { status: 500 });
  }
}
