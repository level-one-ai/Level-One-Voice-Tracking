import { NextRequest, NextResponse } from "next/server";
import retellClient from "@/lib/retell";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  if (!process.env.RETELL_LLM_ID) {
    return NextResponse.json(
      { error: "RETELL_LLM_ID is not configured" },
      { status: 500 }
    );
  }

  try {
    const llm = await retellClient.llm.retrieve(process.env.RETELL_LLM_ID);
    return NextResponse.json(
      { general_prompt: llm.general_prompt ?? "", llm_id: llm.llm_id },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Retell] Failed to retrieve LLM:", err);
    return NextResponse.json(
      { error: "Failed to retrieve LLM prompt from Retell" },
      { status: 500 }
    );
  }
}
