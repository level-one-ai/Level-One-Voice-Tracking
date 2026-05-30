'use client';

import { useState } from 'react';
import { Modal } from './Modal';

interface CallRecord {
  id: string;
  timestamp: string;
  from_number?: string;
  duration?: string | number;
  call_status?: string;
  sentiment?: string;
  transcript?: string;
}

export function CallsTable({ calls }: { calls: CallRecord[] }) {
  const [selected, setSelected] = useState<<CallRecord | null>(null);

  return (
    <>
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Caller ID</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Sentiment</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {calls.map((call) => (
            <tr
              key={call.id}
              className="transition-colors hover:bg-white/5"
            >
              <td className="px-4 py-3 text-slate-300">
                {call.timestamp
                  ? new Date(call.timestamp).toLocaleString('en-GB')
                  : '—'}
              </td>
              <td className="px-4 py-3 font-medium text-white">
                {call.from_number || 'Unknown'}
              </td>
              <td className="px-4 py-3 text-slate-300">
                {call.duration || '0s'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                    call.call_status === 'completed'
                      ? 'bg-orange-500/10 text-orange-400'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}
                >
                  {call.call_status || 'Unknown'}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-300">
                {call.sentiment || 'N/A'}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => setSelected(call)}
                  className="text-xs font-medium uppercase tracking-wider text-orange-500 transition-colors hover:text-orange-400"
                >
                  Transcript
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <Modal
          title={`Transcript — ${selected.from_number || 'Unknown'}`}
          onClose={() => setSelected(null)}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {selected.transcript || 'No transcript available.'}
          </div>
        </Modal>
      )}
    </>
  );
}
