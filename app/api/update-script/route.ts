import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";
import { getDb } from "@/lib/firebase";

interface UpdateScriptBody { new_script: string; }

async function getActiveLlmId(): Promise<string> {
  try {
    const db = getDb();
    const doc = await db.collection("settings").doc("active_agent").get();
    if (doc.exists) {
      const data = doc.data() as { llm_id?: string };
      if (data?.llm_id) return data.llm_id;
    }
  } catch {
    // Fall through
  }
  if (process.env.RETELL_LLM_ID) return process.env.RETELL_LLM_ID;
  throw new Error("No LLM ID found. Create an agent from the dashboard or set RETELL_LLM_ID.");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("x-api-secret");
  if (process.env.INTERNAL_API_SECRET && authHeader !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: UpdateScriptBody;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.new_script?.trim()) {
    return NextResponse.json({ error: "new_script is required" }, { status: 400 });
  }

  try {
    const llmId = await getActiveLlmId();
    const client = getRetellClient();
    const updated = await client.llm.update(llmId, {
      general_prompt: body.new_script.trim(),
    });
    return NextResponse.json({ success: true, llm_id: updated.llm_id }, { status: 200 });
  } catch (err) {
    console.error("[Retell] Failed to update LLM:", err);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}
