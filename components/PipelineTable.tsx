interface LeadRecord {
  id: string;
  name?: string;
  email?: string;
  businessType?: string;
  aiObjective?: string;
  implementationType?: string;
}

export function PipelineTable({ leads }: { leads: LeadRecord[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
        <tr>
          <th className="px-4 py-3">Name</th>
          <th className="px-4 py-3">Email</th>
          <th className="px-4 py-3">Business Type</th>
          <th className="px-4 py-3">AI Objective</th>
          <th className="px-4 py-3">Implementation</th>
          <th className="px-4 py-3">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {leads.map((lead) => (
          <tr key={lead.id} className="transition-colors hover:bg-white/5">
            <td className="px-4 py-3 font-medium text-white">
              {lead.name || 'Unidentified'}
            </td>
            <td className="px-4 py-3 text-slate-300">
              {lead.email || '—'}
            </td>
            <td className="px-4 py-3 text-slate-300">
              {lead.businessType || '—'}
            </td>
            <td className="px-4 py-3 text-slate-300">
              {lead.aiObjective || '—'}
            </td>
            <td className="px-4 py-3 text-slate-300">
              {lead.implementationType || '—'}
            </td>
            <td className="px-4 py-3">
              <span className="inline-flex items-center rounded border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-400">
                Ready for The Architect
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
