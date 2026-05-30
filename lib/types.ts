export interface CallRecord {
  id?: string;
  call_id: string;
  from_number: string;
  transcript: string;
  recording_url: string;
  call_status: string;
  sentiment: string;
  duration_seconds: number;
  created_at: string;
  // CRM fields from retell_llm_dynamic_variables
  lead_name: string;
  lead_email: string;
  business_type: string;
  ai_objective: string;
  implementation_type: string;
  consultation_status: "pending" | "scheduled" | "completed" | "not_interested";
}

export interface RetellWebhookPayload {
  event: string;
  call: {
    call_id: string;
    call_type: string;
    call_status: string;
    transcript: string;
    recording_url: string;
    disconnection_reason: string;
    start_timestamp: number;
    end_timestamp: number;
    duration_ms: number;
    call_analysis?: {
      call_summary?: string;
      user_sentiment?: string;
      call_successful?: boolean;
      agent_task_completion_rating?: string;
      call_completion_rating?: string;
    };
    retell_llm_dynamic_variables?: Record<string, string>;
    from_number?: string;
    to_number?: string;
  };
}

export interface TelnyxWebhookPayload {
  data: {
    event_type: string;
    payload: {
      call_control_id: string;
      from: string;
      to: string;
      direction: string;
      state: string;
    };
  };
}
