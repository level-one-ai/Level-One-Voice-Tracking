"use client";

import { useState, useEffect, useCallback } from "react";

interface RetellCall {
  call_id: string;
  from_number: string;
  to_number: string;
  start_timestamp: number;
  end_timestamp: number;
  duration_seconds: number;
  call_status: string;
  transcript: string;
  recording_url: string;
  sentiment: string;
  call_summary: string;
  call_successful: boolean | null;
  dynamic_variables: Record<string, string>;
}

function formatTimestamp(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(s: number) {
  if (!s) return "0:00";
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

// Group calls by from_number
function groupByNumber(calls: RetellCall[]): Record<string, RetellCall[]> {
  return calls.reduce((acc, call) => {
    const num = call.from_number || "Unknown";
    if (!acc[num]) acc[num] = [];
    acc[num].push(call);
    return acc;
  }, {} as Record<string, RetellCall[]>);
}

function TranscriptModal({ call, onClose }: { call: RetellCall; onClose: () => void }) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="w-full max-w-2xl glass-card overflow-hidden animate-slide-up"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">Call Transcript</h2>
            <p className="text-[11px] font-mono text-gray-400 mt-0.5">{call.from_number} · {formatTimestamp(call.start_timestamp)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-gray-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-px bg-black/5 border-b border-black/5">
          {[
            { label: "Duration", value: formatDuration(call.duration_seconds) },
            { label: "Status", value: <span className="capitalize">{call.call_status}</span> },
            { label: "Sentiment", value: call.sentiment || "N/A" },
          ].map((item) => (
            <div key={item.label} className="bg-white px-4 py-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-[13px] text-gray-700">{item.value}</div>
            </div>
          ))}
        </div>

        {call.call_summary && (
          <div className="px-6 py-3 border-b border-black/5">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">AI Summary</div>
            <p className="text-[13px] text-gray-700 leading-relaxed">{call.call_summary}</p>
          </div>
        )}

        {call.recording_url && (
          <div className="px-6 py-3 border-b border-black/5">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recording</div>
            <audio controls className="w-full" style={{ height: "32px" }}>
              <source src={call.recording_url} type="audio/wav" />
            </audio>
          </div>
        )}

        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "300px" }}>
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Full Transcript</div>
          {call.transcript ? (
            <pre className="text-[12.5px] text-gray-700 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50 rounded-xl p-4">
              {call.transcript}
            </pre>
          ) : (
            <p className="text-[13px] text-gray-400 italic">No transcript available for this call.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CallerHistoryPage() {
  const [calls, setCalls] = useState<RetellCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedNumbers, setExpandedNumbers] = useState<Set<string>>(new Set());
  const [selectedCall, setSelectedCall] = useState<RetellCall | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/retell-calls");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCalls(data.calls ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const toggleNumber = (num: string) => {
    setExpandedNumbers((prev) => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const filteredCalls = calls.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.from_number?.includes(q) || c.call_summary?.toLowerCase().includes(q) || c.transcript?.toLowerCase().includes(q);
  });

  const grouped = groupByNumber(filteredCalls);
  const sortedNumbers = Object.keys(grouped).sort((a, b) =>
    (grouped[b][0]?.start_timestamp ?? 0) - (grouped[a][0]?.start_timestamp ?? 0)
  );

  const totalNumbers = Object.keys(groupByNumber(calls)).length;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Caller History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Every number that has contacted you — with full transcripts for each call
          </p>
        </div>
        <button onClick={fetchCalls}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-[13px] font-medium hover:bg-orange-600 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
        {[
          { label: "Unique Callers", value: totalNumbers },
          { label: "Total Calls", value: calls.length },
          { label: "With Transcripts", value: calls.filter((c) => c.transcript).length },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4">
            <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
            <div className="text-[12px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 animate-fade-in">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search by number or transcript content..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-white border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder-gray-400"
        />
      </div>

      {/* Grouped caller list */}
      {loading ? (
        <div className="glass-card p-12 text-center text-gray-400 animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"/>
            Loading caller history...
          </div>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center animate-fade-in">
          <p className="text-red-500 text-[13px] mb-1">{error}</p>
          <p className="text-gray-400 text-[12px]">Make sure RETELL_API_KEY is set in Vercel environment variables.</p>
        </div>
      ) : sortedNumbers.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-400 text-[13px] animate-fade-in">
          {search ? "No callers match your search." : "No calls recorded yet."}
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {sortedNumbers.map((number) => {
            const numberCalls = grouped[number];
            const latest = numberCalls[0];
            const isExpanded = expandedNumbers.has(number);
            const callCount = numberCalls.length;

            return (
              <div key={number} className="glass-card overflow-hidden">
                {/* Number header row */}
                <button
                  onClick={() => toggleNumber(number)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/[0.015] transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 12 19.79 19.79 0 0 1 1.15 3.42 2 2 0 0 1 3.12 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-mono text-[14px] font-semibold text-gray-900">{number}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {callCount} call{callCount !== 1 ? "s" : ""} · Last: {formatTimestamp(latest.start_timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 ring-1 ring-orange-200">
                      {callCount} call{callCount !== 1 ? "s" : ""}
                    </span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>

                {/* Expanded call list */}
                {isExpanded && (
                  <div className="border-t border-black/5">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="border-b border-black/5 bg-gray-50/50">
                          {["Date & Time", "Duration", "Status", "Sentiment", "Summary", ""].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {numberCalls.map((call, i) => (
                          <tr key={call.call_id}
                            className={`border-b border-black/[0.04] hover:bg-black/[0.015] transition-colors ${i === numberCalls.length - 1 ? "border-b-0" : ""}`}>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatTimestamp(call.start_timestamp)}</td>
                            <td className="px-4 py-3 text-gray-600">{formatDuration(call.duration_seconds)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-medium capitalize
                                ${call.call_status === "ended" ? "text-emerald-600" : "text-amber-600"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${call.call_status === "ended" ? "bg-emerald-500" : "bg-amber-400"}`}/>
                                {call.call_status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[11px] font-medium capitalize
                                ${call.sentiment?.toLowerCase() === "positive" ? "text-emerald-600" :
                                  call.sentiment?.toLowerCase() === "negative" ? "text-red-500" : "text-gray-500"}`}>
                                {call.sentiment || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 max-w-[260px]">
                              <span className="line-clamp-1">{call.call_summary || "—"}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setSelectedCall(call)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-orange-500 hover:bg-orange-50 transition-colors whitespace-nowrap">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                                View Transcript
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedCall && <TranscriptModal call={selectedCall} onClose={() => setSelectedCall(null)} />}
    </div>
  );
}
