"use client";

import { useState, useEffect, useCallback } from "react";
import { CallRecord } from "@/lib/types";

type ConsultationStatus = "pending" | "scheduled" | "completed" | "not_interested";

const STATUS_CONFIG: Record<ConsultationStatus, { label: string; color: string; bg: string; ring: string }> = {
  pending: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-blue-700",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
  not_interested: {
    label: "Not Interested",
    color: "text-red-700",
    bg: "bg-red-50",
    ring: "ring-red-200",
  },
};

function StatusDropdown({
  callId,
  currentStatus,
  onUpdate,
}: {
  callId: string;
  currentStatus: ConsultationStatus;
  onUpdate: (id: string, status: ConsultationStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const config = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.pending;

  const handleSelect = async (status: ConsultationStatus) => {
    if (status === currentStatus) {
      setOpen(false);
      return;
    }
    setUpdating(true);
    setOpen(false);
    try {
      await fetch("/api/calls/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_id: callId, consultation_status: status }),
      });
      onUpdate(callId, status);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ring-1 transition-all
          ${config.color} ${config.bg} ${config.ring}
          ${updating ? "opacity-50 cursor-not-allowed" : "hover:brightness-95 cursor-pointer"}`}
      >
        {updating ? (
          <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : null}
        {config.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 glass-card py-1 w-40 shadow-lg">
            {(Object.keys(STATUS_CONFIG) as ConsultationStatus[]).map((status) => {
              const sc = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => handleSelect(status)}
                  className={`w-full text-left px-3 py-2 text-[12px] font-medium transition-colors
                    ${status === currentStatus ? `${sc.color} ${sc.bg}` : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function PipelinePage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<ConsultationStatus | "all">("all");

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calls");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      // Only show calls with at least a name or email (i.e., leads)
      const leads = (data.calls ?? []).filter(
        (c: CallRecord) => c.lead_name || c.lead_email
      );
      setCalls(leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const handleStatusUpdate = (callId: string, newStatus: ConsultationStatus) => {
    setCalls((prev) =>
      prev.map((c) =>
        c.call_id === callId ? { ...c, consultation_status: newStatus } : c
      )
    );
  };

  const filteredCalls = calls.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.lead_name?.toLowerCase().includes(q) ||
      c.lead_email?.toLowerCase().includes(q) ||
      c.business_type?.toLowerCase().includes(q) ||
      c.ai_objective?.toLowerCase().includes(q);

    const matchesStatus =
      filterStatus === "all" || c.consultation_status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">CRM Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            Leads extracted by the AI — track consultation readiness
          </p>
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

      {/* Filters */}
      <div className="flex gap-3 mb-5 animate-fade-in flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-white border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder-gray-400"
          />
        </div>
        <div className="flex gap-1.5 items-center bg-white border border-black/8 rounded-xl px-2 py-1.5">
          {(["all", "pending", "scheduled", "completed", "not_interested"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-lg text-[12px] font-medium transition-all
                ${filterStatus === s
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-table animate-fade-in overflow-x-auto">
        <table className="w-full text-[13px] min-w-[900px]">
          <thead>
            <tr className="border-b border-black/5">
              {["Name", "Email", "Business Type", "AI Objective", "Implementation", "Consultation Status"].map((h) => (
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
                    Loading pipeline...
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
                  {searchQuery || filterStatus !== "all"
                    ? "No leads match your filters."
                    : "No leads extracted yet. Calls with AI-captured contact data will appear here."}
                </td>
              </tr>
            ) : (
              filteredCalls.map((call, i) => (
                <tr
                  key={call.call_id}
                  className={`border-b border-black/[0.04] hover:bg-black/[0.015] transition-colors ${
                    i === filteredCalls.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {call.lead_name || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 font-mono text-[12px]">
                    {call.lead_email ? (
                      <a
                        href={`mailto:${call.lead_email}`}
                        className="hover:text-orange-500 transition-colors"
                      >
                        {call.lead_email}
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {call.business_type || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 max-w-[200px]">
                    <span className="line-clamp-2">{call.ai_objective || <span className="text-gray-400">—</span>}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {call.implementation_type || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusDropdown
                      callId={call.call_id}
                      currentStatus={(call.consultation_status as ConsultationStatus) ?? "pending"}
                      onUpdate={handleStatusUpdate}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && filteredCalls.length > 0 && (
          <div className="px-5 py-3 border-t border-black/5 text-[12px] text-gray-400">
            {filteredCalls.length} lead{filteredCalls.length !== 1 ? "s" : ""} shown
          </div>
        )}
      </div>
    </div>
  );
}
