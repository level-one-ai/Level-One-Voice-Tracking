import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";
import { getDb } from "@/lib/firebase";

async function getActiveLlmId(): Promise<string> {
  // 1. Try Firestore
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
  // 2. Fall back to env var
  if (process.env.RETELL_LLM_ID) return process.env.RETELL_LLM_ID;
  throw new Error("No LLM ID found. Create an agent from the dashboard or set RETELL_LLM_ID.");
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const llmId = await getActiveLlmId();
    const client = getRetellClient();
    const llm = await client.llm.retrieve(llmId);
    return NextResponse.json(
      { general_prompt: llm.general_prompt ?? "", llm_id: llm.llm_id },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Retell] Failed to retrieve LLM:", err);
    return NextResponse.json(
      { error: "No active LLM found. Create an agent from the dashboard first." },
      { status: 404 }
    );
  }
}
