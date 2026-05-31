"use client";

import { useState, useEffect, useCallback } from "react";

interface RetellCall {
  call_id: string;
  from_number: string;
  to_number: string;
  start_timestamp: number;
  duration_seconds: number;
  call_status: string;
  sentiment: string;
  call_summary: string;
  transcript: string;
  recording_url: string;
  dynamic_variables: Record<string, string>;
}

interface CallerGroup {
  number: string;
  calls: RetellCall[];
  lastCall: number;
  totalCalls: number;
  sentiments: string[];
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

function SentimentBadge({ s }: { s: string }) {
  const l = s?.toLowerCase();
  const cls = l === "positive" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : l === "negative" ? "bg-red-50 text-red-700 ring-1 ring-red-200"
    : "bg-gray-100 text-gray-500 ring-1 ring-gray-200";
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>{s || "N/A"}</span>;
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
        style={{ maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">Call Transcript</h3>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{formatTimestamp(call.start_timestamp)} · {formatDuration(call.duration_seconds)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-gray-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(88vh - 64px)" }}>
          {call.call_summary && (
            <div className="px-6 py-4 border-b border-black/5 bg-orange-50/40">
              <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider mb-1">AI Summary</p>
              <p className="text-[13px] text-gray-700 leading-relaxed">{call.call_summary}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-px bg-black/5 border-b border-black/5">
            {[
              { l: "Status", v: call.call_status },
              { l: "Sentiment", v: <SentimentBadge s={call.sentiment} /> },
            ].map((item) => (
              <div key={item.l} className="bg-white px-4 py-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{item.l}</p>
                <div className="text-[13px] text-gray-700">{item.v}</div>
              </div>
            ))}
          </div>
          {call.recording_url && (
            <div className="px-6 py-4 border-b border-black/5">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recording</p>
              <audio controls className="w-full" style={{ height: "32px" }}>
                <source src={call.recording_url} type="audio/wav" />
              </audio>
            </div>
          )}
          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Transcript</p>
            {call.transcript
              ? <pre className="text-[12.5px] text-gray-700 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50 rounded-xl p-4 max-h-72 overflow-y-auto">{call.transcript}</pre>
              : <p className="text-[13px] text-gray-400 italic">No transcript available.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CallersPage() {
  const [groups, setGroups] = useState<CallerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openNumber, setOpenNumber] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<RetellCall | null>(null);
  const [search, setSearch] = useState("");

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/retell-calls");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const calls: RetellCall[] = data.calls ?? [];

      // Group by from_number
      const map = new Map<string, RetellCall[]>();
      calls.forEach((c) => {
        const num = c.from_number || "Unknown";
        if (!map.has(num)) map.set(num, []);
        map.get(num)!.push(c);
      });

      const grouped: CallerGroup[] = Array.from(map.entries())
        .map(([number, calls]) => ({
          number,
          calls: calls.sort((a, b) => b.start_timestamp - a.start_timestamp),
          lastCall: Math.max(...calls.map((c) => c.start_timestamp)),
          totalCalls: calls.length,
          sentiments: calls.map((c) => c.sentiment).filter(Boolean),
        }))
        .sort((a, b) => b.lastCall - a.lastCall);

      setGroups(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const filtered = groups.filter((g) =>
    !search || g.number.includes(search)
  );

  const dominantSentiment = (sentiments: string[]) => {
    const counts: Record<string, number> = {};
    sentiments.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Caller Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Every inbound number — expand to view all transcripts and recordings</p>
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
          { label: "Unique Callers", value: groups.length },
          { label: "Total Calls", value: groups.reduce((a, g) => a + g.totalCalls, 0) },
          { label: "Avg Calls / Caller", value: groups.length > 0 ? (groups.reduce((a, g) => a + g.totalCalls, 0) / groups.length).toFixed(1) : "0" },
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
        <input type="text" placeholder="Search by phone number..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-white border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder-gray-400" />
      </div>

      {/* Caller list */}
      {loading ? (
        <div className="glass-table p-12 text-center text-gray-400">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"/>
            Loading callers...
          </div>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-red-500 text-[13px]">{error}<br/><span className="text-gray-400 text-[12px]">Make sure RETELL_API_KEY is set in Vercel.</span></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-gray-400 text-[13px]">
          {search ? "No callers match your search." : "No calls recorded yet."}
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in">
          {filtered.map((group) => (
            <div key={group.number} className="glass-card overflow-hidden">
              {/* Caller header row */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/[0.015] transition-colors text-left"
                onClick={() => setOpenNumber(openNumber === group.number ? null : group.number)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 12 19.79 19.79 0 0 1 1.15 3.42 2 2 0 0 1 3.12 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-mono text-[14px] font-semibold text-gray-900">{group.number}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">Last called {formatTimestamp(group.lastCall)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-[18px] font-semibold text-gray-900">{group.totalCalls}</div>
                    <div className="text-[10px] text-gray-400">call{group.totalCalls !== 1 ? "s" : ""}</div>
                  </div>
                  <SentimentBadge s={dominantSentiment(group.sentiments)} />
                  <svg className={`text-gray-400 transition-transform ${openNumber === group.number ? "rotate-180" : ""}`}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </button>

              {/* Expanded call list */}
              {openNumber === group.number && (
                <div className="border-t border-black/5">
                  {group.calls.map((call, i) => (
                    <div key={call.call_id}
                      className={`flex items-center justify-between px-5 py-3.5 hover:bg-black/[0.015] transition-colors ${i < group.calls.length - 1 ? "border-b border-black/[0.04]" : ""}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-[12px] text-gray-500 w-36">{formatTimestamp(call.start_timestamp)}</div>
                        <div className="text-[12px] text-gray-600">{formatDuration(call.duration_seconds)}</div>
                        <SentimentBadge s={call.sentiment} />
                        {call.call_summary && (
                          <div className="text-[12px] text-gray-500 max-w-xs truncate hidden xl:block">{call.call_summary}</div>
                        )}
                      </div>
                      <button onClick={() => setSelectedCall(call)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-orange-500 hover:bg-orange-50 transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                        Transcript
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedCall && <TranscriptModal call={selectedCall} onClose={() => setSelectedCall(null)} />}
    </div>
  );
}
