import { db } from '@/lib/firebase';
import { MetricCard } from '@/components/MetricCard';

async function getMetrics() {
  const snapshot = await db.collection('calls').get();

  let totalCalls = 0;
  let totalLeads = 0;
  let sentimentSum = 0;
  let sentimentCount = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    totalCalls++;

    if (data.email || data.name) {
      totalLeads++;
    }

    const s = parseFloat(data.sentiment);
    if (!isNaN(s)) {
      sentimentSum += s;
      sentimentCount++;
    }
  });

  return {
    totalCalls,
    totalLeads,
    avgSentiment: sentimentCount ? (sentimentSum / sentimentCount).toFixed(2) : '0.00',
  };
}

export default async function DashboardPage() {
  const metrics = await getMetrics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          System performance and call metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Total Calls" value={metrics.totalCalls} />
        <MetricCard label="Total Leads" value={metrics.totalLeads} />
        <MetricCard label="Average Sentiment" value={metrics.avgSentiment} />
      </div>
    </div>
  );
}
