import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

interface UpdateScriptBody { new_script: string; }

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
  if (!process.env.RETELL_LLM_ID) {
    return NextResponse.json({ error: "RETELL_LLM_ID not set" }, { status: 500 });
  }
  try {
    const client = getRetellClient();
    const updated = await client.llm.update(process.env.RETELL_LLM_ID, { general_prompt: body.new_script.trim() });
    return NextResponse.json({ success: true, llm_id: updated.llm_id }, { status: 200 });
  } catch (err) {
    console.error("[Retell] Failed to update LLM:", err);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}
