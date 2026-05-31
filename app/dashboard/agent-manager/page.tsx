"use client";

import { useState, useEffect, useCallback } from "react";

interface Agent {
  agent_id: string;
  agent_name: string;
  is_published: boolean;
  voice_id: string;
  llm_id: string;
  last_modified: number;
}

const VOICE_OPTIONS = [
  { id: "retell-Cimo", label: "Cimo (Retell)" },
  { id: "11labs-Adrian", label: "Adrian (ElevenLabs)" },
  { id: "11labs-Matilda", label: "Matilda (ElevenLabs)" },
  { id: "11labs-Nicole", label: "Nicole (ElevenLabs)" },
  { id: "openai-Alloy", label: "Alloy (OpenAI)" },
  { id: "openai-Echo", label: "Echo (OpenAI)" },
  { id: "openai-Nova", label: "Nova (OpenAI)" },
  { id: "openai-Shimmer", label: "Shimmer (OpenAI)" },
];

const LANGUAGE_OPTIONS = [
  { id: "en-US", label: "English (US)" },
  { id: "en-GB", label: "English (UK)" },
  { id: "en-AU", label: "English (AU)" },
  { id: "es-ES", label: "Spanish" },
  { id: "fr-FR", label: "French" },
  { id: "de-DE", label: "German" },
];

function formatTimestamp(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AgentManagerPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<"idle" | "success" | "error">("idle");
  const [createMessage, setCreateMessage] = useState("");
  const [form, setForm] = useState({
    agent_name: "",
    voice_id: "retell-Cimo",
    language: "en-GB",
    begin_message: "",
    system_prompt: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, activeRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/agents/activate"),
      ]);
      const agentsData = await agentsRes.json();
      const activeData = await activeRes.json();
      setAgents(agentsData.agents ?? []);
      setActiveIds(activeData.active_agent_ids ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleAgentSelection = (agentId: string) => {
    setActiveIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const saveActiveAgents = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/agents/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_ids: activeIds }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaveStatus("success");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 4000);
    }
  };

  const handleCreate = async () => {
    if (!form.agent_name.trim() || !form.system_prompt.trim()) {
      setCreateStatus("error");
      setCreateMessage("Agent name and system prompt are required.");
      return;
    }
    setCreating(true);
    setCreateStatus("idle");
    try {
      const res = await fetch("/api/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setCreateStatus("success");
      setCreateMessage(`Agent "${data.agent_name}" created successfully. Agent ID: ${data.agent_id}`);
      setForm({ agent_name: "", voice_id: "retell-Cimo", language: "en-GB", begin_message: "", system_prompt: "" });
      setShowCreateForm(false);
      await fetchData(); // Refresh agent list
    } catch (err) {
      setCreateStatus("error");
      setCreateMessage(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
      setTimeout(() => { setCreateStatus("idle"); setCreateMessage(""); }, 6000);
    }
  };

  const activeCount = activeIds.length;
  const totalAgents = agents.length;

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Agent Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage your Retell AI voice agents — set active agents for inbound calls
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-black/8 text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
          <button onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-[13px] font-medium hover:bg-orange-600 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create New Agent
          </button>
        </div>
      </div>

      {/* Create status message */}
      {createStatus !== "idle" && createMessage && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-[13px] flex items-start gap-2 animate-fade-in
          ${createStatus === "success" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-600 ring-1 ring-red-200"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            {createStatus === "success"
              ? <polyline points="20 6 9 17 4 12"/>
              : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
            }
          </svg>
          {createMessage}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="glass-card p-6 mb-6 animate-slide-up">
          <h2 className="text-[14px] font-semibold text-gray-800 mb-4">Create New Agent</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Agent Name *</label>
              <input
                type="text" placeholder="e.g. Level One Inbound Agent"
                value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
                className="w-full px-3 py-2.5 text-[13px] bg-white border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Voice *</label>
              <select value={form.voice_id} onChange={(e) => setForm({ ...form, voice_id: e.target.value })}
                className="w-full px-3 py-2.5 text-[13px] bg-white border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all">
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Language</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full px-3 py-2.5 text-[13px] bg-white border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all">
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Opening Message</label>
              <input
                type="text" placeholder="e.g. Hi! Thanks for calling Level One..."
                value={form.begin_message} onChange={(e) => setForm({ ...form, begin_message: e.target.value })}
                className="w-full px-3 py-2.5 text-[13px] bg-white border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">System Prompt *</label>
            <textarea
              rows={8}
              placeholder="You are an AI voice assistant for Level One. Your goal is to qualify inbound callers and collect their information.&#10;&#10;When speaking with a caller:&#10;1. Greet them warmly&#10;2. Ask about their business and AI goals&#10;3. Collect name, email, business type&#10;4. Determine if they are a good fit for The Architect"
              value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
              className="w-full px-3 py-2.5 text-[13px] bg-white border border-black/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all resize-none font-mono"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-[13px] text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} disabled={creating}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold transition-all
                ${creating ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600 shadow-sm"}`}>
              {creating ? (
                <><div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"/>Creating in Retell...</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>Create Agent</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active agents info */}
      <div className="glass-card p-5 mb-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-gray-700">Active Agent Selection</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Select one or more agents below. Your Telnyx webhook will route calls to the active agent(s).
              {activeCount > 1 && " Multiple agents selected — calls will use the first active agent."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === "success" && (
              <span className="text-[12px] text-emerald-600 flex items-center gap-1 animate-fade-in">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-[12px] text-red-500 animate-fade-in">Failed to save</span>
            )}
            <span className="text-[12px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              {activeCount} of {totalAgents} active
            </span>
            <button onClick={saveActiveAgents} disabled={saving}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all
                ${saving ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600 shadow-sm"}`}>
              {saving ? (
                <><div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"/>Saving...</>
              ) : "Save Selection"}
            </button>
          </div>
        </div>
      </div>

      {/* Agent list */}
      {loading ? (
        <div className="glass-card p-12 text-center text-gray-400 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"/>
            Loading agents from Retell...
          </div>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center animate-fade-in">
          <p className="text-red-500 text-[13px] mb-1">{error}</p>
          <p className="text-gray-400 text-[12px]">Make sure RETELL_API_KEY is set in Vercel environment variables.</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <p className="text-gray-400 text-[13px] mb-3">No agents found in your Retell account.</p>
          <button onClick={() => setShowCreateForm(true)}
            className="text-orange-500 text-[13px] font-medium hover:underline">
            Create your first agent →
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {agents.map((agent) => {
            const isActive = activeIds.includes(agent.agent_id);
            return (
              <div key={agent.agent_id}
                className={`glass-card p-5 transition-all ${isActive ? "ring-2 ring-orange-400 ring-offset-1" : ""}`}>
                <div className="flex items-center gap-4">
                  {/* Multi-select checkbox */}
                  <button
                    onClick={() => toggleAgentSelection(agent.agent_id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${isActive ? "bg-orange-500 border-orange-500" : "border-gray-300 hover:border-orange-400"}`}>
                    {isActive && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>

                  {/* Agent icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isActive ? "bg-orange-500" : "bg-gray-100"}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive ? "white" : "#6b7280"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="22"/>
                    </svg>
                  </div>

                  {/* Agent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] font-semibold text-gray-900 truncate">{agent.agent_name}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wider flex-shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="font-mono">{agent.agent_id}</span>
                      <span>·</span>
                      <span>Voice: {agent.voice_id}</span>
                      <span>·</span>
                      <span>Modified: {formatTimestamp(agent.last_modified)}</span>
                    </div>
                  </div>

                  {/* Status pill */}
                  <div className={`text-[11px] font-medium px-2.5 py-1 rounded-full ring-1 flex-shrink-0
                    ${agent.is_published
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-gray-100 text-gray-500 ring-gray-200"}`}>
                    {agent.is_published ? "Published" : "Draft"}
                  </div>
                </div>

                {/* LLM ID */}
                {agent.llm_id && (
                  <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">LLM:</span>
                    <span className="text-[11px] font-mono text-gray-500">{agent.llm_id}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help note */}
      {!loading && agents.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200/80 text-[12px] text-blue-700 animate-fade-in">
          <span className="font-semibold">Note: </span>
          Selecting agents here saves your preference to Firestore. To change which agent handles inbound Telnyx calls,
          update the <code className="bg-blue-100 px-1 rounded text-[11px]">RETELL_AGENT_ID</code> environment variable
          in Vercel to match your chosen agent&apos;s ID, then redeploy.
        </div>
      )}
    </div>
  );
}
