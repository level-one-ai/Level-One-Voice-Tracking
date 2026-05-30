"use client";

import { useState, useEffect, useCallback } from "react";
import { CallRecord } from "@/lib/types";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimestamp(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const s = sentiment?.toLowerCase();
  const styles =
    s === "positive"
      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      : s === "negative"
      ? "bg-red-50 text-red-700 ring-1 ring-red-200"
      : "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${styles}`}>
      {sentiment || "Unknown"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isEnded = status === "ended";
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]">
      <span className={`w-1.5 h-1.5 rounded-full ${isEnded ? "bg-emerald-500" : "bg-amber-400"}`} />
      <span className="text-gray-600 capitalize">{status || "unknown"}</span>
    </span>
  );
}

function TranscriptModal({
  call,
  onClose,
}: {
  call: CallRecord;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl glass-card p-0 overflow-hidden animate-slide-up"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">Call Transcript</h2>
            <p className="text-[12px] text-gray-400 mt-0.5 font-mono">{call.call_id}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-gray-500 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Meta info */}
        <div className="px-6 py-3 bg-gray-50/50 border-b border-black/5 grid grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Caller</div>
            <div className="text-[13px] text-gray-700 font-mono mt-0.5">{call.from_number || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Duration</div>
            <div className="text-[13px] text-gray-700 mt-0.5">{formatDuration(call.duration_seconds)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sentiment</div>
            <div className="mt-0.5">
              <SentimentBadge sentiment={call.sentiment} />
            </div>
          </div>
        </div>

        {/* Recording link */}
        {call.recording_url && (
          <div className="px-6 py-3 border-b border-black/5 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <a
              href={call.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-orange-500 hover:text-orange-600 font-medium underline underline-offset-2"
            >
              Listen to Recording
            </a>
          </div>
        )}

        {/* Transcript */}
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: "50vh" }}>
          {call.transcript ? (
            <pre className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
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

export default function CallsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calls");
      if (!res.ok) throw new Error("Failed to fetch calls");
      const data = await res.json();
      setCalls(data.calls ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const filteredCalls = calls.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.from_number?.toLowerCase().includes(q) ||
      c.lead_name?.toLowerCase().includes(q) ||
      c.call_status?.toLowerCase().includes(q) ||
      c.sentiment?.toLowerCase().includes(q) ||
      c.call_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Call Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">Full log of all AI agent interactions</p>
        </div>
        <button
          onClick={fetchCalls}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-[13px] font-medium hover:bg-orange-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 animate-fade-in">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by caller, name, status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-white border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="glass-table animate-fade-in">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-black/5">
              {["Timestamp", "Caller ID", "Duration", "Status", "Sentiment", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                    Loading calls...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-red-500 text-[13px]">
                  {error}
                </td>
              </tr>
            ) : filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-[13px]">
                  {searchQuery ? "No calls match your search." : "No calls recorded yet."}
                </td>
              </tr>
            ) : (
              filteredCalls.map((call, i) => (
                <tr
                  key={call.call_id}
                  className={`border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors ${
                    i === filteredCalls.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 text-gray-500 text-[12px] whitespace-nowrap">
                    {formatTimestamp(call.created_at)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[12px] text-gray-700">
                    {call.from_number || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">
                    {formatDuration(call.duration_seconds)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={call.call_status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <SentimentBadge sentiment={call.sentiment} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedCall(call)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-orange-500 hover:bg-orange-50 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Transcript
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && filteredCalls.length > 0 && (
          <div className="px-5 py-3 border-t border-black/5 text-[12px] text-gray-400">
            Showing {filteredCalls.length} of {calls.length} calls
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {selectedCall && (
        <TranscriptModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  );
}
