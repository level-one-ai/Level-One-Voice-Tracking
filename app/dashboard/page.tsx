import { getDb } from "@/lib/firebase";
import { CallRecord } from "@/lib/types";

async function getDashboardStats() {
  try {
    const db = getDb();
    const snapshot = await db.collection("calls").get();
    const calls: CallRecord[] = snapshot.docs.map(
      (doc) => doc.data() as CallRecord
    );

    const totalCalls = calls.length;
    const totalLeads = calls.filter((c) => c.lead_name && c.lead_name.trim() !== "").length;

    const sentimentScores: Record<string, number> = {
      positive: 1, Positive: 1,
      neutral: 0, Neutral: 0,
      negative: -1, Negative: -1,
    };

    const scoredCalls = calls.filter(
      (c) => c.sentiment && sentimentScores[c.sentiment] !== undefined
    );
    const avgSentimentScore =
      scoredCalls.length > 0
        ? scoredCalls.reduce((acc, c) => acc + (sentimentScores[c.sentiment] ?? 0), 0) / scoredCalls.length
        : 0;

    const avgSentimentLabel =
      avgSentimentScore > 0.2 ? "Positive" : avgSentimentScore < -0.2 ? "Negative" : "Neutral";

    const recentCalls = calls
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const consultationBreakdown = {
      pending: calls.filter((c) => c.consultation_status === "pending").length,
      scheduled: calls.filter((c) => c.consultation_status === "scheduled").length,
      completed: calls.filter((c) => c.consultation_status === "completed").length,
      not_interested: calls.filter((c) => c.consultation_status === "not_interested").length,
    };

    return { totalCalls, totalLeads, avgSentimentLabel, avgSentimentScore, recentCalls, consultationBreakdown };
  } catch (err) {
    console.error("Failed to fetch dashboard stats:", err);
    return {
      totalCalls: 0, totalLeads: 0, avgSentimentLabel: "N/A", avgSentimentScore: 0,
      recentCalls: [],
      consultationBreakdown: { pending: 0, scheduled: 0, completed: 0, not_interested: 0 },
    };
  }
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const s = sentiment?.toLowerCase();
  const styles =
    s === "positive" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
    s === "negative" ? "bg-red-50 text-red-700 ring-1 ring-red-200" :
    "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${styles}`}>
      {sentiment || "Unknown"}
    </span>
  );
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const metrics = [
    {
      label: "Total Calls", value: stats.totalCalls.toString(), sub: "All time",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 12 19.79 19.79 0 0 1 1.15 3.42 2 2 0 0 1 3.12 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>,
    },
    {
      label: "Leads Extracted", value: stats.totalLeads.toString(),
      sub: `${stats.totalCalls > 0 ? Math.round((stats.totalLeads / stats.totalCalls) * 100) : 0}% conversion`,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: "Avg. Sentiment", value: stats.avgSentimentLabel, sub: "Across all calls",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    },
    {
      label: "Consultations Booked", value: stats.consultationBreakdown.scheduled.toString(),
      sub: `${stats.consultationBreakdown.completed} completed`,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time intelligence from your AI voice agent</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {metrics.map((m, i) => (
          <div key={m.label} className={`glass-card p-5 animate-slide-up stagger-${i + 1}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">{m.icon}</div>
            </div>
            <div className="text-3xl font-semibold text-gray-900 tracking-tight mb-0.5">{m.value}</div>
            <div className="text-[13px] font-medium text-gray-600">{m.label}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-5 mb-6 animate-fade-in">
        <h2 className="text-[13px] font-semibold text-gray-700 mb-4">Consultation Pipeline</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Pending", count: stats.consultationBreakdown.pending, color: "bg-amber-400" },
            { label: "Scheduled", count: stats.consultationBreakdown.scheduled, color: "bg-blue-500" },
            { label: "Completed", count: stats.consultationBreakdown.completed, color: "bg-emerald-500" },
            { label: "Not Interested", count: stats.consultationBreakdown.not_interested, color: "bg-red-400" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-2`} />
              <div className="text-xl font-semibold text-gray-900">{item.count}</div>
              <div className="text-[11px] text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-table animate-fade-in">
        <div className="px-5 py-4 border-b border-black/5">
          <h2 className="text-[13px] font-semibold text-gray-700">Recent Calls</h2>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-black/5">
              {["Caller ID", "Name", "Duration", "Status", "Sentiment"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.recentCalls.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-[13px]">
                  No calls recorded yet. Calls will appear here once processed.
                </td>
              </tr>
            ) : (
              stats.recentCalls.map((call, i) => (
                <tr key={call.call_id} className={`border-b border-black/[0.04] hover:bg-black/[0.02] transition-colors ${i === stats.recentCalls.length - 1 ? "border-b-0" : ""}`}>
                  <td className="px-5 py-3.5 font-mono text-[12px] text-gray-600">{call.from_number || "—"}</td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{call.lead_name || <span className="text-gray-400">Unknown</span>}</td>
                  <td className="px-5 py-3.5 text-gray-600">{formatDuration(call.duration_seconds)}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${call.call_status === "ended" ? "bg-emerald-500" : "bg-amber-400"}`} />
                      <span className="text-gray-600 capitalize">{call.call_status}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5"><SentimentBadge sentiment={call.sentiment} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
