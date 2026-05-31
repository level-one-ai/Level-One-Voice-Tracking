"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RetellVoice {
  voice_id: string;
  voice_name: string;
  provider: string;
  gender: string;
  accent: string;
  age: string;
  preview_audio_url: string;
}

const MODELS = [
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini — Fast & Smart (Recommended)" },
  { id: "gpt-4.1", label: "GPT-4.1 — Most Capable" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano — Fastest & Cheapest" },
  { id: "gpt-4o", label: "GPT-4o — Highly Capable" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini — Balanced" },
];

const LANGUAGES = [
  { id: "en-GB", label: "English (UK)" },
  { id: "en-US", label: "English (US)" },
  { id: "en-AU", label: "English (AU)" },
  { id: "fr-FR", label: "French" },
  { id: "de-DE", label: "German" },
  { id: "es-ES", label: "Spanish" },
  { id: "it-IT", label: "Italian" },
  { id: "pt-PT", label: "Portuguese" },
];

const DEFAULT_PROMPT = `You are an AI voice assistant working for Level One, a company that helps businesses implement AI automation. Your name is Aria.

Your primary goal is to qualify inbound callers and collect their information for The Architect.

Follow this conversation flow:
1. Greet the caller warmly and introduce yourself as Aria from Level One
2. Ask for their name and how they heard about us
3. Ask what type of business they run
4. Ask what they are looking to achieve with AI automation
5. Ask how quickly they are looking to implement AI in their business
6. Ask for their email address so The Architect can follow up
7. Let them know that The Architect will be in touch shortly
8. Thank them and close the call professionally

Key rules:
- Keep responses concise — this is a voice call, never more than 2-3 sentences at a time
- If they ask pricing, say "The Architect will go through all of that with you personally"
- Always sound warm, professional, and confident
- Collect: Name, Email, Business Type, AI Objective, and Implementation Timeline`;

export default function CreateAgentPage() {
  const router = useRouter();

  // Voices
  const [voices, setVoices] = useState<RetellVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [voicesError, setVoicesError] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Form
  const [form, setForm] = useState({
    agent_name: "",
    voice_id: "",
    language: "en-GB",
    model: "gpt-4.1-mini",
    begin_message: "Hello! Thanks for calling Level One. I'm Aria, how can I help you today?",
    system_prompt: DEFAULT_PROMPT,
    use_existing_llm: false,
    llm_id: "",
    auto_connect_webhook: true,
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ agent_id: string; llm_id: string; agent_name: string } | null>(null);

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  // Load voices from Retell API
  useEffect(() => {
    (async () => {
      setVoicesLoading(true);
      try {
        const res = await fetch("/api/voices");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setVoices(data.voices ?? []);
        if (data.voices?.length > 0 && !form.voice_id) {
          set("voice_id", data.voices[0].voice_id);
        }
      } catch {
        setVoicesError(true);
      } finally {
        setVoicesLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewVoice = (v: RetellVoice) => {
    if (!v.preview_audio_url) return;
    if (audio) { audio.pause(); audio.currentTime = 0; }
    if (playingId === v.voice_id) { setPlayingId(null); return; }
    const a = new Audio(v.preview_audio_url);
    a.play();
    a.onended = () => setPlayingId(null);
    setAudio(a);
    setPlayingId(v.voice_id);
  };

  const filteredVoices = voices.filter((v) => {
    const q = voiceSearch.toLowerCase();
    return !q || v.voice_name?.toLowerCase().includes(q) || v.accent?.toLowerCase().includes(q) || v.gender?.toLowerCase().includes(q) || v.provider?.toLowerCase().includes(q);
  });

  const selectedVoice = voices.find((v) => v.voice_id === form.voice_id);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const validateStep = () => {
    if (step === 1) {
      if (!form.agent_name.trim()) { setError("Agent name is required."); return false; }
      if (!form.voice_id) { setError("Please select a voice."); return false; }
    }
    if (step === 2) {
      if (form.use_existing_llm && !form.llm_id.trim()) { setError("LLM ID is required."); return false; }
      if (!form.use_existing_llm && !form.system_prompt.trim()) { setError("System prompt is required."); return false; }
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((s) => (s < 3 ? (s + 1) as 1|2|3 : s));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: form.agent_name.trim(),
          voice_id: form.voice_id,
          language: form.language,
          model: form.model,
          begin_message: form.begin_message.trim(),
          llm_id: form.use_existing_llm ? form.llm_id.trim() : "",
          system_prompt: !form.use_existing_llm ? form.system_prompt.trim() : "",
          webhook_url: form.auto_connect_webhook ? `${baseUrl}/api/webhooks/retell` : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create agent");
      setCreated({ agent_id: data.agent_id, llm_id: data.llm_id, agent_name: form.agent_name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="glass-card p-8 text-center animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Agent Created!</h2>
          <p className="text-[13px] text-gray-500 mb-6"><span className="font-medium text-gray-700">{created.agent_name}</span> is now live in your Retell account.</p>

          <div className="bg-gray-50 rounded-xl p-5 text-left mb-5 space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Agent ID</p>
              <p className="font-mono text-[13px] text-gray-800 bg-white border border-black/6 rounded-lg px-3 py-2 select-all">{created.agent_id}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">LLM ID</p>
              <p className="font-mono text-[13px] text-gray-800 bg-white border border-black/6 rounded-lg px-3 py-2 select-all">{created.llm_id}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200/80 mb-6 text-left">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-[12px] text-amber-700">
              <span className="font-semibold">Save these IDs.</span> Go to Vercel → your project → Settings → Environment Variables and update <code className="bg-amber-100 px-1 rounded">RETELL_AGENT_ID</code> and <code className="bg-amber-100 px-1 rounded">RETELL_LLM_ID</code>, then redeploy.
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={() => { setCreated(null); setStep(1); setForm((p) => ({ ...p, agent_name: "", voice_id: voices[0]?.voice_id ?? "", system_prompt: DEFAULT_PROMPT })); }}
              className="px-4 py-2 rounded-xl text-[13px] font-medium bg-white border border-black/8 text-gray-700 hover:bg-gray-50 transition-colors">
              Create Another
            </button>
            <button onClick={() => router.push("/dashboard/agents")}
              className="px-4 py-2 rounded-xl text-[13px] font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors">
              View Agent Manager →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step indicator ──────────────────────────────────────────────────────────
  const steps = ["Identity & Voice", "Intelligence", "Review & Deploy"];

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <button onClick={() => router.push("/dashboard/agents")}
        className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to Agent Manager
      </button>

      {/* Header */}
      <div className="mb-6 animate-slide-up">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Create Voice Agent</h1>
        <p className="text-sm text-gray-500 mt-1">Build and deploy a new AI voice agent directly to Retell</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-0 mb-7 animate-fade-in">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 ${i + 1 <= step ? "cursor-pointer" : "cursor-default"}`}
              onClick={() => { if (i + 1 < step) setStep((i + 1) as 1|2|3); }}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all
                ${step === i + 1 ? "bg-orange-500 text-white shadow-md" : step > i + 1 ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                {step > i + 1
                  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : i + 1}
              </div>
              <span className={`text-[12px] font-medium hidden sm:block ${step === i + 1 ? "text-gray-900" : step > i + 1 ? "text-emerald-600" : "text-gray-400"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`h-px flex-1 mx-3 ${step > i + 1 ? "bg-emerald-300" : "bg-gray-200"}`}/>}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Identity & Voice ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4 animate-slide-up">
          {/* Agent name */}
          <div className="glass-card p-5">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Agent Name *</label>
            <input type="text" value={form.agent_name} onChange={(e) => set("agent_name", e.target.value)}
              placeholder="e.g. Level One Qualifier"
              className="w-full px-4 py-2.5 text-[13px] bg-gray-50 border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder-gray-400" />
          </div>

          {/* Language */}
          <div className="glass-card p-5">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Language</label>
            <select value={form.language} onChange={(e) => set("language", e.target.value)}
              className="w-full px-4 py-2.5 text-[13px] bg-gray-50 border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all">
              {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>

          {/* Voice picker */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Voice *</label>
              {selectedVoice && (
                <span className="text-[11px] text-gray-500">
                  Selected: <span className="font-medium text-gray-700">{selectedVoice.voice_name}</span>
                  {selectedVoice.accent ? ` · ${selectedVoice.accent}` : ""}
                  {selectedVoice.gender ? ` · ${selectedVoice.gender}` : ""}
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Search voices by name, accent, gender..."
                value={voiceSearch} onChange={(e) => setVoiceSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-[12px] bg-gray-50 border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder-gray-400" />
            </div>

            {voicesLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400 text-[13px] gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"/>
                Loading voices from Retell...
              </div>
            ) : voicesError ? (
              <div className="py-4 text-center text-[13px] text-red-500">
                Could not load voices. Make sure RETELL_API_KEY is set in Vercel.
              </div>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {filteredVoices.length === 0 ? (
                  <div className="py-4 text-center text-[13px] text-gray-400">No voices match your search.</div>
                ) : filteredVoices.map((v) => (
                  <div key={v.voice_id}
                    onClick={() => set("voice_id", v.voice_id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all
                      ${form.voice_id === v.voice_id
                        ? "bg-orange-50 ring-1 ring-orange-300"
                        : "hover:bg-gray-50 ring-1 ring-transparent"}`}>
                    <div className="flex items-center gap-3">
                      {/* Radio dot */}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${form.voice_id === v.voice_id ? "border-orange-500" : "border-gray-300"}`}>
                        {form.voice_id === v.voice_id && <div className="w-2 h-2 rounded-full bg-orange-500"/>}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-gray-800">{v.voice_name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {[v.provider, v.accent, v.gender, v.age].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                    {/* Preview button */}
                    {v.preview_audio_url && (
                      <button
                        onClick={(e) => { e.stopPropagation(); previewVoice(v); }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex-shrink-0
                          ${playingId === v.voice_id
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {playingId === v.voice_id
                          ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Stop</>
                          : <><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>Preview</>}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Intelligence ─────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4 animate-slide-up">
          {/* LLM toggle */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">LLM Source</div>
                <div className="text-[12px] text-gray-500 mt-0.5">Create a new LLM from your prompt, or connect an existing one</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-gray-500">{form.use_existing_llm ? "Existing LLM ID" : "New LLM"}</span>
                <button onClick={() => set("use_existing_llm", !form.use_existing_llm)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.use_existing_llm ? "bg-orange-500" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.use_existing_llm ? "translate-x-5" : "translate-x-0.5"}`}/>
                </button>
              </div>
            </div>
          </div>

          {form.use_existing_llm ? (
            <div className="glass-card p-5">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Existing LLM ID *</label>
              <input type="text" value={form.llm_id} onChange={(e) => set("llm_id", e.target.value)}
                placeholder="e.g. llm_234sdertfsdsfsdf"
                className="w-full px-4 py-2.5 text-[13px] font-mono bg-gray-50 border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder-gray-400" />
              <p className="text-[11px] text-gray-400 mt-2">Find this in your Retell dashboard under your existing agent&apos;s settings.</p>
            </div>
          ) : (
            <>
              {/* Model picker */}
              <div className="glass-card p-5">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Underlying AI Model</label>
                <select value={form.model} onChange={(e) => set("model", e.target.value)}
                  className="w-full px-4 py-2.5 text-[13px] bg-gray-50 border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all">
                  {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>

              {/* Opening message */}
              <div className="glass-card p-5">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Opening Message</label>
                <input type="text" value={form.begin_message} onChange={(e) => set("begin_message", e.target.value)}
                  placeholder="What the agent says when the call connects..."
                  className="w-full px-4 py-2.5 text-[13px] bg-gray-50 border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder-gray-400" />
                <p className="text-[11px] text-gray-400 mt-1.5">This is the first thing your agent says when a call connects.</p>
              </div>

              {/* System prompt */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">System Prompt *</label>
                  <span className="text-[11px] text-gray-400">{form.system_prompt.trim().split(/\s+/).length} words</span>
                </div>
                <textarea value={form.system_prompt} onChange={(e) => set("system_prompt", e.target.value)}
                  rows={14}
                  className="w-full px-4 py-3 text-[13px] font-mono bg-gray-50 border border-black/8 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all resize-none leading-relaxed" />
                <p className="text-[11px] text-gray-400 mt-1.5">This defines your agent&apos;s personality, goals, and conversation flow. The example prompt above is a good starting point for a sales qualifier.</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── STEP 3: Review & Deploy ──────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4 animate-slide-up">
          <div className="glass-card p-5">
            <h3 className="text-[13px] font-semibold text-gray-700 mb-4">Review Configuration</h3>
            <div className="space-y-3">
              {[
                { label: "Agent Name", value: form.agent_name },
                { label: "Voice", value: selectedVoice ? `${selectedVoice.voice_name} · ${selectedVoice.accent ?? ""} · ${selectedVoice.gender ?? ""}`.replace(/· ·/, "·").replace(/· $/, "") : form.voice_id },
                { label: "Language", value: LANGUAGES.find((l) => l.id === form.language)?.label ?? form.language },
                { label: "LLM", value: form.use_existing_llm ? `Existing: ${form.llm_id}` : `New LLM · ${MODELS.find((m) => m.id === form.model)?.label}` },
                { label: "Opening Message", value: form.begin_message || "Dynamic (AI generated)" },
                { label: "Dashboard Webhook", value: form.auto_connect_webhook ? "Auto-connected ✓" : "Not connected" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 py-2.5 border-b border-black/[0.04] last:border-b-0">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-32 flex-shrink-0 mt-0.5">{item.label}</span>
                  <span className="text-[13px] text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook toggle in review */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-semibold text-gray-700">Auto-connect to This Dashboard</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Wire the webhook so call data flows into your CRM pipeline immediately</div>
              </div>
              <button onClick={() => set("auto_connect_webhook", !form.auto_connect_webhook)}
                className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.auto_connect_webhook ? "bg-orange-500" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.auto_connect_webhook ? "translate-x-5" : "translate-x-0.5"}`}/>
              </button>
            </div>
            {form.auto_connect_webhook && (
              <div className="mt-2.5 px-3 py-2 bg-gray-50 rounded-lg">
                <p className="text-[11px] text-gray-500 font-mono">{baseUrl}/api/webhooks/retell</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mt-4 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => step > 1 ? setStep((s) => (s - 1) as 1|2|3) : router.push("/dashboard/agents")}
          className="px-5 py-2.5 rounded-xl text-[13px] font-medium bg-white border border-black/8 text-gray-700 hover:bg-gray-50 transition-colors">
          {step === 1 ? "Cancel" : "← Back"}
        </button>

        {step < 3 ? (
          <button onClick={nextStep}
            className="px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-orange-500 text-white hover:bg-orange-600 shadow-sm transition-all">
            Continue →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all
              ${loading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600 shadow-sm hover:shadow-md"}`}>
            {loading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>}
            {loading ? "Creating in Retell..." : "🚀 Deploy Agent"}
          </button>
        )}
      </div>
    </div>
  );
}
