'use client';

import { useState, useEffect } from 'react';

export default function ControlPage() {
  const [prompt, setPrompt] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/get-prompt')
      .then((res) => res.json())
      .then((data) => {
        if (data.prompt) setPrompt(data.prompt);
      })
      .catch(() => setMessage('Unable to load current prompt.'));
  }, []);

  const handleUpdate = async () => {
    if (!prompt || !authToken) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/update-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ new_script: prompt }),
      });

      if (res.ok) {
        setMessage('System prompt updated.');
      } else {
        setMessage('Update failed. Check authorization.');
      }
    } catch {
      setMessage('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Control Room</h2>
        <p className="mt-1 text-sm text-slate-500">
          Modify agent behaviour and system parameters.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Authorization Token
          </label>
          <input
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#0a0a0a] p-3 text-sm text-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="Enter bearer token..."
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Current Retell System Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={14}
            className="w-full rounded-md border border-white/10 bg-[#0a0a0a] p-4 font-mono text-sm leading-relaxed text-slate-200 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="System prompt will load here..."
          />
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.includes('updated') ? 'text-orange-400' : 'text-red-400'
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={handleUpdate}
          disabled={loading || !prompt || !authToken}
          className="rounded-md bg-orange-500 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Update System Prompt'}
        </button>
      </div>
    </div>
  );
}
