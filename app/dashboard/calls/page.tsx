import { db } from '@/lib/firebase';
import { CallsTable } from '@/components/CallsTable';

async function getCalls() {
  const snapshot = await db
    .collection('calls')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp:
        data.createdAt?.toDate?.().toISOString() || data.timestamp || '',
    };
  });
}

export default async function CallsPage() {
  const calls = await getCalls();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Call Log</h2>
        <p className="mt-1 text-sm text-slate-500">
          Inbound and outbound call records.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 backdrop-blur-md">
        <CallsTable calls={calls} />
      </div>
    </div>
  );
}
