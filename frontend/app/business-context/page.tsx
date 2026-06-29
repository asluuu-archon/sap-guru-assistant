"use client";

import { useEffect, useState } from "react";

type BusinessContext = {
  id: number;
  title: string;
  context_text: string;
  status: string;
  priority: number;
  updated_at?: string;
};

export default function BusinessContextPage() {
  const [contexts, setContexts] = useState<BusinessContext[]>([]);
  const [title, setTitle] = useState("");
  const [contextText, setContextText] = useState("");
  const [priority, setPriority] = useState(1);
  const [saving, setSaving] = useState(false);

  async function loadContexts() {
    const res = await fetch("https://sap-guru-assistant.onrender.com/business-contexts", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.status === "success") {
      setContexts(data.contexts || []);
    }
  }

  useEffect(() => {
    loadContexts();
  }, []);

  async function saveContext() {
    if (!title.trim() || !contextText.trim()) {
      alert("Please enter title and context.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("https://sap-guru-assistant.onrender.com/business-contexts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          context_text: contextText,
          status: "active",
          priority,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        setTitle("");
        setContextText("");
        setPriority(1);
        await loadContexts();
      } else {
        alert(data.message || "Unable to save context.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0B1020] via-[#14102A] to-[#071A2F] p-8 shadow-2xl">
        <p className="mb-2 text-sm text-cyan-300">AI Command Center</p>
        <h1 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-400 bg-clip-text text-4xl font-bold text-transparent">
          Business Context
        </h1>
        <p className="mt-3 text-slate-400">
          Tell the AI what is currently happening in your business.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-[#0B1020] p-6 shadow-2xl xl:col-span-1">
          <h2 className="text-xl font-bold">Add Context</h2>
          <p className="mt-2 text-sm text-slate-400">
            Example: Today we are promoting SAP MM weekend batch. Offer valid till Friday.
          </p>

          <div className="mt-6 space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#111A2E] p-4 text-sm outline-none focus:border-cyan-400"
              placeholder="Title, e.g. SAP MM Weekend Offer"
            />

            <textarea
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              className="min-h-40 w-full resize-none rounded-xl border border-slate-700 bg-[#111A2E] p-4 text-sm outline-none focus:border-cyan-400"
              placeholder="Write the business context in natural language..."
            />

            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-700 bg-[#111A2E] p-4 text-sm outline-none focus:border-cyan-400"
              placeholder="Priority"
            />

            <button
              onClick={saveContext}
              disabled={saving}
              className="w-full rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Context"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0B1020] p-6 shadow-2xl xl:col-span-2">
          <h2 className="text-xl font-bold">Active Contexts</h2>
          <p className="mt-2 text-sm text-slate-400">
            These will be used by the AI while replying.
          </p>

          <div className="mt-6 space-y-4">
            {contexts.length === 0 && (
              <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-6 text-slate-400">
                No business context added yet.
              </div>
            )}

            {contexts.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-700 bg-[#111A2E] p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-cyan-300">{item.title}</h3>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    {item.status}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm text-slate-300">
                  {item.context_text}
                </p>

                <div className="mt-4 text-xs text-slate-500">
                  Priority: {item.priority}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}