export default async function Home() {
  const res = await fetch("https://sap-guru-assistant.onrender.com/dashboard-data", {
    cache: "no-store",
  });

  const data = await res.json();
  const counts = data.counts || {};
  const needsHuman = data.needs_human || [];

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0B1020] via-[#14102A] to-[#071A2F] p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-2 text-sm text-cyan-300">AI Customer Engagement Platform</p>
            <h1 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-400 bg-clip-text text-4xl font-bold text-transparent">
              SAP Guru AI Control Center
            </h1>
            <p className="mt-3 text-slate-400">
              Monitor conversations, leads, AI replies and human review queue.
            </p>
          </div>

          <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            ● Live
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card title="Needs Human" value={counts.needs_human || 0} accent="from-fuchsia-500 to-violet-500" />
        <Card title="Lead Collection" value={counts.lead_collection || 0} accent="from-cyan-400 to-blue-500" />
        <Card title="Qualified Leads" value={counts.qualified_leads || 0} accent="from-emerald-400 to-teal-500" />
        <Card title="Recent Chats" value={counts.recent_conversations || 0} accent="from-amber-400 to-orange-500" />
        <Card title="Total Leads" value={counts.total_leads || 0} accent="from-purple-400 to-pink-500" />
        <Card title="Total Conversations" value={counts.total_conversations || 0} accent="from-sky-400 to-cyan-500" />
      </div>

      <section className="rounded-2xl border border-slate-800 bg-[#0B1020] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Needs Human Review</h2>
            <p className="mt-1 text-sm text-slate-400">
              Conversations where AI stayed silent for manual handling.
            </p>
          </div>

          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-300">
            {needsHuman.length} pending
          </span>
        </div>

        <div className="space-y-3">
          {needsHuman.slice(0, 10).map((item: any) => (
            <div
              key={item.sender_id}
              className="rounded-xl border border-slate-700 bg-[#111A2E] p-5 transition hover:border-violet-500 hover:bg-[#16213A]"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-cyan-300">
                  User {item.sender_id}
                </div>

                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                  {item.conversation_state || "needs_human"}
                </span>
              </div>

              <div className="mt-3 text-sm text-slate-400">
                ⚠ Reason: {item.human_reason || "Needs manual review"}
              </div>

              <div className="mt-2 text-sm text-slate-300">
                💬 Last Reply: {item.last_reply || "No reply sent"}
              </div>
            </div>
          ))}

          {needsHuman.length === 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-300">
              No conversations need human review.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Card({
  title,
  value,
  accent,
}: {
  title: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B1020] p-5 shadow-xl transition hover:-translate-y-1 hover:border-cyan-500/50">
      <div className={`mb-4 h-1 rounded-full bg-gradient-to-r ${accent}`} />
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-3 text-4xl font-bold">{value}</div>
    </div>
  );
}