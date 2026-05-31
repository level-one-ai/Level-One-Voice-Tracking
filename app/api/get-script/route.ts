import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  if (!process.env.RETELL_LLM_ID) {
    return NextResponse.json({ error: "RETELL_LLM_ID not configured" }, { status: 500 });
  }
  try {
    const client = getRetellClient();
    const llm = await client.llm.retrieve(process.env.RETELL_LLM_ID);
    return NextResponse.json({ general_prompt: llm.general_prompt ?? "", llm_id: llm.llm_id }, { status: 200 });
  } catch (err) {
    console.error("[Retell] Failed to retrieve LLM:", err);
    return NextResponse.json({ error: "Failed to retrieve prompt" }, { status: 500 });
  }
}
