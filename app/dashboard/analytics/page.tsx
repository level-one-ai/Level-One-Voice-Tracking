"use client";

import { useState, useEffect, useCallback } from "react";

interface RetellCall {
  call_id: string;
  agent_id: string;
  agent_name: string;
  call_type: string;
  call_status: string;
  from_number: string;
  to_number: string;
  start_timestamp: number;
  end_timestamp: number;
  duration_seconds: number;
  transcript: string;
  recording_url: string;
  disconnection_reason: string;
  sentiment: string;
  call_successful: boolean | null;
  call_summary: string;
  agent_task_completion: string;
  dynamic_variables: Record<string, string>;
}

function formatDuration(seconds: number) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimestamp(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const s = sentiment?.toLowerCase();
  const cls = s === "positive"
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : s === "negative"
    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
    : "bg-gray-100 text-gray-500 ring-1 ring-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {sentiment || "N/A"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const cls = s === "ended"
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : s === "error"
    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
    : s === "ongoing"
    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s === "ended" ? "bg-emerald-500" : s === "error" ? "bg-red-500" : s === "ongoing" ? "bg-blue-500" : "bg-amber-400"}`} />
      {status || "unknown"}
    </span>
  );
}

function CallDetailModal({ call, onClose }: { call: RetellCall; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl glass-card overflow-hidden animate-slide-up"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">Call Detail</h2>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{call.call_id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-gray-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 64px)" }}>
          {/* Meta grid */}
          <div className="grid grid-cols-3 gap-px bg-black/5 border-b border-black/5">
            {[
              { label: "Start Time", value: formatTimestamp(call.start_timestamp) },
              { label: "Duration", value: formatDuration(call.duration_seconds) },
              { label: "Status", value: <StatusBadge status={call.call_status} /> },
              { label: "From", value: <span className="font-mono text-[12px]">{call.from_number || "—"}</span> },
              { label: "To", value: <span className="font-mono text-[12px]">{call.to_number || "—"}</span> },
              { label: "Sentiment", value: <SentimentBadge sentiment={call.sentiment} /> },
            ].map((item) => (
              <div key={item.label} className="bg-white px-4 py-3">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</div>
                <div className="text-[13px] text-gray-700">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Call Summary */}
          {call.call_summary && (
            <div className="px-6 py-4 border-b border-black/5">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Summary</div>
              <p className="text-[13px] text-gray-700 leading-relaxed">{call.call_summary}</p>
            </div>
          )}

          {/* Task completion */}
          {call.agent_task_completion && (
            <div className="px-6 py-3 border-b border-black/5 flex items-center gap-3">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Agent Task Completion</div>
              <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ring-1 ${call.agent_task_completion === "complete" ? "text-emerald-700 bg-emerald-50 ring-emerald-200" : "text-amber-700 bg-amber-50 ring-amber-200"}`}>
                {call.agent_task_completion}
              </span>
            </div>
          )}

          {/* Disconnection reason */}
          {call.disconnection_reason && (
            <div className="px-6 py-3 border-b border-black/5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Disconnection Reason: </span>
              <span className="text-[12px] text-gray-600">{call.disconnection_reason.replace(/_/g, " ")}</span>
            </div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <div className="px-6 py-3 border-b border-black/5">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recording</div>
              <audio controls className="w-full h-8" style={{ height: "32px" }}>
                <source src={call.recording_url} type="audio/wav" />
              </audio>
              <a href={call.recording_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-[12px] text-orange-500 hover:text-orange-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download recording
              </a>
            </div>
          )}

          {/* Dynamic variables */}
          {Object.keys(call.dynamic_variables).length > 0 && (
            <div className="px-6 py-4 border-b border-black/5">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Captured Data</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(call.dynamic_variables).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="text-[10px] text-gray-400 font-medium">{k}</div>
                    <div className="text-[12px] text-gray-700 font-medium mt-0.5">{String(v) || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          <div className="px-6 py-4">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Transcript</div>
            {call.transcript ? (
              <pre className="text-[12.5px] text-gray-700 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                {call.transcript}
              </pre>
            ) : (
              <p className="text-[13px] text-gray-400 italic">No transcript available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<RetellCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<RetellCall | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/retell-calls");
      if (!res.ok) throw new Error("Failed to fetch from Retell");
      const data = await res.json();
      setCalls(data.calls ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  // Stats
  const totalCalls = calls.length;
  const avgDuration = calls.length > 0
    ? Math.round(calls.reduce((a, c) => a + c.duration_seconds, 0) / calls.length)
    : 0;
  const successfulCalls = calls.filter((c) => c.call_successful === true).length;
  const positiveSentiment = calls.filter((c) => c.sentiment?.toLowerCase() === "positive").length;

  const filtered = calls.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.from_number?.includes(q) ||
      c.call_id?.toLowerCase().includes(q) ||
      c.call_summary?.toLowerCase().includes(q) ||
      c.sentiment?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.call_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statuses = ["all", ...Array.from(new Set(calls.map((c) => c.call_status).filter(Boolean)))];

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Call Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Live data pulled directly from Retell AI — every call, every detail</p>
        </div>
        <button onClick={fetchCalls}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-[13px] font-medium hover:bg-orange-600 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Sync from Retell
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6 animate-fade-in">
        {[
          { label: "Total Calls", value: totalCalls, sub: "From Retell history", icon: "📞" },
          { label: "Avg Duration", value: formatDuration(avgDuration), sub: "Per call", icon: "⏱" },
          { label: "Successful Calls", value: successfulCalls, sub: `${totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0}% success rate`, icon: "✅" },
          { label: "Positive Sentiment", value: positiveSentiment, sub: `${totalCalls > 0 ? Math.round((positiveSentiment / totalCalls) * 100) : 0}% of calls`, icon: "😊" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-3xl font-semibold text-gray-900 tracking-tight mb-0.5">{s.value}</div>
            <div className="text-[13px] font-medium text-gray-600">{s.label}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap animate-fade-in">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search by number, summary, sentiment..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-white border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder-gray-400"
          />
        </div>
        <div className="flex gap-1 items-center bg-white border border-black/8 rounded-xl px-2 py-1.5">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all capitalize
                ${statusFilter === s ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-table animate-fade-in overflow-x-auto">
        <table className="w-full text-[13px] min-w-[900px]">
          <thead>
            <tr className="border-b border-black/5">
              {["Time", "From", "To", "Duration", "Status", "Sentiment", "Task Complete", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"/>
                  Syncing from Retell API...
                </div>
              </td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center">
                <div className="text-red-500 text-[13px] mb-2">{error}</div>
                <p className="text-gray-400 text-[12px]">Make sure RETELL_API_KEY is set in your Vercel environment variables.</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-[13px]">
                {search || statusFilter !== "all" ? "No calls match your filters." : "No calls found in Retell."}
              </td></tr>
            ) : (
              filtered.map((call, i) => (
                <tr key={call.call_id}
                  className={`border-b border-black/[0.04] hover:bg-black/[0.015] transition-colors ${i === filtered.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-4 py-3.5 text-gray-500 text-[12px] whitespace-nowrap">
                    {formatTimestamp(call.start_timestamp)}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-gray-600">{call.from_number || "—"}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-gray-600">{call.to_number || "—"}</td>
                  <td className="px-4 py-3.5 text-gray-600">{formatDuration(call.duration_seconds)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={call.call_status} /></td>
                  <td className="px-4 py-3.5"><SentimentBadge sentiment={call.sentiment} /></td>
                  <td className="px-4 py-3.5">
                    {call.agent_task_completion ? (
                      <span className={`text-[11px] font-medium capitalize ${call.agent_task_completion === "complete" ? "text-emerald-600" : "text-amber-600"}`}>
                        {call.agent_task_completion}
                      </span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button onClick={() => setSelectedCall(call)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-orange-500 hover:bg-orange-50 transition-colors whitespace-nowrap">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      View Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-black/5 text-[12px] text-gray-400">
            {filtered.length} of {totalCalls} calls shown
          </div>
        )}
      </div>

      {selectedCall && <CallDetailModal call={selectedCall} onClose={() => setSelectedCall(null)} />}
    </div>
  );
}
