"use client";

import { useEffect, useState } from "react";

type ConversationItem = {
  sender_id: string;
  summary?: string;
  last_reply?: string;
  conversation_state?: string;
  needs_human?: boolean;
  human_reason?: string;
};

type ConversationHistoryItem = {
  time?: string;
  user?: string;
  assistant?: string;
  category?: string;
};

type ConversationDetail = {
  sender_id: string;
  summary?: string;
  last_question?: string;
  last_reply?: string;
  history?: ConversationHistoryItem[];
  conversation_state?: string;
  needs_human?: boolean;
  human_reason?: string;

  customer_name?: string;
  interested_module?: string;
  experience?: string;
  location?: string;
  learning_mode?: string;
  lead_score?: number;
  ai_confidence?: number;
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>("");
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await fetch("/api/dashboard-data", { cache: "no-store" });
        const data = await res.json();

        const merged = [
          ...(data.needs_human || []),
          ...(data.lead_collection || []),
          ...(data.recent_conversations || []),
        ];

        const unique = merged.filter(
          (item: ConversationItem, index: number, self: ConversationItem[]) =>
            index === self.findIndex((x) => x.sender_id === item.sender_id)
        );

        setConversations(unique);
      } catch (error) {
        console.error("Failed to load inbox data", error);
      } finally {
        setLoadingList(false);
      }
    }

    loadDashboardData();
  }, []);

  async function openConversation(senderId: string) {
    setSelectedSenderId(senderId);
    setLoadingConversation(true);
    setSelectedConversation(null);

    try {
      const res = await fetch(`/api/conversation/${senderId}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.status === "success") {
        setSelectedConversation(data.conversation);
      }
    } catch (error) {
      console.error("Failed to load conversation", error);
    } finally {
      setLoadingConversation(false);
    }
  }

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
          <div className="mb-5">
            <h2 className="text-lg font-bold">Conversation Queue</h2>
            <p className="text-sm text-slate-400">
              {loadingList ? "Loading conversations..." : `${conversations.length} conversations`}
            </p>
          </div>

          <div className="max-h-[720px] space-y-3 overflow-y-auto pr-2">
            {conversations.slice(0, 50).map((item) => (
              <button
                key={item.sender_id}
                onClick={() => openConversation(item.sender_id)}
                className="w-full text-left"
              >
                <ConversationCard
                  item={item}
                  active={selectedSenderId === item.sender_id}
                />
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0B1020] p-6 shadow-2xl xl:col-span-2">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Conversation Preview</h2>
              <p className="mt-2 text-slate-400">
                Full chat history, customer intelligence and reply actions.
              </p>
            </div>

            {selectedConversation && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
                {selectedConversation.conversation_state || "active"}
              </span>
            )}
          </div>

          {!selectedSenderId && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-700 bg-[#111A2E] p-8 text-center text-slate-400">
              Select a conversation from the left.
            </div>
          )}

          {loadingConversation && (
            <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-6 text-slate-400">
              Loading conversation...
            </div>
          )}

          {selectedConversation && !loadingConversation && (
            <ConversationDetailPanel conversation={selectedConversation} />
          )}
        </section>
      </div>
    </main>
  );
}

function ConversationCard({
  item,
  active,
}: {
  item: ConversationItem;
  active: boolean;
}) {
  const state = item.conversation_state || "new";
  const isHuman = item.needs_human === true || state === "needs_human";

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        active
          ? "border-cyan-400 bg-[#16213A]"
          : "border-slate-700 bg-[#111A2E] hover:border-cyan-500 hover:bg-[#16213A]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-bold text-cyan-300">User {item.sender_id}</div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs ${
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

function ConversationDetailPanel({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  const history = conversation.history || [];

  return (
    <div className="space-y-6">
      <CustomerIntelligence conversation={conversation} />

      <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-5">
        <h3 className="mb-4 font-bold">Chat History</h3>

        {history.length === 0 && (
          <p className="text-slate-400">No chat history found.</p>
        )}

        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={`${item.time}-${index}`} className="space-y-3">
              {item.user && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl rounded-bl-sm border border-slate-700 bg-slate-800 px-4 py-3">
                    <div className="mb-1 text-xs text-slate-400">User</div>
                    <div className="text-sm text-white">{item.user}</div>
                  </div>
                </div>
              )}

              {item.assistant && (
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-br-sm border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
                    <div className="mb-1 text-xs text-cyan-300">AI / Manual</div>
                    <div className="text-sm text-white">{item.assistant}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ReplyBox />
    </div>
  );
}

function CustomerIntelligence({
  conversation,
}: {
  conversation: ConversationDetail;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-300">
            Customer Intelligence
          </p>

          <h2 className="mt-1 text-2xl font-bold">
            {conversation.customer_name || "Unknown Customer"}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Instagram Conversation · {conversation.sender_id}
          </p>
        </div>

        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          Warm Lead
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoCard title="Module" value={conversation.interested_module || "-"} />
        <InfoCard title="Experience" value={conversation.experience || "-"} />
        <InfoCard title="Location" value={conversation.location || "-"} />
        <InfoCard title="Learning Mode" value={conversation.learning_mode || "-"} />
        <InfoCard title="Lead Score" value={`${conversation.lead_score ?? 0}%`} />
        <InfoCard title="AI Confidence" value={`${conversation.ai_confidence ?? 0}%`} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-700 bg-[#0B1020] p-4">
        <div className="text-xs uppercase tracking-wider text-slate-400">
          AI Brief
        </div>
        <div className="mt-2 text-sm text-slate-200">
          {conversation.summary ||
            "AI brief will be generated from the conversation history in a future step."}
        </div>
      </div>

      {conversation.human_reason && (
        <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          Human Review Reason: {conversation.human_reason}
        </div>
      )}
    </div>
  );
}

function ReplyBox() {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#111A2E] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">Reply</h3>
        <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
          Manual Reply
        </span>
      </div>

      <textarea
        className="min-h-28 w-full resize-none rounded-xl border border-slate-700 bg-[#0B1020] p-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
        placeholder="Type your reply here..."
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button className="rounded-xl bg-cyan-500 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">
          Send Reply
        </button>

        <button className="rounded-xl border border-slate-700 px-5 py-2 text-sm text-slate-300 transition hover:border-violet-400 hover:text-white">
          Mark Closed
        </button>

        <button className="rounded-xl border border-slate-700 px-5 py-2 text-sm text-slate-300 transition hover:border-amber-400 hover:text-white">
          Keep Human
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Sending will be connected in the next step.
      </p>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#0B1020] p-4">
      <div className="text-xs uppercase tracking-wider text-slate-400">
        {title}
      </div>

      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}