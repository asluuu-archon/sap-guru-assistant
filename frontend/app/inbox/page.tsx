export default async function InboxPage() {
  const res = await fetch("https://sap-guru-assistant.onrender.com/dashboard-data", {
    cache: "no-store",
  });

  const data = await res.json();

  const conversations = [
    ...(data.needs_human || []),
    ...(data.lead_collection || []),
    ...(data.recent_conversations || []),
  ];

  const uniqueConversations = conversations.filter(
    (item: any, index: number, self: any[]) =>
      index === self.findIndex((x) => x.sender_id === item.sender_id)
  );

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0B1020] via-[#14102A] to-[#071A2F] p-8 shadow-2xl">
        <p className="mb-2 text-sm text-cyan-300">AI Command Center</p>
        <h1 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-400 bg-clip-text text-4xl font-bold text-transparent">
          Unified Inbox
        </h1>
        <p className="mt-3 text-slate-400">
          View conversations across Instagram now. WhatsApp and Facebook will join later.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-800 bg-[#0B1020] p-5 shadow-2xl xl:col-span-1">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Conversation Queue</h2>
              <p className="text-sm text-slate-400">
                {uniqueConversations.length} conversations
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {uniqueConversations.slice(0, 30).map((item: any) => (
              <ConversationCard key={item.sender_id} item={item} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0B1020] p-6 shadow-2xl xl:col-span-2">
          <h2 className="text-xl font-bold">Conversation Preview</h2>
          <p className="mt-2 text-slate-400">
            Next step: click a conversation and open full chat history here.
          </p>

          <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-[#111A2E] p-8 text-center text-slate-400">
            Select a conversation from the left to view messages, AI suggestion,
            lead details and reply actions.
          </div>
        </section>
      </div>
    </main>
  );
}

function ConversationCard({ item }: { item: any }) {
  const state = item.conversation_state || "new";
  const isHuman = item.needs_human === true || state === "needs_human";

  return (
    <div className="cursor-pointer rounded-xl border border-slate-700 bg-[#111A2E] p-4 transition hover:border-cyan-500 hover:bg-[#16213A]">
      <div className="flex items-center justify-between">
        <div className="font-bold text-cyan-300">
          User {item.sender_id}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs ${
            isHuman
              ? "border border-amber-400/30 bg-amber-500/10 text-amber-300"
              : "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {isHuman ? "Needs Human" : state}
        </span>
      </div>

      <div className="mt-3 text-sm text-slate-400">
        {item.summary || "No summary yet"}
      </div>

      <div className="mt-3 line-clamp-2 text-sm text-slate-300">
        Last Reply: {item.last_reply || "No reply sent"}
      </div>
    </div>
  );
}