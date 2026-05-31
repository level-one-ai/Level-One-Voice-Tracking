import { getDb } from "@/lib/firebase";
import { CallRecord } from "@/lib/types";

async function getDashboardStats() {
  try {
    const db = getDb();
    const snapshot = await db.collection("calls").get();
    const calls: CallRecord[] = snapshot.docs.map((doc) => doc.data() as CallRecord);
    const totalCalls = calls.length;
    const totalLeads = calls.filter((c) => c.lead_name?.trim()).length;
    const scores: Record<string,number> = { positive:1,Positive:1,neutral:0,Neutral:0,negative:-1,Negative:-1 };
    const scored = calls.filter((c) => scores[c.sentiment] !== undefined);
    const avg = scored.length > 0 ? scored.reduce((a,c) => a+(scores[c.sentiment]??0),0)/scored.length : 0;
    const avgSentimentLabel = avg > 0.2 ? "Positive" : avg < -0.2 ? "Negative" : "Neutral";
    const recentCalls = [...calls].sort((a,b) => new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,5);
    const consultationBreakdown = {
      pending: calls.filter((c) => c.consultation_status==="pending").length,
      scheduled: calls.filter((c) => c.consultation_status==="scheduled").length,
      completed: calls.filter((c) => c.consultation_status==="completed").length,
      not_interested: calls.filter((c) => c.consultation_status==="not_interested").length,
    };
    return { totalCalls, totalLeads, avgSentimentLabel, recentCalls, consultationBreakdown };
  } catch (err) {
    console.error("Dashboard error:", err);
    return { totalCalls:0, totalLeads:0, avgSentimentLabel:"N/A", recentCalls:[], consultationBreakdown:{pending:0,scheduled:0,completed:0,not_interested:0} };
  }
}

function fmt(s: number) { return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`; }

function Badge({ s }: { s: string }) {
  const l = s?.toLowerCase();
  const c = l==="positive"?"bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200":l==="negative"?"bg-red-50 text-red-700 ring-1 ring-red-200":"bg-gray-100 text-gray-600 ring-1 ring-gray-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${c}`}>{s||"Unknown"}</span>;
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const metrics = [
    { label:"Total Calls", value:stats.totalCalls.toString(), sub:"All time" },
    { label:"Leads Extracted", value:stats.totalLeads.toString(), sub:`${stats.totalCalls>0?Math.round((stats.totalLeads/stats.totalCalls)*100):0}% conversion` },
    { label:"Avg. Sentiment", value:stats.avgSentimentLabel, sub:"Across all calls" },
    { label:"Consultations Booked", value:stats.consultationBreakdown.scheduled.toString(), sub:`${stats.consultationBreakdown.completed} completed` },
  ];
  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8"><h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Overview</h1><p className="text-sm text-gray-500 mt-1">Real-time intelligence from your AI voice agent</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (<div key={m.label} className="glass-card p-5"><div className="text-3xl font-semibold text-gray-900 mb-0.5">{m.value}</div><div className="text-[13px] font-medium text-gray-600">{m.label}</div><div className="text-[11px] text-gray-400 mt-0.5">{m.sub}</div></div>))}
      </div>
      <div className="glass-card p-5 mb-6">
        <h2 className="text-[13px] font-semibold text-gray-700 mb-4">Consultation Pipeline</h2>
        <div className="grid grid-cols-4 gap-3">
          {[{label:"Pending",count:stats.consultationBreakdown.pending,color:"bg-amber-400"},{label:"Scheduled",count:stats.consultationBreakdown.scheduled,color:"bg-blue-500"},{label:"Completed",count:stats.consultationBreakdown.completed,color:"bg-emerald-500"},{label:"Not Interested",count:stats.consultationBreakdown.not_interested,color:"bg-red-400"}].map((item) => (
            <div key={item.label} className="text-center"><div className={`w-2 h-2 rounded-full ${item.color} mx-auto mb-2`}/><div className="text-xl font-semibold text-gray-900">{item.count}</div><div className="text-[11px] text-gray-500">{item.label}</div></div>
          ))}
        </div>
      </div>
      <div className="glass-table">
        <div className="px-5 py-4 border-b border-black/5"><h2 className="text-[13px] font-semibold text-gray-700">Recent Calls</h2></div>
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-black/5">{["Caller ID","Name","Duration","Status","Sentiment"].map((h)=>(<th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>))}</tr></thead>
          <tbody>
            {stats.recentCalls.length===0?(<tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No calls recorded yet.</td></tr>):(
              stats.recentCalls.map((call)=>(<tr key={call.call_id} className="border-b border-black/[0.04] hover:bg-black/[0.02]">
                <td className="px-5 py-3.5 font-mono text-[12px] text-gray-600">{call.from_number||"—"}</td>
                <td className="px-5 py-3.5 font-medium text-gray-700">{call.lead_name||<span className="text-gray-400">Unknown</span>}</td>
                <td className="px-5 py-3.5 text-gray-600">{fmt(call.duration_seconds)}</td>
                <td className="px-5 py-3.5"><span className="inline-flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${call.call_status==="ended"?"bg-emerald-500":"bg-amber-400"}`}/><span className="capitalize text-gray-600">{call.call_status}</span></span></td>
                <td className="px-5 py-3.5"><Badge s={call.sentiment}/></td>
              </tr>))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
