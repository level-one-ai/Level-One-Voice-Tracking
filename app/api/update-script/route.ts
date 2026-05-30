import { NextRequest, NextResponse } from "next/server";
import retellClient from "@/lib/retell";

interface UpdateScriptBody {
  new_script: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Basic security: check for an internal API secret header
  const authHeader = request.headers.get("x-api-secret");
  if (
    process.env.INTERNAL_API_SECRET &&
    authHeader !== process.env.INTERNAL_API_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdateScriptBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { new_script } = body;

  if (!new_script || typeof new_script !== "string" || new_script.trim() === "") {
    return NextResponse.json(
      { error: "new_script is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!process.env.RETELL_LLM_ID) {
    return NextResponse.json(
      { error: "Server misconfiguration: RETELL_LLM_ID is not set" },
      { status: 500 }
    );
  }

  try {
    const updatedLlm = await retellClient.llm.update(process.env.RETELL_LLM_ID, {
      general_prompt: new_script.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "System prompt updated successfully",
        llm_id: updatedLlm.llm_id,
        updated_at: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Retell] Failed to update LLM prompt:", err);
    return NextResponse.json(
      { error: "Failed to update Retell LLM prompt. Check RETELL_LLM_ID and RETELL_API_KEY." },
      { status: 500 }
    );
  }
}
