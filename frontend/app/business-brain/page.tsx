"use client";

import { useEffect, useState } from "react";

const API_BASE = "https://sap-guru-assistant.onrender.com";

type BrainRule = {
  id: number;
  rule_name: string;
  category: string;
  trigger_keywords: string[];
  response_template: string;
  priority: number;
  is_active: boolean;
  notes: string;
  updated_at?: string;
};

const CATEGORY_OPTIONS = [
  { value: "business_rule", label: "Business Rule" },
  { value: "greeting", label: "Greeting" },
  { value: "lead_collection", label: "Lead Collection" },
  { value: "promotion", label: "Promotion / Offer" },
  { value: "faq", label: "FAQ" },
  { value: "escalation", label: "Escalation" },
];

const CATEGORY_COLORS: Record<string, string> = {
  business_rule: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
  greeting: "border-violet-400/30 bg-violet-500/10 text-violet-300",
  lead_collection: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  promotion: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  faq: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  escalation: "border-rose-400/30 bg-rose-500/10 text-rose-300",
};

const emptyForm = {
  rule_name: "",
  category: "business_rule",
  trigger_keywords_raw: "",
  response_template: "",
  priority: 10,
  notes: "",
};

export default function BusinessBrainPage() {
  const [rules, setRules] = useState<BrainRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/brain/rules`, { cache: "no-store" });
      const data = await res.json();
      if (data.status === "success") setRules(data.rules || []);
    } catch (e) {
      console.error("Failed to load rules", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(rule: BrainRule) {
    setForm({
      rule_name: rule.rule_name,
      category: rule.category,
      trigger_keywords_raw: rule.trigger_keywords.join(", "),
      response_template: rule.response_template,
      priority: rule.priority,
      notes: rule.notes || "",
    });
    setEditingId(rule.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveRule() {
    if (!form.rule_name.trim() || !form.response_template.trim()) {
      alert("Please fill in the Rule Name and the Reply.");
      return;
    }

    setSaving(true);
    try {
      const keywords = form.trigger_keywords_raw
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        rule_name: form.rule_name.trim(),
        category: form.category,
        trigger_keywords: keywords,
        response_template: form.response_template.trim(),
        priority: form.priority,
        notes: form.notes.trim(),
      };

      let res;
      if (editingId !== null) {
        res = await fetch(`${API_BASE}/brain/rules/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/brain/rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.status === "success") {
        cancelForm();
        await loadRules();
      } else {
        alert(data.message || "Could not save rule.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleRule(id: number) {
    setTogglingId(id);
    try {
      const res = await fetch(`${API_BASE}/brain/rules/${id}/toggle`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.status === "success") {
        setRules((prev) =>
          prev.map((r) => (r.id === id ? { ...r, is_active: data.is_active } : r))
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteRule(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/brain/rules/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status === "success") {
        setRules((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const filteredRules = rules.filter((r) => {
    if (filterCategory !== "all" && r.category !== filterCategory) return false;
    if (filterActive === "active" && !r.is_active) return false;
    if (filterActive === "inactive" && r.is_active) return false;
    return true;
  });

  const activeCount = rules.filter((r) => r.is_active).length;
  const inactiveCount = rules.filter((r) => !r.is_active).length;

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      {/* Header */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0B1020] via-[#14102A] to-[#071A2F] p-8 shadow-2xl">
        <p className="mb-2 text-sm text-cyan-300">AI Command Center</p>
        <h1 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-400 bg-clip-text text-4xl font-bold text-transparent">
          Business Brain
        </h1>
        <p className="mt-3 text-slate-400">
          Brief your AI like a new employee. Tell it what to say, when to say it, and how to handle different situations.
        </p>

        {/* Stats row */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="rounded-xl border border-slate-700 bg-[#0B1020] px-5 py-3">
            <p className="text-xs text-slate-400">Total Rules</p>
            <p className="text-2xl font-bold text-white">{rules.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-5 py-3">
            <p className="text-xs text-emerald-400">Active</p>
            <p className="text-2xl font-bold text-emerald-300">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-slate-600/20 bg-slate-500/5 px-5 py-3">
            <p className="text-xs text-slate-400">Inactive</p>
            <p className="text-2xl font-bold text-slate-400">{inactiveCount}</p>
          </div>
          <div className="ml-auto flex items-center">
            <button
              onClick={openAddForm}
              className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              + Add New Rule
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-cyan-400/30 bg-[#0B1020] p-6 shadow-2xl">
          <h2 className="mb-1 text-xl font-bold text-cyan-300">
            {editingId !== null ? "Edit Rule" : "Add New Rule"}
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            Write in plain language — like briefing a new employee on how to handle this situation.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Rule Name */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Rule Name
              </label>
              <input
                value={form.rule_name}
                onChange={(e) => setForm({ ...form, rule_name: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-[#111A2E] p-4 text-sm outline-none focus:border-cyan-400"
                placeholder="e.g. SAP MM Weekend Batch Offer"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-[#111A2E] p-4 text-sm outline-none focus:border-cyan-400"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Priority (higher = matched first)
              </label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-700 bg-[#111A2E] p-4 text-sm outline-none focus:border-cyan-400"
                placeholder="10"
                min={1}
                max={100}
              />
            </div>

            {/* Trigger Keywords */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Trigger Keywords
              </label>
              <input
                value={form.trigger_keywords_raw}
                onChange={(e) => setForm({ ...form, trigger_keywords_raw: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-[#111A2E] p-4 text-sm outline-none focus:border-cyan-400"
                placeholder="e.g. mm, sap mm, material management, weekend batch  (separate with commas)"
              />
              <p className="mt-1 text-xs text-slate-500">
                Separate keywords with commas. When a customer message contains any of these words, this rule will activate.
              </p>
            </div>

            {/* Reply */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                What should the AI reply?
              </label>
              <textarea
                value={form.response_template}
                onChange={(e) => setForm({ ...form, response_template: e.target.value })}
                className="min-h-32 w-full resize-none rounded-xl border border-slate-700 bg-[#111A2E] p-4 text-sm outline-none focus:border-cyan-400"
                placeholder="e.g. SAP MM is a great module! We have a weekend batch starting this Saturday. Please share your name, contact number, and location — my office will call you with details."
              />
            </div>

            {/* Internal Notes */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Internal Notes (not shown to customers)
              </label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-[#111A2E] p-4 text-sm outline-none focus:border-cyan-400"
                placeholder="e.g. Valid until 31 July. Offer price: ₹15,000."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={saveRule}
              disabled={saving}
              className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId !== null ? "Update Rule" : "Save Rule"}
            </button>
            <button
              onClick={cancelForm}
              className="rounded-xl border border-slate-700 px-6 py-3 text-sm text-slate-400 transition hover:border-slate-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-400">Filter:</span>
        <div className="flex gap-2">
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterActive(f)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition ${
                filterActive === f
                  ? "bg-cyan-500 text-slate-950"
                  : "border border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterCategory("all")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              filterCategory === "all"
                ? "bg-violet-500 text-white"
                : "border border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            All Categories
          </button>
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterCategory(opt.value)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                filterCategory === opt.value
                  ? "bg-violet-500 text-white"
                  : "border border-slate-700 text-slate-400 hover:border-slate-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0B1020] p-12 text-center text-slate-400">
          Loading rules...
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0B1020] p-12 text-center">
          <p className="text-slate-400">No rules found.</p>
          <button
            onClick={openAddForm}
            className="mt-4 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Add Your First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`rounded-2xl border p-6 shadow-lg transition ${
                rule.is_active
                  ? "border-slate-700 bg-[#0B1020]"
                  : "border-slate-800 bg-[#080E1A] opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left: Rule info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-bold text-white text-lg">{rule.rule_name}</h3>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${
                        CATEGORY_COLORS[rule.category] || CATEGORY_COLORS.business_rule
                      }`}
                    >
                      {CATEGORY_OPTIONS.find((o) => o.value === rule.category)?.label || rule.category}
                    </span>
                    <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                      Priority: {rule.priority}
                    </span>
                  </div>

                  {/* Keywords */}
                  {rule.trigger_keywords && rule.trigger_keywords.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="text-xs text-slate-500">Triggers on:</span>
                      {rule.trigger_keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reply */}
                  <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-4">
                    <p className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">AI Reply</p>
                    <p className="text-sm text-slate-200 whitespace-pre-line">{rule.response_template}</p>
                  </div>

                  {/* Notes */}
                  {rule.notes && (
                    <p className="mt-3 text-xs text-slate-500 italic">
                      Note: {rule.notes}
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col items-end gap-3">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    disabled={togglingId === rule.id}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      rule.is_active ? "bg-cyan-500" : "bg-slate-700"
                    } ${togglingId === rule.id ? "opacity-50" : ""}`}
                    title={rule.is_active ? "Click to deactivate" : "Click to activate"}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        rule.is_active ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-slate-500">
                    {rule.is_active ? "Active" : "Inactive"}
                  </span>

                  {/* Edit / Delete */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(rule)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-400 hover:text-cyan-300"
                    >
                      Edit
                    </button>
                    {confirmDeleteId === rule.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteRule(rule.id)}
                          disabled={deletingId === rule.id}
                          className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-400 disabled:opacity-50"
                        >
                          {deletingId === rule.id ? "Deleting..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(rule.id)}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-rose-400 hover:text-rose-300"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
