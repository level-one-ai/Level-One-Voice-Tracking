import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const client = getRetellClient();
    const result = await client.call.list({
      sort_order: "descending",
      limit: 100,
    });

    const calls = (result.items ?? []).map((call) => {
      const durationMs =
        call.end_timestamp && call.start_timestamp
          ? call.end_timestamp - call.start_timestamp
          : 0;
      const c = call as Record<string, unknown>;
      return {
        call_id: call.call_id,
        agent_id: call.agent_id ?? "",
        agent_name: (c.agent_name as string) ?? "",
        call_type: call.call_type ?? "",
        call_status: call.call_status ?? "",
        from_number: (c.from_number as string) ?? "",
        to_number: (c.to_number as string) ?? "",
        start_timestamp: call.start_timestamp ?? 0,
        end_timestamp: call.end_timestamp ?? 0,
        duration_seconds: Math.round(durationMs / 1000),
        transcript: call.transcript ?? "",
        recording_url: call.recording_url ?? "",
        disconnection_reason: call.disconnection_reason ?? "",
        sentiment: call.call_analysis?.user_sentiment ?? "",
        call_successful: call.call_analysis?.call_successful ?? null,
        call_summary: call.call_analysis?.call_summary ?? "",
        agent_task_completion: call.call_analysis?.agent_task_completion_rating ?? "",
        dynamic_variables: call.retell_llm_dynamic_variables ?? {},
      };
    });

    return NextResponse.json({ calls, total: calls.length }, { status: 200 });
  } catch (err) {
    console.error("[Retell] Failed to list calls:", err);
    return NextResponse.json(
      { error: "Failed to fetch calls from Retell API" },
      { status: 500 }
    );
  }
}
