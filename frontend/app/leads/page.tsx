"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lead = {
  id: number;
  sender_id: string;
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  mode?: string;
  education?: string;
  experience?: string;
  interested_module?: string;
  notes?: string;
  source?: string;
  status?: string;
  lead_stage?: string;
  is_qualified?: boolean;
  qualified_at?: string;
  updated_at?: string;
  // enriched from customer profile
  customer_name?: string;
  instagram_username?: string;
  profile_pic?: string;
  customer_lead_score?: number;
  customer_lead_temperature?: string;
};

type FilterType = "all" | "qualified" | "new" | "phone_pending" | "name_pending";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDisplayName(lead: Lead): string {
  return lead.name || lead.customer_name || lead.instagram_username || `User ${lead.sender_id.slice(-6)}`;
}

function getTemperatureColor(temp?: string): string {
  switch ((temp || "").toLowerCase()) {
    case "hot":    return "border-red-400/30 bg-red-500/10 text-red-300";
    case "warm":   return "border-amber-400/30 bg-amber-500/10 text-amber-300";
    case "cold":   return "border-blue-400/30 bg-blue-500/10 text-blue-300";
    default:       return "border-slate-600/30 bg-slate-700/10 text-slate-400";
  }
}

function getStageColor(stage?: string): string {
  switch ((stage || "").toLowerCase()) {
    case "qualified":      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
    case "phone_pending":  return "border-amber-400/30 bg-amber-500/10 text-amber-300";
    case "name_pending":   return "border-violet-400/30 bg-violet-500/10 text-violet-300";
    case "email_pending":  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
    case "location_pending": return "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300";
    default:               return "border-slate-600/30 bg-slate-700/10 text-slate-400";
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All Leads",   value: "all" },
  { label: "Qualified",   value: "qualified" },
  { label: "New",         value: "new" },
  { label: "Phone Pending", value: "phone_pending" },
  { label: "Name Pending",  value: "name_pending" },
];

function applyFilter(leads: Lead[], filter: FilterType): Lead[] {
  switch (filter) {
    case "qualified":     return leads.filter((l) => l.is_qualified === true || l.status === "qualified");
    case "new":           return leads.filter((l) => l.status === "new" || !l.status);
    case "phone_pending": return leads.filter((l) => l.lead_stage === "phone_pending");
    case "name_pending":  return leads.filter((l) => l.lead_stage === "name_pending");
    default:              return leads;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads]               = useState<Lead[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<FilterType>("all");
  const [search, setSearch]             = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    async function loadLeads() {
      try {
        const res  = await fetch("/api/all-leads", { cache: "no-store" });
        const data = await res.json();
        if (data.status === "success") {
          setLeads(data.leads || []);
        }
      } catch (err) {
        console.error("Failed to load leads", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, []);

  const filtered = applyFilter(leads, filter).filter((lead) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      getDisplayName(lead).toLowerCase().includes(q) ||
      (lead.phone || "").includes(q) ||
      (lead.email || "").toLowerCase().includes(q) ||
      (lead.interested_module || "").toLowerCase().includes(q) ||
      (lead.location || "").toLowerCase().includes(q)
    );
  });

  // Stats
  const totalLeads     = leads.length;
  const qualifiedCount = leads.filter((l) => l.is_qualified).length;
  const hotCount       = leads.filter((l) => (l.customer_lead_temperature || "").toLowerCase() === "hot").length;
  const warmCount      = leads.filter((l) => (l.customer_lead_temperature || "").toLowerCase() === "warm").length;

  return (
    <main className="min-h-screen bg-[#050816] text-white">

      {/* ── Header ── */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0B1020] via-[#14102A] to-[#071A2F] p-8 shadow-2xl">
        <p className="mb-2 text-sm text-cyan-300">AI Command Center</p>
        <h1 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-400 bg-clip-text text-4xl font-bold text-transparent">
          Leads CRM
        </h1>
        <p className="mt-3 text-slate-400">
          All leads captured from Instagram conversations — filter, search and review.
        </p>
      </div>

      {/* ── Stats Row ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Leads"    value={totalLeads}     color="cyan" />
        <StatCard label="Qualified"      value={qualifiedCount} color="emerald" />
        <StatCard label="Hot Leads"      value={hotCount}       color="red" />
        <StatCard label="Warm Leads"     value={warmCount}      color="amber" />
      </div>

      {/* ── Filter + Search Bar ── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setSelectedLead(null); }}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              filter === f.value
                ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                : "border-slate-700 bg-[#0B1020] text-slate-400 hover:border-cyan-500 hover:text-white"
            }`}
          >
            {f.label}
            {f.value === "all" && (
              <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                {leads.length}
              </span>
            )}
          </button>
        ))}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, module, location..."
          className="ml-auto w-full rounded-xl border border-slate-700 bg-[#0B1020] px-4 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 md:w-80"
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Leads List ── */}
        <section className="rounded-2xl border border-slate-800 bg-[#0B1020] p-5 shadow-2xl xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Leads</h2>
            <span className="text-sm text-slate-400">
              {loading ? "Loading..." : `${filtered.length} shown`}
            </span>
          </div>

          {loading && (
            <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-6 text-center text-slate-400">
              Loading leads...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-[#111A2E] p-6 text-center text-slate-400">
              No leads found for this filter.
            </div>
          )}

          <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
            {filtered.map((lead) => (
              <button
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="w-full text-left"
              >
                <LeadCard lead={lead} active={selectedLead?.id === lead.id} />
              </button>
            ))}
          </div>
        </section>

        {/* ── Lead Detail Panel ── */}
        <section className="rounded-2xl border border-slate-800 bg-[#0B1020] p-6 shadow-2xl xl:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Lead Profile</h2>
            <p className="mt-1 text-sm text-slate-400">
              Full details, contact information and conversation notes.
            </p>
          </div>

          {!selectedLead && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-[#111A2E] p-10 text-center text-slate-400">
              Select a lead from the list to view their full profile.
            </div>
          )}

          {selectedLead && <LeadDetailPanel lead={selectedLead} />}
        </section>
      </div>
    </main>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, color,
}: {
  label: string; value: number; color: "cyan" | "emerald" | "red" | "amber";
}) {
  const colorMap = {
    cyan:    "border-cyan-400/20 bg-cyan-500/5 text-cyan-300",
    emerald: "border-emerald-400/20 bg-emerald-500/5 text-emerald-300",
    red:     "border-red-400/20 bg-red-500/5 text-red-300",
    amber:   "border-amber-400/20 bg-amber-500/5 text-amber-300",
  };

  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm opacity-80">{label}</div>
    </div>
  );
}

// ─── Lead Card (list item) ────────────────────────────────────────────────────

function LeadCard({ lead, active }: { lead: Lead; active: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        active
          ? "border-cyan-400 bg-[#16213A]"
          : "border-slate-700 bg-[#111A2E] hover:border-cyan-500 hover:bg-[#16213A]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="truncate font-bold text-cyan-300">{getDisplayName(lead)}</div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${getStageColor(lead.lead_stage)}`}>
          {lead.lead_stage || lead.status || "new"}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-sm text-slate-400">
        {lead.phone && <div>📞 {lead.phone}</div>}
        {lead.email && <div>✉️ {lead.email}</div>}
        {lead.interested_module && <div>📚 {lead.interested_module}</div>}
        {!lead.phone && !lead.email && !lead.interested_module && (
          <div className="italic">No contact details yet</div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {lead.customer_lead_temperature && (
          <span className={`rounded-full border px-2 py-0.5 text-xs ${getTemperatureColor(lead.customer_lead_temperature)}`}>
            {lead.customer_lead_temperature}
          </span>
        )}
        <span className="ml-auto text-xs text-slate-500">{formatDate(lead.updated_at)}</span>
      </div>
    </div>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

function LeadDetailPanel({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-5">

      {/* Identity Header */}
      <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-300">Lead Profile</p>
            <h2 className="mt-1 text-2xl font-bold">{getDisplayName(lead)}</h2>
            {lead.instagram_username && (
              <p className="mt-1 text-sm text-slate-400">@{lead.instagram_username}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">Sender ID: {lead.sender_id}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full border px-3 py-1 text-sm ${getStageColor(lead.lead_stage)}`}>
              {lead.lead_stage || "new"}
            </span>
            {lead.customer_lead_temperature && (
              <span className={`rounded-full border px-3 py-1 text-sm ${getTemperatureColor(lead.customer_lead_temperature)}`}>
                {lead.customer_lead_temperature}
              </span>
            )}
            {lead.is_qualified && (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                ✓ Qualified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-5">
        <h3 className="mb-4 font-bold text-slate-200">Contact Information</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetailRow label="Phone"    value={lead.phone} />
          <DetailRow label="Email"    value={lead.email} />
          <DetailRow label="Location" value={lead.location} />
          <DetailRow label="Source"   value={lead.source || "instagram_dm"} />
        </div>
      </div>

      {/* Course Interest */}
      <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-5">
        <h3 className="mb-4 font-bold text-slate-200">Course Interest</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetailRow label="Module"     value={lead.interested_module} />
          <DetailRow label="Mode"       value={lead.mode} />
          <DetailRow label="Education"  value={lead.education} />
          <DetailRow label="Experience" value={lead.experience} />
        </div>
      </div>

      {/* CRM Status */}
      <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-5">
        <h3 className="mb-4 font-bold text-slate-200">CRM Status</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <DetailRow label="Lead Stage"    value={lead.lead_stage} />
          <DetailRow label="Status"        value={lead.status} />
          <DetailRow label="Lead Score"    value={lead.customer_lead_score ? `${lead.customer_lead_score}%` : undefined} />
          <DetailRow label="Qualified At"  value={formatDate(lead.qualified_at)} />
          <DetailRow label="Last Updated"  value={formatDate(lead.updated_at)} />
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-5">
          <h3 className="mb-3 font-bold text-slate-200">Conversation Notes</h3>
          <p className="whitespace-pre-line text-sm text-slate-300">{lead.notes}</p>
        </div>
      )}

    </div>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-[#0B1020] p-3">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-sm text-slate-200">{value || <span className="italic text-slate-500">Not provided</span>}</div>
    </div>
  );
}
