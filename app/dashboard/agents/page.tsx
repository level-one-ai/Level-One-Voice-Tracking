"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Agent {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
  webhook_url: string;
  is_published: boolean;
  last_modified: number;
  llm_id: string;
}

function formatDate(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const isActive = (a: Agent) => a.webhook_url?.includes("/api/webhooks/retell");

  const activateAgent = async (agent_id: string) => {
    setUpdating(agent_id);
    try {
      const res = await fetch("/api/agents/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id, set_active: true }),
      });
      if (!res.ok) throw new Error("Failed to activate");
      showToast("Agent activated — webhook connected", "success");
      await fetchAgents();
    } catch {
      showToast("Failed to activate agent", "error");
    } finally {
      setUpdating(null);
    }
  };

  const deactivateAgent = async (agent_id: string) => {
    setUpdating(agent_id);
    try {
      const res = await fetch("/api/agents/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id }),
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      showToast("Agent deactivated", "success");
      await fetchAgents();
    } catch {
      showToast("Failed to deactivate agent", "error");
    } finally {
      setUpdating(null);
    }
  };

  const activateSelected = async () => {
    if (selected.size === 0) return;
    setUpdating("multi");
    try {
      const ids = Array.from(selected);
      await Promise.all(ids.map((id) =>
        fetch("/api/agents/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent_id: id, set_active: true }),
        })
      ));
      showToast(`${ids.length} agents activated`, "success");
      setSelected(new Set());
      await fetchAgents();
    } catch {
      showToast("Failed to activate selected agents", "error");
    } finally {
      setUpdating(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === agents.length) setSelected(new Set());
    else setSelected(new Set(agents.map((a) => a.agent_id)));
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium animate-slide-up
          ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.type === "success"
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Agent Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Activate, deactivate, and manage your Retell voice agents</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAgents}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/8 text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
          <Link href="/dashboard/agents/create"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-[13px] font-medium hover:bg-orange-600 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create New Agent
          </Link>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200/80 mb-6 animate-fade-in">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div className="text-[13px] text-blue-700">
          <span className="font-semibold">Active agents</span> have their webhook connected to this system and will process calls through the CRM pipeline. Dormant agents remain in Retell but send no data here. You can activate multiple agents simultaneously using the multi-select checkboxes.
        </div>
      </div>

      {/* Multi-select toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-orange-50 border border-orange-200 rounded-xl animate-fade-in">
          <span className="text-[13px] font-medium text-orange-700">{selected.size} agent{selected.size !== 1 ? "s" : ""} selected</span>
          <button onClick={activateSelected} disabled={updating === "multi"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-[12px] font-medium hover:bg-orange-600 transition-colors disabled:opacity-50">
            {updating === "multi" ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"/> : null}
            Activate All Selected
          </button>
          <button onClick={() => setSelected(new Set())} className="text-[12px] text-orange-600 hover:text-orange-800">Clear</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="glass-card p-12 text-center text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"/>
            Loading agents from Retell...
          </div>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-red-500 text-[13px]">{error}</div>
      ) : agents.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-400 text-[13px] mb-3">No agents found in your Retell account.</p>
          <Link href="/dashboard/agents/create" className="text-[13px] text-orange-500 font-medium hover:text-orange-600">Create your first agent →</Link>
        </div>
      ) : (
        <div className="glass-table overflow-hidden animate-fade-in">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-black/5">
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.size === agents.length && agents.length > 0}
                    onChange={selectAll}
                    className="w-3.5 h-3.5 rounded accent-orange-500 cursor-pointer" />
                </th>
                {["Agent Name", "Voice", "Language", "Status", "Last Modified", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, i) => {
                const active = isActive(agent);
                return (
                  <tr key={agent.agent_id}
                    className={`border-b border-black/[0.04] transition-colors hover:bg-black/[0.015] ${i === agents.length - 1 ? "border-b-0" : ""} ${selected.has(agent.agent_id) ? "bg-orange-50/40" : ""}`}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={selected.has(agent.agent_id)}
                        onChange={() => toggleSelect(agent.agent_id)}
                        className="w-3.5 h-3.5 rounded accent-orange-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-900">{agent.agent_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">{agent.agent_id}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-[12px] font-mono">{agent.voice_id || "—"}</td>
                    <td className="px-4 py-3.5 text-gray-600">{agent.language || "en-US"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1
                        ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-gray-100 text-gray-500 ring-gray-200"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`}/>
                        {active ? "Active" : "Dormant"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-[12px]">{formatDate(agent.last_modified)}</td>
                    <td className="px-4 py-3.5 text-right">
                      {updating === agent.agent_id ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-400">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"/>
                          Updating...
                        </span>
                      ) : active ? (
                        <button onClick={() => deactivateAgent(agent.agent_id)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors">
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => activateAgent(agent.agent_id)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-black/5 text-[12px] text-gray-400">
            {agents.filter(isActive).length} active · {agents.filter((a) => !isActive(a)).length} dormant · {agents.length} total
          </div>
        </div>
      )}
    </div>
  );
}
