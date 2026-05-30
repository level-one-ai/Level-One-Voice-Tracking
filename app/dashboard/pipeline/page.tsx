import { db } from '@/lib/firebase';
import { PipelineTable } from '@/components/PipelineTable';

async function getLeads() {
  const snapshot = await db
    .collection('calls')
    .where('email', '!=', '')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export default async function PipelinePage() {
  const leads = await getLeads();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Pipeline</h2>
        <p className="mt-1 text-sm text-slate-500">
          Qualified leads and implementation scope.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-md">
        <PipelineTable leads={leads} />
      </div>
    </div>
  );
}
