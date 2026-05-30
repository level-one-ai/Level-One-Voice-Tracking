"use client";

import { useState, useEffect } from "react";

export default function ControlPage() {
  const [script, setScript] = useState("");
  const [originalScript, setOriginalScript] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // Attempt to load current prompt from Retell
  useEffect(() => {
    async function fetchCurrentPrompt() {
      setFetchLoading(true);
      try {
        const res = await fetch("/api/get-script");
        if (res.ok) {
          const data = await res.json();
          setScript(data.general_prompt ?? "");
          setOriginalScript(data.general_prompt ?? "");
        } else {
          setScript("");
          setOriginalScript("");
        }
      } catch {
        setScript("");
        setOriginalScript("");
      } finally {
        setFetchLoading(false);
      }
    }
    fetchCurrentPrompt();
  }, []);

  const hasChanges = script !== originalScript;

  const handleUpdate = async () => {
    if (!script.trim()) {
      setStatus("error");
      setStatusMessage("The system prompt cannot be empty.");
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/update-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify({ new_script: script }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setStatusMessage("System prompt updated successfully.");
        setOriginalScript(script);
      } else {
        setStatus("error");
        setStatusMessage(data.error ?? "Failed to update the prompt.");
      }
    } catch {
      setStatus("error");
      setStatusMessage("Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  const handleReset = () => {
    setScript(originalScript);
    setStatus("idle");
  };

  const charCount = script.length;
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">System Control</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the AI voice agent&apos;s system prompt in real-time
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/80 mb-6 animate-fade-in">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div className="text-[13px]">
          <span className="font-semibold text-amber-800">Live System — </span>
          <span className="text-amber-700">
            Changes to this prompt are applied instantly and will affect all subsequent AI voice agent calls. Proceed carefully.
          </span>
        </div>
      </div>

      {/* Main editor card */}
      <div className="glass-card overflow-hidden animate-slide-up stagger-1">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-[13px] font-semibold text-gray-700">Retell LLM — System Prompt</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>{wordCount.toLocaleString()} words</span>
            <span className="w-px h-3 bg-gray-200" />
            <span>{charCount.toLocaleString()} chars</span>
            {hasChanges && (
              <>
                <span className="w-px h-3 bg-gray-200" />
                <span className="text-amber-500 font-medium">Unsaved changes</span>
              </>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          {fetchLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <span className="text-[13px]">Loading current prompt...</span>
              </div>
            </div>
          ) : (
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your AI agent system prompt here...

Example:
You are an AI voice assistant for [Company Name]. Your goal is to qualify inbound callers and collect their information.

When speaking with a caller:
1. Greet them warmly and introduce yourself
2. Ask about their business and what they're looking to achieve with AI
3. Collect their name, email, business type, and AI objectives
4. Determine if they are a good fit for a consultation with The Architect

Always maintain a professional, friendly tone."
              className="w-full min-h-[420px] p-6 text-[13.5px] leading-relaxed text-gray-800 bg-transparent resize-none outline-none font-mono placeholder-gray-300"
              style={{ fontFamily: "'DM Mono', monospace" }}
              spellCheck={false}
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/5 bg-gray-50/30">
          <div className="flex items-center gap-2">
            {status === "success" && (
              <div className="flex items-center gap-2 text-emerald-600 text-[13px] animate-fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {statusMessage}
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 text-red-500 text-[13px] animate-fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {statusMessage}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-black/5 transition-all"
              >
                Reset Changes
              </button>
            )}
            <button
              onClick={handleUpdate}
              disabled={loading || fetchLoading || !hasChanges}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold transition-all
                ${
                  loading || fetchLoading || !hasChanges
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md"
                }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  Update System Prompt
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="mt-4 glass-card p-5 animate-slide-up stagger-2">
        <h3 className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-3">
          Configuration Details
        </h3>
        <div className="grid grid-cols-2 gap-4 text-[13px]">
          <div>
            <span className="text-gray-400">Retell LLM ID</span>
            <div className="font-mono text-gray-700 mt-0.5 text-[12px]">
              {process.env.NEXT_PUBLIC_RETELL_LLM_ID_DISPLAY ?? "Configured via env var"}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Agent ID</span>
            <div className="font-mono text-gray-700 mt-0.5 text-[12px]">
              {process.env.NEXT_PUBLIC_RETELL_AGENT_ID_DISPLAY ?? "Configured via env var"}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Webhook Endpoint</span>
            <div className="font-mono text-gray-700 mt-0.5 text-[12px]">
              /api/webhooks/retell
            </div>
          </div>
          <div>
            <span className="text-gray-400">Telnyx Webhook</span>
            <div className="font-mono text-gray-700 mt-0.5 text-[12px]">
              /api/webhooks/telnyx
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
