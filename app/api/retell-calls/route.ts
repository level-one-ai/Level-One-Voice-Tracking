import { NextRequest, NextResponse } from "next/server";
import { getRetellClient } from "@/lib/retell";

// The retell-sdk CallListResponse type may lag behind the actual API response.
// We cast via unknown to safely access the paginated items shape.
interface RetellCallListResponse {
  items?: RetellCallItem[];
  has_more?: boolean;
  pagination_key?: string;
}

interface RetellCallItem {
  call_id?: string;
  agent_id?: string;
  agent_name?: string;
  call_type?: string;
  call_status?: string;
  from_number?: string;
  to_number?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  duration_ms?: number;
  transcript?: string;
  recording_url?: string;
  disconnection_reason?: string;
  retell_llm_dynamic_variables?: Record<string, string>;
  call_analysis?: {
    user_sentiment?: string;
    call_successful?: boolean;
    call_summary?: string;
    agent_task_completion_rating?: string;
  };
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const client = getRetellClient();

    // Cast through unknown to handle SDK type lag vs actual API response shape
    const rawResult = await client.call.list({
      sort_order: "descending",
      limit: 100,
    });

    const result = rawResult as unknown as RetellCallListResponse;
    const items: RetellCallItem[] = result.items ?? [];

    const calls = items.map((call) => {
      const durationMs =
        call.end_timestamp && call.start_timestamp
          ? call.end_timestamp - call.start_timestamp
          : (call.duration_ms ?? 0);

      return {
        call_id: call.call_id ?? "",
        agent_id: call.agent_id ?? "",
        agent_name: call.agent_name ?? "",
        call_type: call.call_type ?? "",
        call_status: call.call_status ?? "",
        from_number: call.from_number ?? "",
        to_number: call.to_number ?? "",
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
