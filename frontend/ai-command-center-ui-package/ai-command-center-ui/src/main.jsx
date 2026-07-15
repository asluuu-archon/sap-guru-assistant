import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, HelpCircle, Search, Settings, LayoutDashboard, MessagesSquare, Users, Bug, Bot, Brain, UserRound, BarChart3, Workflow, Plus, Download, Filter, Play, X, Phone, MapPin, BookOpen, Star, Clock, ChevronRight, ToggleLeft, ToggleRight, Pencil, Trash2, Tag, Zap, Save, AlertTriangle, Building2, Globe, CheckCircle, Plug, Wifi, WifiOff, RefreshCw, ExternalLink, Key, Link, Send, Radio, Image, Video, FileText, Calendar, CheckSquare, XCircle, Loader, MessageSquare, ThumbsUp, ThumbsDown, Flame, Mail } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import './styles.css';

const API_BASE = "https://sap-guru-assistant.onrender.com";

const nav = [
  ['Overview', LayoutDashboard], ['Conversations', MessagesSquare], ['Leads', Users], ['Hot Lead Queue', Flame], ['Import & Export', Download], ['Pipeline Debugger', Bug],
  ['AI Playground', Bot], ['Business Brain', Brain], ['Appointments', Calendar], ['Customer 360°', UserRound], ['Reports', BarChart3], ['Automation', Workflow], ['Publisher', Radio], ['Google Reviews', Star], ['Businesses', Building2], ['Integrations', Plug], ['Settings', Settings]
];

const colors = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6'];

const conversationData = [
  {day:'May 22', total:160, ai:85},{day:'May 23', total:220, ai:110},{day:'May 24', total:210, ai:130},{day:'May 25', total:270, ai:120},{day:'May 26', total:250, ai:90},{day:'May 27', total:285, ai:155},{day:'May 28', total:305, ai:145}
];

const intents = [
  {name:'Training Enquiry', value:42},
  {name:'Job Enquiry', value:18},
  {name:'General', value:15},
  {name:'Service Enquiry', value:12},
  {name:'Other', value:13}
];

function BroadcastsPage({ activeBusiness }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateLanguage, setTemplateLanguage] = useState("en_US");
  const [templateComponents, setTemplateComponents] = useState({});
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    if (activeBusiness) {
      fetchTemplates();
    }
  }, [activeBusiness]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/whatsapp/templates?business_id=${activeBusiness.id}`);
      const data = await response.json();
      if (data.status === "success") {
        setTemplates(data.templates);
      } else {
        setError(data.message || "Failed to fetch templates.");
      }
    } catch (err) {
      setError("Network error fetching templates.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!selectedTemplate) {
      alert("Please select a template.");
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const response = await fetch(`${API_BASE}/whatsapp/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_id: activeBusiness.id,
          template_name: selectedTemplate.name,
          language: templateLanguage,
          components: Object.values(templateComponents),
          audience_filter: audienceFilter,
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setSendResult({ success: true, message: data.message });
      } else {
        setSendResult({ success: false, message: data.message || "Failed to send broadcast." });
      }
    } catch (err) {
      setSendResult({ success: false, message: "Network error sending broadcast." });
    } finally {
      setSending(false);
    }
  };

  return (
    <section>
      <header className="page-header">
        <h2>WhatsApp Broadcast Campaigns</h2>
        <p>Send personalized, template-based messages to segmented leads on WhatsApp.</p>
      </header>

      <div className="grid2">
        <div className="card">
          <h3>1. Select Template</h3>
          {loading && <p>Loading templates...</p>}
          {error && <p>Error: {error}</p>}
          {!loading && templates.length === 0 && <p>No templates found. Create one in WhatsApp Manager.</p>}
          {!loading && templates.length > 0 && (
            <select
              value={selectedTemplate ? selectedTemplate.name : ""}
              onChange={(e) => setSelectedTemplate(templates.find(t => t.name === e.target.value))}
              className="input-field"
            >
              <option value="">-- Select a Template --</option>
              {templates.map((template) => (
                <option key={template.name} value={template.name}>
                  {template.name} ({template.language})
                </option>
              ))}
            </select>
          )}

          {selectedTemplate && (
            <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 20 }}>
              <h4>Template Preview: {selectedTemplate.name}</h4>
              <p style={{ fontSize: 12, color: "#666" }}>Language: {selectedTemplate.language}</p>
              <div className="template-preview" style={{ background: "#e6f7ff", padding: 15, borderRadius: 8, border: "1px solid #b3e0ff" }}>
                {selectedTemplate.components.map((comp, idx) => (
                  <div key={idx} style={{ marginBottom: 10 }}>
                    {comp.type === "HEADER" && comp.format === "TEXT" && (
                      <p style={{ fontWeight: "bold", marginBottom: 5 }}>{comp.text}</p>
                    )}
                    {comp.type === "BODY" && <p>{comp.text}</p>}
                    {comp.type === "FOOTER" && <p style={{ fontSize: 11, color: "#888" }}>{comp.text}</p>}
                    {comp.type === "BUTTONS" && (
                      <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
                        {comp.buttons.map((btn, bIdx) => (
                          <button key={bIdx} className="button-secondary" style={{ padding: "5px 10px", fontSize: 12 }}>{btn.text}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#999", marginTop: 10 }}>Note: Variables like {"{{1}}"} will be replaced with lead data.</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3>2. Configure & Send</h3>
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Audience Filter</label>
            <select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)} className="input-field">
              <option value="all">All Leads</option>
              <option value="hot">Hot Leads Only</option>
              <option value="warm">Warm Leads Only</option>
              <option value="qualified">Qualified Leads Only</option>
              {/* Add more filters as needed */}
            </select>
          </div>

          {selectedTemplate && selectedTemplate.components.some(c => c.text && c.text.includes("{{1}}")) && (
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">{"Template Variables (e.g., {{1}}, {{2}})"}</label>
              {selectedTemplate.components.map((comp, compIdx) => {
                const matches = comp.text ? [...comp.text.matchAll(/\{\{(\d+)\}\}/g)] : [];
                return matches.map((match, varIdx) => {
                  const varNumber = match[1];
                  return (
                    <input
                      key={`${compIdx}-${varNumber}`}
                      type="text"
                      placeholder={`Value for {{${varNumber}}}`}
                      value={templateComponents[varNumber] || ""}
                      onChange={(e) => setTemplateComponents(prev => ({ ...prev, [varNumber]: e.target.value }))}
                      className="input-field"
                      style={{ marginBottom: 10 }}
                    />
                  );
                });
              })}
            </div>
          )}

          <button onClick={handleSendBroadcast} disabled={sending || !selectedTemplate} className="button-primary">
            {sending ? "Sending..." : "Send Broadcast"}
          </button>

          {sendResult && (
            <div className={sendResult.success ? "success-message" : "error-message"} style={{ marginTop: 20 }}>
              {sendResult.message}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);

  const fetchConversations = async (f = filter, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter: f, limit: "100" });
      if (s) params.set("search", s);
      const res = await fetch(`${API_BASE}/conversations?${params.toString()}`);
      const data = await res.json();
      if (data.status === "success") {
        setConversations(data.conversations || []);
      } else {
        console.error("Failed to fetch conversations:", data.message);
      }
    } catch (e) {
      console.error("Error fetching conversations:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleFilterChange = (f) => {
    setFilter(f);
    setSelectedConversation(null);
    fetchConversations(f, search);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchConversations(filter, searchInput);
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
  };

  const handleCloseChat = () => {
    setSelectedConversation(null);
    fetchConversations(); // Refresh conversations after closing chat
  };

  return (
    <section>
      <Title
        title="Unified Inbox"
        sub={loading ? "Loading..." : `${conversations.length} conversations`}
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="ghost" onClick={() => fetchConversations()}>↻ Refresh</button>
          </div>
        }
      />

      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        {Object.keys(CONV_FILTER_LABELS).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            style={{
              padding: "6px 14px",
              fontSize: "0.82em",
              borderRadius: "20px",
              background: filter === f ? "#2563eb" : "rgba(255,255,255,0.05)",
              border: `1px solid ${filter === f ? "#2563eb" : "#334155"}`,
              color: filter === f ? "#fff" : "#94a3b8",
              cursor: "pointer",
            }}
          >
            {CONV_FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <div className="search" style={{ flex: 1 }}>
          <Search size={15} />
          <input
            placeholder="Search by name, message, or sender ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" style={{ padding: "0 16px" }}>Search</button>
        {search && (
          <button type="button" className="outline" onClick={() => { setSearchInput(""); setSearch(""); fetchConversations(filter, ""); }}>
            Clear
          </button>
        )}
      </form>

      <div style={{ display: "grid", gridTemplateColumns: selectedConversation ? "1fr 1.1fr" : "1fr", gap: "16px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>No conversations found.</div>
          ) : conversations.map((conv) => {
            const isSelected = selectedConversation?.sender_id === conv.sender_id;
            const stateColor = CONV_STATE_COLORS[conv.conversation_state] || "#64748b";
            return (
              <div
                key={conv.sender_id}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  padding: "14px 16px",
                  background: isSelected ? "rgba(37,99,235,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? "#2563eb" : "#1e293b"}`,
                  borderLeft: `4px solid ${isSelected ? "#2563eb" : stateColor}`,
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  marginBottom: "2px",
                }}
                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "0.95em", fontWeight: 600, color: "#f8fafc" }}>{conv.customer_name || `User ${String(conv.sender_id).slice(-4)}`}</div>
                  <span style={{ fontSize: "0.75em", color: "#94a3b8" }}>{timeAgo(conv.last_active)}</span>
                </div>
                <p style={{ fontSize: "0.85em", color: "#cbd5e1", marginBottom: "8px", lineHeight: "1.4" }}>{conv.last_message}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75em", fontWeight: 700, color: stateColor }}>
                    {CONV_FILTER_LABELS[conv.conversation_state] || conv.conversation_state}
                  </span>
                  {conv.needs_human && (
                    <span style={{ fontSize: "0.75em", color: "#ef4444", display: "flex", alignItems: "center", gap: "4px" }}>
                      <AlertTriangle size={12} /> Needs Human
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedConversation && (
          <ConversationChatPanel conversation={selectedConversation} onClose={handleCloseChat} onUpdateConversation={fetchConversations} />
        )}
      </div>
    </section>
  );
}

function ConversationChatPanel({ conversation, onClose, onUpdateConversation }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (conversation?.sender_id) {
      fetchHistory(conversation.sender_id);
    }
  }, [conversation?.sender_id]);

  const fetchHistory = async (senderId) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/conversation/${senderId}/history`);
      const data = await res.json();
      if (data.status === "success") {
        setHistory(data.history || []);
      } else {
        console.error("Failed to fetch history:", data.message);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendReply = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/conversation/send-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: conversation.sender_id, message: message }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setMessage("");
        fetchHistory(conversation.sender_id);
        onUpdateConversation(); // Refresh parent list
      } else {
        alert(`Failed to send reply: ${data.message}`);
      }
    } catch (e) {
      alert("Network error sending reply.");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${conversation.sender_id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status }),
      });
      const data = await res.json();
      if (data.status === "success") {
        onUpdateConversation(); // Refresh parent list
        onClose(); // Close chat panel after status update
      } else {
        alert(`Failed to update status: ${data.message}`);
      }
    } catch (e) {
      alert("Network error updating status.");
    }
  };

  return (
    <Card style={{ position: "sticky", top: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #334155", paddingBottom: "10px" }}>
        <h3 style={{ fontSize: "1.1em", color: "#f8fafc" }}>
          Conversation with {conversation.customer_name || `User ${String(conversation.sender_id).slice(-4)}`}
        </h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="button-secondary" onClick={() => handleUpdateStatus("closed")} title="Mark as Closed">
            <CheckSquare size={16} /> Mark Closed
          </button>
          <button className="button-secondary" onClick={() => handleUpdateStatus("needs_human")} title="Needs Human Attention">
            <AlertTriangle size={16} /> Needs Human
          </button>
          <button className="ghost" onClick={() => fetchHistory(conversation.sender_id)} title="Refresh Chat">
            <RefreshCw size={16} />
          </button>
          <button className="ghost" onClick={onClose} title="Close Chat">
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "15px", paddingRight: "10px" }}>
        {loadingHistory ? (
          <div style={{ textAlign: "center", color: "#94a3b8" }}>Loading messages...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: "center", color: "#94a3b8" }}>No messages in this conversation.</div>
        ) : (
          history.map((msg, i) => (
            <div key={i} style={{ marginBottom: "10px", display: "flex", justifyContent: msg.direction === "inbound" ? "flex-start" : "flex-end" }}>
              <div
                style={{
                  maxWidth: "70%",
                  padding: "8px 12px",
                  borderRadius: msg.direction === "inbound" ? "12px 12px 12px 2px" : "12px 12px 2px 12px",
                  background: msg.direction === "inbound" ? "#1e293b" : "#2563eb",
                  color: "#f8fafc",
                  fontSize: "0.88em",
                  lineHeight: "1.4",
                }}
              >
                <div style={{ fontSize: "0.7em", opacity: 0.7, marginBottom: "4px" }}>
                  {msg.direction === "inbound" ? "Customer" : "You"} - {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
                {msg.message}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #334155", paddingTop: "15px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your reply..."
          className="input-field"
          style={{ flex: 1 }}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSendReply();
            }
          }}
        />
        <button onClick={handleSendReply} disabled={sending} className="button-primary">
          {sending ? <Loader size={16} className="spin" /> : <Send size={16} />} Send
        </button>
      </div>
    </Card>
  );
}
function App() {
  const [page, setPage] = useState("Overview");
  const [dashboard, setDashboard] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [activeBusiness, setActiveBusiness] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = () => {
    fetch(`${API_BASE}/notifications/`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setNotifications(d.notifications || []);
          setUnreadCount(d.unread_count || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard-data`)
      .then(res => res.json())
      .then(data => setDashboard(data))
      .catch(err => console.error("Dashboard fetch error:", err));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/businesses/`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success' && d.businesses.length > 0) {
          setBusinesses(d.businesses);
          // Restore last selected business from localStorage
          const saved = localStorage.getItem('activeBizId');
          const found = d.businesses.find(b => b.id === saved);
          setActiveBusiness(found || d.businesses[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwitchBusiness = (biz) => {
    setActiveBusiness(biz);
    localStorage.setItem('activeBizId', biz.id);
  };

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} activeBusiness={activeBusiness}/>
      <main>
        <Topbar businesses={businesses} activeBusiness={activeBusiness} onSwitch={handleSwitchBusiness} onNavigate={setPage} notifications={notifications} unreadCount={unreadCount} onMarkAllRead={() => setUnreadCount(0)}/>
        <Screen page={page} dashboard={dashboard} activeBusiness={activeBusiness} setPage={setPage}/>
      </main>
    </div>
  );
}

function Sidebar({page,setPage,activeBusiness}) {
  const bizName = activeBusiness?.name || 'Admin';
  const initials = bizName.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  
  const navGroups = [
    { label: 'Overview', items: [['Overview', LayoutDashboard]] },
    { label: 'Inbox', items: [['Conversations', MessagesSquare]] },
    { label: 'Sales & CRM', items: [['Leads', Users], ['Hot Lead Queue', Flame], ['Import & Export', Download], ['Customer 360°', UserRound]] },
    { label: 'Marketing', items: [['Publisher', Radio], ['Broadcasts', Radio], ['Google Reviews', Star]] },
    { label: 'Intelligence', items: [['Business Brain', Brain], ['Pipeline Debugger', Bug], ['AI Playground', Bot], ['Reports', BarChart3]] },
    { label: 'Settings', items: [['Automation', Workflow], ['Businesses', Building2], ['Integrations', Plug], ['Settings', Settings]] }
  ];

  return (
    <aside style={{display:'flex',flexDirection:'column'}}>
      <div className="brand"><div className="logo">AI</div><b>AI COMMAND CENTER</b></div>
      <nav style={{flex:1,overflowY:'auto',padding:'10px 0'}}>
        {navGroups.map(group => (
          <div key={group.label} style={{marginBottom:16}}>
            <div style={{padding:'0 16px',fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>
              {group.label}
            </div>
            {group.items.map(([n,Icon])=>(
              <button key={n} onClick={()=>setPage(n)} className={page===n?'active':''} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 16px',background:page===n?'rgba(59,130,246,0.1)':'none',border:'none',cursor:'pointer',textAlign:'left',fontSize:13,color:page===n?'#60a5fa':'#cbd5e1',fontWeight:page===n?600:500,transition:'all 0.15s',borderRadius:'0 20px 20px 0',marginRight:'10px'}}>
                <Icon size={16} color={page===n?'#60a5fa':'#94a3b8'}/>
                {n}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="profile" style={{marginTop:'auto',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'16px'}}>
        <div className="avatar" style={{width:32,height:32,borderRadius:8,background:'#3b82f6',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>{initials}</div>
        <div style={{marginLeft:10,overflow:'hidden'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#f8fafc',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bizName}</div>
          <div style={{fontSize:11,color:'#94a3b8'}}>Administrator</div>
        </div>
      </div>
    </aside>
  );
}

const NOTIF_ICONS = {
  hot_lead: { icon: '🔥', color: '#ef4444', bg: '#fef2f2' },
  needs_human: { icon: '👤', color: '#f59e0b', bg: '#fffbeb' },
  stale_conversation: { icon: '⏰', color: '#6366f1', bg: '#f5f3ff' },
};

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function Topbar({ businesses, activeBusiness, onSwitch, onNavigate, notifications, unreadCount, onMarkAllRead }) {
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [showNotifs, setShowNotifsState] = useState(false);
  const dropdownRef = React.useRef(null);
  const notifRef = React.useRef(null);

  // Close business switcher when clicking outside
  React.useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowSwitcher(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close notifications when clicking outside
  React.useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifsState(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="topbar">
      <div className="left">
        <div className="business-switcher" onClick={() => setShowSwitcher(!showSwitcher)} ref={dropdownRef}>
          <div className="avatar">{activeBusiness?.name[0].toUpperCase()}</div>
          <span className="name">{activeBusiness?.name || 'Select Business'}</span>
          <ChevronRight size={16} style={{transform: showSwitcher ? 'rotate(90deg)' : 'none'}}/>
        </div>
        {showSwitcher && (
          <div className="dropdown-menu">
            {businesses.map(biz => (
              <div key={biz.id} className="dropdown-item" onClick={() => onSwitch(biz)}>
                {biz.name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="right">
        <button className="icon-button" onClick={() => onNavigate('Settings')}><Settings size={20}/></button>
        <div className="notification-bell" onClick={() => setShowNotifsState(!showNotifs)} ref={notifRef}>
          <Bell size={20}/>
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          {showNotifs && (
            <div className="notifications-dropdown">
              <div className="header">
                <h4>Notifications</h4>
                {unreadCount > 0 && <button className="mark-read" onClick={onMarkAllRead}>Mark all as read</button>}
              </div>
              {notifications.length === 0 ? (
                <p className="empty-state">No new notifications.</p>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="notification-item">
                    <div className="icon" style={{background: NOTIF_ICONS[notif.type]?.bg, color: NOTIF_ICONS[notif.type]?.color}}>{NOTIF_ICONS[notif.type]?.icon}</div>
                    <div className="content">
                      <div className="title">{notif.title}</div>
                      <div className="message">{notif.message}</div>
                      <div className="time">{timeAgo(notif.created_at)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const CONV_FILTER_LABELS = {
  all: 'All',
  needs_human: 'Needs Human',
  pending_reply: 'Pending AI Reply',
  ai_replied: 'AI Replied',
  manual_replied: 'Manual Replied',
};

const CONV_STATE_COLORS = {
  active: '#2563eb',
  needs_human: '#ef4444',
  pending_reply: '#f59e0b',
  ai_replied: '#10b981',
  manual_replied: '#8b5cf6',
  closed: '#64748b',
};

const TEMP_COLORS = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#64748b',
};

const TEMP_COLORS_360 = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#64748b',
};

const TIMELINE_ICONS = {
  start: '🚀',
  lead: '👤',
  qualified: '✅',
  activity: '💬',
  note: '📝',
  call: '📞',
  email: '📧',
  meeting: '🗓️',
};

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#f59e0b',
  negative: '#ef4444',
};

const URGENCY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

function Screen({ page, dashboard, activeBusiness, setPage }) {
  if (!activeBusiness) {
    return (
      <div style={{padding: '40px', textAlign: 'center', color: '#94a3b8'}}>
        <h2 style={{marginBottom: '20px'}}>Welcome to AI Command Center</h2>
        <p style={{fontSize: '1.1em', lineHeight: '1.6'}}>Please select a business from the top-left dropdown to get started, or create a new one in settings.</p>
        <button onClick={() => setPage('Settings')} style={{marginTop: '30px', padding: '10px 20px', fontSize: '1em'}}>Go to Settings</button>
      </div>
    );
  }

  switch (page) {
    case "Overview":
      return <OverviewPage dashboard={dashboard} activeBusiness={activeBusiness}/>;
    case "Conversations":
      return <Conversations/>;
    case "Leads":
      return <LeadsPage/>;
    case "Hot Lead Queue":
      return <HotLeadQueue/>;
    case "Import & Export":
      return <ImportExportPage/>;
    case "Pipeline Debugger":
      return <PipelineDebugger/>;
    case "AI Playground":
      return <AIPlayground/>;
    case "Business Brain":
      return <BusinessBrain/>;
    case "Appointments":
      return <AppointmentsPage/>;
    case "Customer 360°":
      return <Customer360/>;
    case "Reports":
      return <ReportsPage/>;
    case "Automation":
      return <AutomationPage/>;
    case "Publisher":
      return <PublisherPage/>;
    case "Broadcasts":
      return <BroadcastsPage activeBusiness={activeBusiness}/>;
    case "Google Reviews":
      return <GoogleReviewsPage/>;
    case "Businesses":
      return <BusinessesPage/>;
    case "Integrations":
      return <IntegrationsPage/>;
    case "Settings":
      return <SettingsPage/>;
    default:
      return <OverviewPage dashboard={dashboard} activeBusiness={activeBusiness}/>;
  }
}

function Title({ title, sub, action }) {
  return (
    <div style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div>
        <h1 style={{fontSize: '1.8em', color: '#f8fafc', fontWeight: 800, marginBottom: '5px'}}>{title}</h1>
        {sub && <p style={{fontSize: '0.9em', color: '#94a3b8'}}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Card({ title, children, style }) {
  return (
    <div className="card" style={style}>
      {title && <h3 style={{marginBottom: '15px'}}>{title}</h3>}
      {children}
    </div>
  );
}

function OverviewPage({ dashboard, activeBusiness }) {
  const [briefing, setBriefing] = useState(null);
  const [loadingBriefing, setLoadingBriefing] = useState(true);

  useEffect(() => {
    const fetchBriefing = async () => {
      setLoadingBriefing(true);
      try {
        const res = await fetch(`${API_BASE}/briefing`);
        const data = await res.json();
        if (data.status === 'success') {
          setBriefing(data.briefing);
        } else {
          console.error('Failed to fetch briefing:', data.message);
        }
      } catch (error) {
        console.error('Error fetching briefing:', error);
      } finally {
        setLoadingBriefing(false);
      }
    };
    fetchBriefing();
  }, []);

  return (
    <section>
      <Title title="Overview" sub="At a glance summary of your business performance"/>

      {loadingBriefing ? (
        <Card>
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100px', color:'#94a3b8'}}>
            Loading daily briefing...
          </div>
        </Card>
      ) : briefing ? (
        <Card title="Daily AI Morning Briefing">
          <div style={{fontSize:'0.9em', lineHeight:'1.6', color:'#e2e8f0'}}>
            <p style={{marginBottom:'10px'}}>{briefing.summary}</p>
            {briefing.key_metrics && (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'10px', marginTop:'15px'}}>
                {briefing.key_metrics.map((metric, i) => (
                  <div key={i} style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px', border:'1px solid #334155'}}>
                    <div style={{fontSize:'0.75em', color:'#94a3b8', marginBottom:'3px'}}>{metric.label}</div>
                    <div style={{fontSize:'1.1em', fontWeight:700, color:'#f8fafc'}}>{metric.value}</div>
                  </div>
                ))}
              </div>
            )}
            {briefing.action_items && briefing.action_items.length > 0 && (
              <div style={{marginTop:'20px'}}>
                <h4 style={{fontSize:'1em', color:'#f8fafc', marginBottom:'10px'}}>Action Items:</h4>
                <ul style={{listStyle:'none', padding:0}}>
                  {briefing.action_items.map((item, i) => (
                    <li key={i} style={{display:'flex', alignItems:'flex-start', marginBottom:'8px', fontSize:'0.88em', color:'#cbd5e1'}}>
                      <CheckCircle size={16} style={{marginRight:'8px', color:'#10b981', flexShrink:0}}/>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100px', color:'#94a3b8'}}>
            No daily briefing available.
          </div>
        </Card>
      )}

      <div className="grid2">
        <Card title="Conversations Over Time">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={conversationData}>
              <XAxis dataKey="day" stroke="#64748b" tick={{fontSize: 12}}/>
              <YAxis stroke="#64748b" tick={{fontSize: 12}}/>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }}/>
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} name="Total Conversations" />
              <Line type="monotone" dataKey="ai" stroke="#10b981" strokeWidth={2} name="AI Handled" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Intent Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={intents}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {intents.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} labelStyle={{ color: '#94a3b8' }}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Urgent Action Banner" style={{marginTop: '20px', background: 'linear-gradient(45deg, #ef4444, #f97316)', color: '#fff', border: 'none'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <AlertTriangle size={28} strokeWidth={2.5}/>
          <div>
            <h3 style={{color: '#fff', marginBottom: '5px'}}>5 Conversations Need Human Attention!</h3>
            <p style={{fontSize: '0.9em', opacity: 0.9}}>Review these conversations now to prevent lead loss and ensure customer satisfaction.</p>
          </div>
          <button className="button-light" onClick={() => setPage('Conversations')} style={{marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)'}}>View Urgent Conversations</button>
        </div>
      </Card>
    </section>
  );
}

function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchLeads = (f = filter, s = search) => {
    setLoading(true);
    const params = new URLSearchParams({ filter: f, limit: '100' });
    if (s) params.set('search', s);
    fetch(`${API_BASE}/all-leads?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setLeads(data.leads || []);
        }
      })
      .catch(err => console.error('Leads fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleFilterChange = (f) => {
    setFilter(f);
    setSelectedLead(null);
    setSummary(null);
    fetchLeads(f, search);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchLeads(filter, searchInput);
  };

  const loadSummary = async (lead) => {
    setSelectedLead(lead);
    setSummary(null);
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/leads/${lead.sender_id}/summary`);
      const data = await res.json();
      if (data.status === 'success') {
        setSummary(data.summary);
      } else {
        setSummary({ error: data.message || 'Failed to load summary' });
      }
    } catch (e) {
      setSummary({ error: 'Network error loading summary' });
    }
    setLoadingSummary(false);
  };

  const handleMarkQualified = async (leadId) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}/qualify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchLeads(filter, search); // Refresh leads list
        if (selectedLead && selectedLead.id === leadId) {
          loadSummary({ ...selectedLead, is_qualified: true, temperature: 'hot' }); // Refresh summary
        }
      } else {
        alert(`Failed to qualify lead: ${data.message}`);
      }
    } catch (e) {
      alert('Network error qualifying lead.');
    }
  };

  const LEAD_FILTER_LABELS = {
    all: 'All Leads',
    qualified: 'Qualified',
    new: 'New',
    phone_pending: 'Phone Pending',
    name_pending: 'Name Pending',
    hot: 'Hot',
    warm: 'Warm',
    cold: 'Cold',
  };

  return (
    <section>
      <Title
        title="Leads CRM"
        sub={loading ? 'Loading...' : `${leads.length} leads`}
        action={
          <div style={{display:'flex', gap:'8px'}}>
            <button className="ghost" onClick={() => fetchLeads()}>↻ Refresh</button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div style={{display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap'}}>
        {Object.keys(LEAD_FILTER_LABELS).map(f => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            style={{
              padding:'6px 14px', fontSize:'0.82em', borderRadius:'20px',
              background: filter === f ? '#2563eb' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${filter === f ? '#2563eb' : '#334155'}`,
              color: filter === f ? '#fff' : '#94a3b8',
              cursor:'pointer',
            }}
          >
            {LEAD_FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
        <div className="search" style={{flex:1}}>
          <Search size={15}/>
          <input
            placeholder="Search by name, message, or sender ID..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" style={{padding:'0 16px'}}>Search</button>
        {search && (
          <button type="button" className="outline" onClick={() => { setSearchInput(''); setSearch(''); fetchLeads(filter, ''); }}>
            Clear
          </button>
        )}
      </form>

      <div style={{display:'grid', gridTemplateColumns: selectedLead ? '1fr 1.1fr' : '1fr', gap:'16px', alignItems:'start'}}>
        {/* Lead list */}
        <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
          {loading ? (
            <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Loading leads...</div>
          ) : leads.length === 0 ? (
            <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>No leads found.</div>
          ) : leads.map((lead, i) => {
            const isSelected = selectedLead?.sender_id === lead.sender_id;
            const tempColor = TEMP_COLORS[lead.temperature] || '#64748b';
            return (
              <div
                key={i}
                onClick={() => loadSummary(lead)}
                style={{
                  padding:'14px 16px',
                  background: isSelected ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? '#2563eb' : '#1e293b'}`,
                  borderLeft: `4px solid ${isSelected ? '#2563eb' : tempColor}`,
                  borderRadius:'10px',
                  cursor:'pointer',
                  transition:'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom:'2px'
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              >
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                    <div style={{width:'46px', height:'46px', borderRadius:'14px', background: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.07)', border:`1px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', color: isSelected ? '#fff' : '#e2e8f0', fontSize:'1.2em', fontWeight:800, flexShrink:0, transition:'all 0.2s'}}>
                      {String(lead.name || lead.instagram_username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:'1.05em', fontWeight:700, color: isSelected ? '#fff' : '#f8fafc', transition:'all 0.2s', marginBottom:'3px'}}>{lead.name || lead.instagram_username || `User ${String(lead.sender_id).slice(-4)}`}</div>
                      <div style={{fontSize:'0.78em', color:'#94a3b8', display:'flex', alignItems:'center', gap:'8px'}}>
                        <span style={{color: tempColor, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', fontSize:'0.9em'}}>{lead.temperature}</span>
                        <span style={{color:'#334155'}}>•</span>
                        <span style={{color:'#64748b'}}>{lead.lead_stage || 'New Lead'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{textAlign:'right', flexShrink:0}}>
                    <div style={{fontSize:'0.75em', color:'#475569', fontWeight:500, marginBottom:'5px'}}>
                      {lead.updated_at ? timeAgo(lead.updated_at) : '-'}
                    </div>
                    {lead.is_qualified && <span style={{fontSize:'0.72em', padding:'3px 9px', borderRadius:'12px', background:'#f0fdf4', color:'#14532d', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.02em'}}>Qualified</span>}
                  </div>
                </div>
                <div style={{fontSize:'0.88em', color:'#cbd5e1', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingLeft:'60px', lineHeight:'1.4'}}>
                  {lead.interested_in || lead.notes || <span style={{fontStyle:'italic', color:'#475569'}}>No recent activity</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lead detail panel */}
        {selectedLead && (
          <LeadDetailPanel
            lead={selectedLead}
            summary={summary}
            loadingSummary={loadingSummary}
            onClose={() => { setSelectedLead(null); setSummary(null); }}
            onMarkQualified={handleMarkQualified}
          />
        )}
      </div>
    </section>
  );
}

function LeadDetailPanel({ lead, summary, loadingSummary, onClose, onMarkQualified }) {
  const tempColor = TEMP_COLORS[lead.temperature] || '#64748b';
  const [showConversation, setShowConversation] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  const fetchConversation = async () => {
    setLoadingConversation(true);
    try {
      const res = await fetch(`${API_BASE}/conversation/${lead.sender_id}`);
      const data = await res.json();
      if (data.status === 'success') {
        setConversation(data.conversation);
      } else {
        console.error('Failed to fetch conversation:', data.message);
      }
    } catch (e) {
      console.error('Error fetching conversation:', e);
    } finally {
      setLoadingConversation(false);
    }
  };

  useEffect(() => {
    if (showConversation && !conversation) {
      fetchConversation();
    }
  }, [showConversation, conversation]);

  return (
    <div style={{display:'flex', flexDirection:'column', height:'calc(100vh - 160px)', background:'rgba(255,255,255,0.02)', border:'1px solid #1e293b', borderRadius:'12px', overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 16px', borderBottom:'1px solid #1e293b', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700}}>
            {String(lead.name || lead.instagram_username || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{fontWeight:700, color:'#e2e8f0', fontSize:'0.95em'}}>{lead.name || lead.instagram_username || `User ${String(lead.sender_id).slice(-4)}`}</div>
            <div style={{fontSize:'0.75em', display:'flex', alignItems:'center', gap:'6px'}}>
              <span style={{color: tempColor, fontWeight:600}}>{lead.temperature} Lead</span>
              <span style={{color:'#475569'}}>· {lead.lead_stage || 'New'}</span>
            </div>
          </div>
        </div>
        <div style={{display:'flex', gap:'8px'}}>
          {!lead.is_qualified && (
            <button className="button-primary" onClick={() => onMarkQualified(lead.id)} style={{padding:'4px 10px', fontSize:'0.8em'}}>
              ✅ Mark Qualified
            </button>
          )}
          <button className="outline" onClick={onClose} style={{padding:'4px 10px', fontSize:'0.8em'}}><X size={13}/></button>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'16px'}}>
        {/* Lead Summary */}
        <Card title="AI Lead Summary">
          {loadingSummary ? (
            <div style={{textAlign:'center', color:'#64748b'}}>Generating summary...</div>
          ) : summary?.error ? (
            <div style={{color:'#ef4444'}}>Error: {summary.error}</div>
          ) : summary ? (
            <div style={{fontSize:'0.9em', lineHeight:'1.6'}}>
              <p style={{marginBottom:'10px', fontStyle:'italic', color:'#cbd5e1'}}>"{summary.one_liner}"</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
                <div style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px', border:'1px solid #334155'}}>
                  <div style={{fontSize:'0.75em', color:'#94a3b8', marginBottom:'3px'}}>Intent</div>
                  <div style={{fontSize:'1.1em', fontWeight:700, color:'#f8fafc'}}>{summary.intent}</div>
                </div>
                <div style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px', border:'1px solid #334155'}}>
                  <div style={{fontSize:'0.75em', color:'#94a3b8', marginBottom:'3px'}}>Stage</div>
                  <div style={{fontSize:'1.1em', fontWeight:700, color:'#f8fafc'}}>{summary.stage}</div>
                </div>
              </div>
              {summary.key_facts && summary.key_facts.length > 0 && (
                <div style={{marginBottom:'15px'}}>
                  <h4 style={{fontSize:'0.9em', color:'#f8fafc', marginBottom:'8px'}}>Key Facts:</h4>
                  <ul style={{listStyle:'none', padding:0}}>
                    {summary.key_facts.map((fact, i) => (
                      <li key={i} style={{display:'flex', alignItems:'flex-start', marginBottom:'5px', fontSize:'0.85em', color:'#cbd5e1'}}>
                        <CheckCircle size={14} style={{marginRight:'6px', color:'#10b981', flexShrink:0}}/>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {summary.recommended_action && (
                <div style={{background:'rgba(16,185,129,0.1)', border:'1px solid #10b981', padding:'12px', borderRadius:'8px', marginBottom:'15px'}}>
                  <h4 style={{fontSize:'0.9em', color:'#10b981', marginBottom:'5px'}}>Recommended Action:</h4>
                  <p style={{fontSize:'0.85em', color:'#10b981', fontWeight:600}}>{summary.recommended_action}</p>
                </div>
              )}
              {summary.urgency && (
                <div style={{background:'rgba(239,68,68,0.1)', border:'1px solid #ef4444', padding:'12px', borderRadius:'8px'}}>
                  <h4 style={{fontSize:'0.9em', color:'#ef4444', marginBottom:'5px'}}>Urgency:</h4>
                  <p style={{fontSize:'0.85em', color:'#ef4444', fontWeight:600}}>{summary.urgency}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{textAlign:'center', color:'#64748b'}}>No summary available.</div>
          )}
        </Card>

        {/* Lead Details */}
        <Card title="Lead Details">
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            {[["Name", lead.name], ["Email", lead.email], ["Phone", lead.phone], ["Location", lead.location], ["Interested In", lead.interested_in], ["Mode", lead.mode], ["Lead Stage", lead.lead_stage], ["Status", lead.status], ["Lead Score", lead.lead_score], ["Created At", lead.created_at ? new Date(lead.created_at).toLocaleString() : null]].map(([label, value]) => (
              value && (
                <div key={label} style={{background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px', border:'1px solid #334155'}}>
                  <div style={{fontSize:'0.75em', color:'#94a3b8', marginBottom:'3px'}}>{label}</div>
                  <div style={{fontSize:'0.9em', fontWeight:600, color:'#f8fafc'}}>{value}</div>
                </div>
              )
            ))}
          </div>
          {lead.notes && (
            <div style={{marginTop:'15px', background:'rgba(255,255,255,0.05)', padding:'10px', borderRadius:'8px', border:'1px solid #334155'}}>
              <div style={{fontSize:'0.75em', color:'#94a3b8', marginBottom:'3px'}}>Notes</div>
              <div style={{fontSize:'0.9em', fontWeight:600, color:'#f8fafc', lineHeight:'1.5'}}>{lead.notes}</div>
            </div>
          )}
        </Card>

        {/* Conversation History Toggle */}
        <Card>
          <button onClick={() => setShowConversation(!showConversation)} style={{width:'100%', padding:'10px', background:'rgba(255,255,255,0.05)', border:'1px solid #334155', borderRadius:'8px', color:'#f8fafc', fontSize:'0.9em', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span>{showConversation ? 'Hide' : 'Show'} Full Conversation History</span>
            {loadingConversation ? <Loader size={18} className="spin"/> : <ChevronRight size={18} style={{transform: showConversation ? 'rotate(90deg)' : 'none'}}/>}
          </button>
          {showConversation && loadingConversation && (
            <div style={{textAlign:'center', color:'#64748b', padding:'20px'}}>Loading conversation...</div>
          )}
          {showConversation && conversation && conversation.history && (
            <div style={{marginTop:'15px', maxHeight:'400px', overflowY:'auto', background:'rgba(0,0,0,0.1)', borderRadius:'8px', padding:'10px'}}>
              {conversation.history.map((item, i) => (
                <div key={i} style={{marginBottom:'10px'}}>
                  {item.user && (
                    <div style={{display:'flex', justifyContent:'flex-start', marginBottom:'5px'}}>
                      <div style={{maxWidth:'75%', padding:'8px 12px', background:'#f1f5f9', borderRadius:'12px 12px 12px 2px', fontSize:'0.84em', color:'#1e293b', lineHeight:'1.5'}}>
                        <div style={{fontSize:'0.7em', color:'#64748b', fontWeight:700, marginBottom:'3px'}}>Customer</div>
                        {item.user}
                      </div>
                    </div>
                  )}
                  {item.assistant && (
                    <div style={{display:'flex', justifyContent:'flex-end'}}>
                      <div style={{maxWidth:'75%', padding:'8px 12px', background:'#dbeafe', borderRadius:'12px 12px 2px 12px', fontSize:'0.84em', color:'#1e3a8a', lineHeight:'1.5'}}>
                        <div style={{fontSize:'0.7em', color:'#2563eb', fontWeight:700, marginBottom:'3px'}}>AI Assistant</div>
                        {item.assistant}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

function HotLeadQueue() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchHotLeads = () => {
    setLoading(true);
    fetch(`${API_BASE}/all-leads?filter=hot`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setLeads(data.leads || []);
        }
      })
      .catch(err => console.error('Hot leads fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHotLeads(); }, []);

  const loadSummary = async (lead) => {
    setSelectedLead(lead);
    setSummary(null);
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/leads/${lead.sender_id}/summary`);
      const data = await res.json();
      if (data.status === 'success') {
        setSummary(data.summary);
      } else {
        setSummary({ error: data.message || 'Failed to load summary' });
      }
    } catch (e) {
      setSummary({ error: 'Network error loading summary' });
    }
    setLoadingSummary(false);
  };

  const handleMarkQualified = async (leadId) => {
    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}/qualify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchHotLeads(); // Refresh leads list
        if (selectedLead && selectedLead.id === leadId) {
          loadSummary({ ...selectedLead, is_qualified: true, temperature: 'hot' }); // Refresh summary
        }
      } else {
        alert(`Failed to qualify lead: ${data.message}`);
      }
    } catch (e) {
      alert('Network error qualifying lead.');
    }
  };

  return (
    <section>
      <Title
        title="Hot Lead Queue"
        sub={loading ? 'Loading...' : `${leads.length} hot leads`}
        action={
          <div style={{display:'flex', gap:'8px'}}>
            <button className="ghost" onClick={() => fetchHotLeads()}>↻ Refresh</button>
          </div>
        }
      />

      <div style={{display:'grid', gridTemplateColumns: selectedLead ? '1fr 1.1fr' : '1fr', gap:'16px', alignItems:'start'}}>
        {/* Hot Lead list */}
        <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
          {loading ? (
            <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Loading hot leads...</div>
          ) : leads.length === 0 ? (
            <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>No hot leads found.</div>
          ) : leads.map((lead, i) => {
            const isSelected = selectedLead?.sender_id === lead.sender_id;
            return (
              <div
                key={i}
                onClick={() => loadSummary(lead)}
                style={{
                  padding:'14px 16px',
                  background: isSelected ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? '#ef4444' : '#1e293b'}`,
                  borderLeft: `4px solid ${isSelected ? '#ef4444' : '#ef4444'}`,
                  borderRadius:'10px',
                  cursor:'pointer',
                  transition:'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginBottom:'2px'
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              >
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'14px'}}>
                    <div style={{width:'46px', height:'46px', borderRadius:'14px', background: isSelected ? '#ef4444' : 'rgba(255,255,255,0.07)', border:`1px solid ${isSelected ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', color: isSelected ? '#fff' : '#e2e8f0', fontSize:'1.2em', fontWeight:800, flexShrink:0, transition:'all 0.2s'}}>
                      {String(lead.name || lead.instagram_username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:'1.05em', fontWeight:700, color: isSelected ? '#fff' : '#f8fafc', transition:'all 0.2s', marginBottom:'3px'}}>{lead.name || lead.instagram_username || `User ${String(lead.sender_id).slice(-4)}`}</div>
                      <div style={{fontSize:'0.78em', color:'#94a3b8', display:'flex', alignItems:'center', gap:'8px'}}>
                        <span style={{color:'#ef4444', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', fontSize:'0.9em'}}>Hot Lead</span>
                        <span style={{color:'#334155'}}>•</span>
                        <span style={{color:'#64748b'}}>{lead.lead_stage || 'New Lead'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{textAlign:'right', flexShrink:0}}>
                    <div style={{fontSize:'0.75em', color:'#475569', fontWeight:500, marginBottom:'5px'}}>
                      {lead.updated_at ? timeAgo(lead.updated_at) : '-'}
                    </div>
                    {lead.is_qualified && <span style={{fontSize:'0.72em', padding:'3px 9px', borderRadius:'12px', background:'#f0fdf4', color:'#14532d', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.02em'}}>Qualified</span>}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Lead detail panel */}
        {selectedLead && (
          <LeadDetailPanel
            lead={selectedLead}
            summary={summary}
            loadingSummary={loadingSummary}
            onClose={() => { setSelectedLead(null); setSummary(null); }}
            onMarkQualified={handleMarkQualified}
          />
        )}
      </div>
    </section>
  );
}

function ImportExportPage() {
  return (
    <section>
      <Title title="Import & Export" sub="Manage your data"/>
      <Card>
        <p>Import and Export functionality coming soon.</p>
      </Card>
    </section>
  );
}

function PipelineDebugger() {
  const [pipelineOutput, setPipelineOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [senderId, setSenderId] = useState('');

  const handleDebug = async () => {
    setLoading(true);
    setPipelineOutput(null);
    try {
      const res = await fetch(`${API_BASE}/debug-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: senderId, message_text: message }),
      });
      const data = await res.json();
      setPipelineOutput(data);
    } catch (e) {
      setPipelineOutput({ status: 'error', message: e.message });
    }
    setLoading(false);
  };

  return (
    <section>
      <Title title="Pipeline Debugger" sub="Test and visualize the AI pipeline flow"/>
      <Card>
        <div style={{marginBottom:'15px'}}>
          <label className="form-label">Sender ID (e.g., Instagram User ID)</label>
          <input type="text" value={senderId} onChange={e => setSenderId(e.target.value)} placeholder="Enter sender ID" className="input-field"/>
        </div>
        <div style={{marginBottom:'15px'}}>
          <label className="form-label">Test Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter a message to test the pipeline..." className="input-field" rows="4"></textarea>
        </div>
        <button onClick={handleDebug} disabled={loading || !message || !senderId} className="button-primary">
          {loading ? 'Running...' : 'Run Pipeline'}
        </button>

        {pipelineOutput && (
          <div style={{marginTop:'20px', background:'rgba(0,0,0,0.1)', padding:'15px', borderRadius:'8px', fontFamily:'monospace', fontSize:'0.85em', whiteSpace:'pre-wrap', wordBreak:'break-word'}}>
            <h4 style={{marginBottom:'10px', color:'#f8fafc'}}>Pipeline Output:</h4>
            <pre style={{color:'#cbd5e1'}}>{JSON.stringify(pipelineOutput, null, 2)}</pre>
          </div>
        )}
      </Card>
    </section>
  );
}

function AIPlayground() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch(`${API_BASE}/ai-playground`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (e) {
      setResponse({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <section>
      <Title title="AI Playground" sub="Experiment with AI prompts"/>
      <Card>
        <div style={{marginBottom:'15px'}}>
          <label className="form-label">Prompt</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Enter your AI prompt here..." className="input-field" rows="6"></textarea>
        </div>
        <button onClick={handleGenerate} disabled={loading || !prompt} className="button-primary">
          {loading ? 'Generating...' : 'Generate Response'}
        </button>

        {response && (
          <div style={{marginTop:'20px', background:'rgba(0,0,0,0.1)', padding:'15px', borderRadius:'8px', fontFamily:'monospace', fontSize:'0.85em', whiteSpace:'pre-wrap', wordBreak:'break-word'}}>
            <h4 style={{marginBottom:'10px', color:'#f8fafc'}}>AI Response:</h4>
            <pre style={{color:'#cbd5e1'}}>{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </Card>
    </section>
  );
}

function BusinessBrain() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({ trigger_keywords: '', response_template: '', priority: 0, active: true });
  const [editingRule, setEditingRule] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = [
    {
      name: "Course Inquiry",
      description: "Respond to questions about specific courses.",
      trigger_keywords: "course, training, program, learn",
      response_template: "Thanks for your interest in {{course_name}}! We offer comprehensive training. Can I share more details or help you enroll?",
      priority: 5,
    },
    {
      name: "Pricing Inquiry",
      description: "Provide pricing information for services.",
      trigger_keywords: "price, cost, how much",
      response_template: "Our {{service_name}} starts at {{price_point}}. Would you like a detailed quote?",
      priority: 8,
    },
    {
      name: "Contact Info Request",
      description: "Share contact details when asked.",
      trigger_keywords: "contact, call, email, phone",
      response_template: "You can reach us at {{phone_number}} or email {{email_address}}. How can we help further?",
      priority: 10,
    },
  ];

  const applyTemplate = (template) => {
    setNewRule({ ...template, active: true });
    setShowTemplates(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/business-brain/rules`);
      const data = await res.json();
      if (data.status === 'success') {
        setRules(data.rules || []);
      }
    } catch (e) {
      console.error('Error fetching rules:', e);
    }
    setLoading(false);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    const method = editingRule ? 'PUT' : 'POST';
    const url = editingRule ? `${API_BASE}/business-brain/rules/${editingRule.id}` : `${API_BASE}/business-brain/rules`;
    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setNewRule({ trigger_keywords: '', response_template: '', priority: 0, active: true });
        setEditingRule(null);
        fetchRules();
      } else {
        alert(`Failed to save rule: ${data.message}`);
      }
    } catch (e) {
      alert('Network error saving rule.');
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setNewRule({ ...rule });
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      const res = await fetch(`${API_BASE}/business-brain/rules/${ruleId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchRules();
      } else {
        alert(`Failed to delete rule: ${data.message}`);
      }
    } catch (e) {
      alert('Network error deleting rule.');
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const res = await fetch(`${API_BASE}/business-brain/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, active: !rule.active }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchRules();
      } else {
        alert(`Failed to toggle rule status: ${data.message}`);
      }
    } catch (e) {
      alert('Network error toggling rule status.');
    }
  };

  return (
    <section>
      <Title
        title="Business Brain"
        sub="Teach the AI how your business works using natural language instructions."
        action={
          <div style={{display:'flex', gap:'8px'}}>
            <button className="ghost" onClick={() => fetchRules()}>↻ Refresh</button>
            <button className="button-secondary" onClick={() => setShowTemplates(!showTemplates)}>
              <Zap size={16}/> Quick Templates
            </button>
          </div>
        }
      />

      {showTemplates && (
        <Card title="Quick Templates" style={{marginBottom:'20px'}}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'15px'}}>
            {templates.map((template, i) => (
              <div key={i} style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'8px', border:'1px solid #334155', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
                <div>
                  <h4 style={{fontSize:'1em', marginBottom:'8px', color:'#f8fafc'}}>{template.name}</h4>
                  <p style={{fontSize:'0.85em', color:'#cbd5e1', marginBottom:'12px'}}>{template.description}</p>
                </div>
                <button className="button-secondary" onClick={() => applyTemplate(template)} style={{alignSelf:'flex-start', padding:'6px 12px', fontSize:'0.8em'}}>
                  Apply Template
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title={editingRule ? "Edit Business Rule" : "Add New Business Rule"} style={{marginBottom:'20px'}}>
        <form onSubmit={handleSaveRule} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          <div>
            <label className="form-label">Trigger Keywords (comma-separated)</label>
            <input
              type="text"
              value={newRule.trigger_keywords}
              onChange={e => setNewRule({ ...newRule, trigger_keywords: e.target.value })}
              placeholder="e.g., course, pricing, support"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="form-label">Response Template (use {{variable}} for dynamic values)</label>
            <textarea
              value={newRule.response_template}
              onChange={e => setNewRule({ ...newRule, response_template: e.target.value })}
              placeholder="e.g., Our {{course_name}} starts at {{price}}. Can I help you enroll?"
              className="input-field"
              rows="4"
              required
            ></textarea>
          </div>
          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            <div style={{flex:1}}>
              <label className="form-label">Priority (0-10, higher means more important)</label>
              <input
                type="number"
                value={newRule.priority}
                onChange={e => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                min="0"
                max="10"
                className="input-field"
                required
              />
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'8px', marginTop:'20px'}}>
              <input
                type="checkbox"
                id="rule-active"
                checked={newRule.active}
                onChange={e => setNewRule({ ...newRule, active: e.target.checked })}
                style={{width:'auto'}}
              />
              <label htmlFor="rule-active" className="form-label" style={{marginBottom:0}}>Active</label>
            </div>
          </div>
          <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
            <button type="submit" className="button-primary">
              <Save size={16}/> {editingRule ? 'Update Rule' : 'Add Rule'}
            </button>
            {editingRule && (
              <button type="button" className="button-secondary" onClick={() => { setEditingRule(null); setNewRule({ trigger_keywords: '', response_template: '', priority: 0, active: true }); }}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card title="Existing Business Rules">
        {loading ? (
          <div style={{textAlign:'center', color:'#64748b'}}>Loading rules...</div>
        ) : rules.length === 0 ? (
          <div style={{textAlign:'center', color:'#64748b'}}>No rules defined yet.</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {rules.map(rule => (
              <div key={rule.id} style={{background:'rgba(255,255,255,0.03)', padding:'12px 15px', borderRadius:'8px', border:'1px solid #334155', display:'flex', flexDirection:'column', gap:'8px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h4 style={{fontSize:'0.95em', color:'#f8fafc'}}>{rule.trigger_keywords}</h4>
                  <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                    <span style={{fontSize:'0.75em', fontWeight:700, color:'#94a3b8'}}>P: {rule.priority}</span>
                    <button onClick={() => handleToggleActive(rule)} style={{background:'none', border:'none', cursor:'pointer', padding:0}}>
                      {rule.active ? <ToggleRight size={24} color="#10b981"/> : <ToggleLeft size={24} color="#ef4444"/>}
                    </button>
                    <button onClick={() => handleEditRule(rule)} className="icon-button"><Pencil size={16}/></button>
                    <button onClick={() => handleDeleteRule(rule.id)} className="icon-button error"><Trash2 size={16}/></button>
                  </div>
                </div>
                <p style={{fontSize:'0.85em', color:'#cbd5e1', lineHeight:'1.5'}}>{rule.response_template}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/appointments`);
      const data = await response.json();
      if (data.status === "success") {
        setAppointments(data.appointments);
      } else {
        setError(data.message || "Failed to fetch appointments.");
      }
    } catch (err) {
      setError("Network error fetching appointments.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <Title title="Appointments" sub="Manage your scheduled meetings and calls"/>

      {loading && <Card><p>Loading appointments...</p></Card>}
      {error && <Card><p className="error-message">Error: {error}</p></Card>}
      {!loading && appointments.length === 0 && <Card><p>No appointments found.</p></Card>}

      {!loading && appointments.length > 0 && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px'}}>
          {appointments.map(app => (
            <Card key={app.id}>
              <h4 style={{fontSize: '1.1em', marginBottom: '10px', color: '#f8fafc'}}>{app.title}</h4>
              <p style={{fontSize: '0.9em', color: '#cbd5e1', marginBottom: '5px'}}><Calendar size={14} style={{marginRight: '5px'}}/> {new Date(app.start_time).toLocaleString()} - {new Date(app.end_time).toLocaleTimeString()}</p>
              <p style={{fontSize: '0.9em', color: '#cbd5e1', marginBottom: '5px'}}><UserRound size={14} style={{marginRight: '5px'}}/> {app.customer_name || 'N/A'}</p>
              <p style={{fontSize: '0.9em', color: '#cbd5e1', marginBottom: '10px'}}><Link size={14} style={{marginRight: '5px'}}/> <a href={app.meet_link} target="_blank" rel="noopener noreferrer" style={{color: '#60a5fa'}}>Join Meeting</a></p>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '15px'}}>
                <button className="button-secondary" onClick={() => alert('Edit functionality coming soon!')}>Edit</button>
                <button className="button-secondary error" onClick={() => alert('Cancel functionality coming soon!')}>Cancel</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function Customer360() {
  const [customers, setCustomers] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchCustomers(''); }, []);

  const fetchCustomers = async (q) => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(q)}&limit=50`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) { setCustomers([]); }
    setLoadingList(false);
  };

  const loadProfile = async (sid) => {
    setSelectedId(sid);
    setProfile(null);
    setShowHistory(false);
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/customer/${encodeURIComponent(sid)}`);
      const data = await res.json();
      setProfile(data);
    } catch (e) { setProfile({ status: 'error', message: 'Failed to load profile' }); }
    setLoadingProfile(false);
  };

  const handleSearch = (e) => { e.preventDefault(); fetchCustomers(searchQ); };
  const temp = profile?.lead?.temperature;
  const tempColor = TEMP_COLORS_360[temp] || '#64748b';

  return (
    <section>
      <Title title="Customer 360°" sub="Complete profile, conversation history, and AI-generated insights for every customer"/>
      <div style={{display:'grid', gridTemplateColumns:'300px 1fr', gap:'16px', minHeight:'600px'}}>

        {/* Left: Customer list */}
        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          <Card>
            <form onSubmit={handleSearch} style={{display:'flex', gap:'8px'}}>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by name..." style={{flex:1, fontSize:'0.88em'}}/>
              <button type="submit" style={{padding:'6px 14px', fontSize:'0.85em'}}>Search</button>
            </form>
            <div style={{fontSize:'0.75em', color:'#94a3b8', marginTop:'6px'}}>{customers.length} customers</div>
          </Card>
          <div style={{overflowY:'auto', maxHeight:'560px', display:'flex', flexDirection:'column', gap:'6px'}}>
            {loadingList ? (
              <div style={{textAlign:'center', padding:'30px', color:'#94a3b8', fontSize:'0.88em'}}>Loading...</div>
            ) : customers.length === 0 ? (
              <div style={{textAlign:'center', padding:'30px', color:'#94a3b8', fontSize:'0.88em'}}>No customers found.</div>
            ) : customers.map(c => {
              const isSelected = selectedId === c.sender_id;
              const tc = TEMP_COLORS_360[c.temperature] || '#64748b';
              return (
                <div key={c.sender_id} onClick={() => loadProfile(c.sender_id)}
                  style={{padding:'10px 12px', background: isSelected ? '#eff6ff' : '#fff', border:`1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`, borderRadius:'8px', cursor:'pointer', transition:'all 0.15s'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <div style={{position:'relative'}}>
                        <div style={{width:'32px', height:'32px', borderRadius:'8px', background: isSelected ? '#3b82f6' : '#e2e8f0', color: isSelected ? '#fff' : '#475569', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85em', fontWeight:700, flexShrink:0}}>
                          {(c.name || c.sender_id || '?')[0].toUpperCase()}
                        </div>
                        <div style={{position:'absolute', bottom:'-4px', right:'-4px', width:'14px', height:'14px', borderRadius:'50%', background:'white', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center'}}>
                          {c.primary_channel === 'whatsapp' ? 
                            <Phone size={8} fill="#25d366" stroke="#25d366"/> : 
                            <Image size={8} color="#e1306c"/>
                          }
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:'0.85em', fontWeight:600, color:'#1e293b'}}>{c.name || c.instagram_username || `User ${String(c.sender_id).slice(-4)}`}</div>
                        <div style={{fontSize:'0.72em', color:'#94a3b8'}}>{c.interested_in || c.location || 'No details yet'}</div>
                      </div>
                    </div>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background: tc, flexShrink:0}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Profile panel */}
        {!selectedId ? (
          <Card>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'400px', gap:'12px', color:'#94a3b8'}}>
              <div style={{fontSize:'3em'}}>👤</div>
              <div style={{fontSize:'1em', fontWeight:600, color:'#475569'}}>Select a customer</div>
              <div style={{fontSize:'0.85em', textAlign:'center', maxWidth:'280px'}}>Click any customer on the left to see their full 360° profile, conversation history, and AI-generated insights.</div>
            </div>
          </Card>
        ) : loadingProfile ? (
          <Card><div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'300px', color:'#94a3b8'}}>Loading profile...</div></Card>
        ) : profile?.status === 'error' ? (
          <Card><div style={{padding:'20px', color:'#ef4444'}}>Error: {profile.message}</div></Card>
        ) : profile ? (
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>

            {/* Header */}
            <Card>
              <div style={{display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap'}}>
                <div style={{width:'56px', height:'56px', borderRadius:'50%', background:'#3b82f6', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4em', fontWeight:700, flexShrink:0}}>
                  {(profile.display_name || '?')[0].toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <div style={{fontSize:'1.2em', fontWeight:700, color:'#1e293b'}}>{profile.display_name}</div>
                    <div style={{display:'flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'12px', background: profile.identity?.source === 'whatsapp' ? '#f0fdf4' : '#fdf2f8', border: `1px solid ${profile.identity?.source === 'whatsapp' ? '#dcfce7' : '#fce7f3'}`}}>
                      {profile.identity?.source === 'whatsapp' ? 
                        <><Phone size={10} fill="#25d366" stroke="#25d366"/><span style={{fontSize:10, fontWeight:700, color:'#15803d'}}>WhatsApp</span></> : 
                        <><Image size={10} color="#e1306c"/><span style={{fontSize:10, fontWeight:700, color:'#be185d'}}>Instagram</span></>
                      }
                    </div>
                  </div>
                  {profile.instagram_username && (
                    <div style={{fontSize:'0.82em', color:'#64748b', marginTop:'2px'}}>@{profile.instagram_username}</div>
                  )}
                </div>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                  {temp && (
                    <span style={{padding:'4px 12px', borderRadius:'20px', background:`${tempColor}18`, color:tempColor, fontWeight:700, fontSize:'0.8em', border:`1px solid ${tempColor}40`}}>
                      {temp === 'hot' ? '🔥' : temp === 'warm' ? '⭐' : '❄️'} {temp.charAt(0).toUpperCase() + temp.slice(1)} Lead
                    </span>
                  )}
                  {profile.lead?.is_qualified && <span style={{padding:'4px 12px', borderRadius:'20px', background:'#f0fdf4', color:'#14532d', fontWeight:700, fontSize:'0.8em', border:'1px solid #86efac'}}>✅ Qualified</span>}
                  {profile.conversation?.needs_human && <span style={{padding:'4px 12px', borderRadius:'20px', background:'#fef2f2', color:'#991b1b', fontWeight:700, fontSize:'0.8em', border:'1px solid #fca5a5'}}>🚨 Needs Human</span>}
                </div>
              </div>
            </Card>

            {/* 3-col grid */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px'}}>
              <Card title="Identity">
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {[["Name", profile.identity?.name], ["Phone", profile.identity?.phone], ["Email", profile.identity?.email], ["Location", profile.identity?.location], ["Education", profile.identity?.education], ["Experience", profile.identity?.experience], ["Source", profile.identity?.source]].map(([k,v]) => v ? (
                    <div key={k}>
                      <div style={{fontSize:'0.7em', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color:'#1e293b', fontWeight:500, marginTop:'1px'}}>{v}</div>
                    </div>
                  ) : null)}
                </div>
              </Card>
              <Card title="Lead Data">
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {[["Interested In", profile.lead?.interested_in], ["Mode", profile.lead?.mode], ["Lead Stage", profile.lead?.lead_stage], ["Status", profile.lead?.status], ["Lead Score", profile.lead?.lead_score], ["Notes", profile.lead?.notes]].map(([k,v]) => v ? (
                    <div key={k}>
                      <div style={{fontSize:'0.7em', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color:'#1e293b', fontWeight:500, marginTop:'1px'}}>{String(v)}</div>
                    </div>
                  ) : null)}
                </div>
              </Card>
              <Card title="Conversation">
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {[["Messages", profile.conversation?.message_count], ["State", profile.conversation?.conversation_state], ["Last Message", profile.conversation?.last_message], ["Last Active", profile.conversation?.last_active ? new Date(profile.conversation.last_active).toLocaleDateString() : null]].map(([k,v]) => v ? (
                    <div key={k}>
                      <div style={{fontSize:'0.7em', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color:'#1e293b', fontWeight:500, marginTop:'1px', wordBreak:'break-word'}}>{String(v)}</div>
                    </div>
                  ) : null)}
                  {profile.conversation?.ai_summary && (
                    <div>
                      <div style={{fontSize:'0.7em', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>AI Summary</div>
                      <div style={{fontSize:'0.82em', color:'#475569', marginTop:'2px', fontStyle:'italic', lineHeight:'1.5'}}>{profile.conversation.ai_summary}</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* AI Profile */}
            {profile.ai_profile && !profile.ai_profile.error && (
              <Card title="🧠 AI Customer Profile">
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                  <div style={{gridColumn:'1/-1', padding:'12px 14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.88em', color:'#1e293b', fontStyle:'italic', lineHeight:'1.6'}}>
                    "{profile.ai_profile.one_liner}"
                  </div>
                  {[["Interest", profile.ai_profile.interest], ["Intent", profile.ai_profile.intent], ["Journey Stage", profile.ai_profile.stage], ["Contact Shared", profile.ai_profile.contact_info_shared]].map(([k,v]) => v ? (
                    <div key={k} style={{padding:'8px 10px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px'}}>
                      <div style={{fontSize:'0.7em', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'3px'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color:'#1e293b', fontWeight:600}}>{v}</div>
                    </div>
                  ) : null)}
                  <div style={{padding:'8px 10px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px'}}>
                    <div style={{fontSize:'0.7em', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'3px'}}>Sentiment</div>
                    <div style={{fontSize:'0.85em', fontWeight:700, color: SENTIMENT_COLORS[profile.ai_profile.sentiment] || '#64748b'}}>{profile.ai_profile.sentiment}</div>
                  </div>
                  <div style={{padding:'8px 10px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px'}}>
                    <div style={{fontSize:'0.7em', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'3px'}}>Urgency</div>
                    <div style={{fontSize:'0.85em', fontWeight:700, color: URGENCY_COLORS[profile.ai_profile.urgency] || '#64748b'}}>{profile.ai_profile.urgency}</div>
                  </div>
                  {profile.ai_profile.key_facts?.length > 0 && (
                    <div style={{gridColumn:'1/-1', padding:'10px 12px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'8px'}}>
                      <div style={{fontSize:'0.7em', color:'#92400e', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'6px'}}>Key Facts</div>
                      {profile.ai_profile.key_facts.map((f,i) => (
                        <div key={i} style={{fontSize:'0.84em', color:'#78350f', marginBottom:'3px', display:'flex', gap:'6px'}}>
                          <span style={{color:'#f59e0b', flexShrink:0}}>•</span><span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {profile.ai_profile.recommended_action && (
                    <div style={{gridColumn:'1/-1', padding:'10px 12px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px'}}>
                      <div style={{fontSize:'0.7em', color:'#14532d', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'4px'}}>Recommended Next Action</div>
                      <div style={{fontSize:'0.88em', color:'#14532d', fontWeight:600}}>{profile.ai_profile.recommended_action}</div>
                    </div>
                  )}
                  {profile.ai_profile.follow_up_message && (
                    <div style={{gridColumn:'1/-1', padding:'10px 12px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px'}}>
                      <div style={{fontSize:'0.7em', color:'#1e40af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'4px'}}>Suggested Follow-up Message</div>
                      <div style={{fontSize:'0.88em', color:'#1e3a8a', fontStyle:'italic', lineHeight:'1.5'}}>
                        "{profile.ai_profile.follow_up_message}"
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Timeline */}
            {profile.timeline?.length > 0 && (
              <Card title="Timeline">
                <div style={{display:'flex', flexDirection:'column', gap:'0'}}>
                  {profile.timeline.map((event, i) => (
                    <div key={i} style={{display:'flex', gap:'12px', paddingBottom: i < profile.timeline.length - 1 ? '16px' : '0'}}>
                      <div style={{display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0}}>
                        <div style={{width:'28px', height:'28px', borderRadius:'50%', background:'#eff6ff', border:'2px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85em'}}>
                          {TIMELINE_ICONS[event.type] || '📌'}
                        </div>
                        {i < profile.timeline.length - 1 && <div style={{width:'2px', flex:1, background:'#e2e8f0', marginTop:'4px'}}/>}
                      </div>
                      <div style={{paddingTop:'4px'}}>
                        <div style={{fontSize:'0.85em', fontWeight:700, color:'#1e293b'}}>{event.event}</div>
                        <div style={{fontSize:'0.78em', color:'#64748b', marginTop:'1px'}}>{event.description}</div>
                        {event.timestamp && <div style={{fontSize:'0.72em', color:'#94a3b8', marginTop:'2px'}}>{new Date(event.timestamp).toLocaleString()}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Conversation history */}
            {profile.conversation?.history?.length > 0 && (
              <Card title={`Conversation History (${profile.conversation.history.length} exchanges)`}>
                <button onClick={() => setShowHistory(!showHistory)} style={{marginBottom:'10px', fontSize:'0.82em', padding:'6px 14px'}}>
                  {showHistory ? 'Hide Messages' : 'Show Full Conversation'}
                </button>
                {showHistory && (
                  <div style={{display:'flex', flexDirection:'column', gap:'8px', maxHeight:'400px', overflowY:'auto'}}>
                    {profile.conversation.history.map((item, i) => (
                      <div key={i}>
                        {item.user && (
                          <div style={{display:'flex', justifyContent:'flex-start', marginBottom:'4px'}}>
                            <div style={{maxWidth:'75%', padding:'8px 12px', background:'#f1f5f9', borderRadius:'12px 12px 12px 2px', fontSize:'0.84em', color:'#1e293b', lineHeight:'1.5'}}>
                              <div style={{fontSize:'0.7em', color:'#64748b', fontWeight:700, marginBottom:'3px'}}>Customer</div>
                              {item.user}
                            </div>
                          </div>
                        )}
                        {item.assistant && (
                          <div style={{display:'flex', justifyContent:'flex-end'}}>
                            <div style={{maxWidth:'75%', padding:'8px 12px', background:'#dbeafe', borderRadius:'12px 12px 2px 12px', fontSize:'0.84em', color:'#1e3a8a', lineHeight:'1.5'}}>
                              <div style={{fontSize:'0.7em', color:'#1e40af', fontWeight:700, marginBottom:'3px'}}>AI Assistant</div>
                              {item.assistant}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )
        : null}
      </div>
    </section>
  );
}

function ReportsPage() {
  return (
    <section>
      <Title title="Reports" sub="Detailed analytics and insights"/>
      <Card>
        <p>Reports functionality coming soon.</p>
      </Card>
    </section>
  );
}

function AutomationPage() {
  return (
    <section>
      <Title title="Automation" sub="Automate your workflows"/>
      <Card>
        <p>Automation functionality coming soon.</p>
      </Card>
    </section>
  );
}

function PublisherPage() {
  return (
    <section>
      <Title title="Publisher" sub="Publish content across channels"/>
      <Card>
        <p>Publisher functionality coming soon.</p>
      </Card>
    </section>
  );
}

function GoogleReviewsPage() {
  return (
    <section>
      <Title title="Google Reviews" sub="Manage your Google Business reviews"/>
      <Card>
        <p>Google Reviews functionality coming soon.</p>
      </Card>
    </section>
  );
}

function BusinessesPage() {
  return (
    <section>
      <Title title="Businesses" sub="Manage your business profiles"/>
      <Card>
        <p>Businesses functionality coming soon.</p>
      </Card>
    </section>
  );
}

function IntegrationsPage() {
  return (
    <section>
      <Title title="Integrations" sub="Connect with your favorite tools"/>
      <Card>
        <p>Integrations functionality coming soon.</p>
      </Card>
    </section>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [aiTone, setAiTone] = useState('');
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('17:00');
  const [workingDays, setWorkingDays] = useState({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false });
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      if (data.status === 'success') {
        setSettings(data.settings);
        setBusinessName(data.settings.business_name || '');
        setBusinessDescription(data.settings.business_description || '');
        setAiTone(data.settings.ai_tone || '');
        setWorkingHoursStart(data.settings.working_hours_start || '09:00');
        setWorkingHoursEnd(data.settings.working_hours_end || '17:00');
        setWorkingDays(data.settings.working_days || { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false });
        setAutoReplyEnabled(data.settings.auto_reply_enabled || false);
        setOutOfHoursMessage(data.settings.out_of_hours_message || '');
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
    setLoading(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          business_description: businessDescription,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert('Business profile updated successfully!');
        fetchSettings();
      } else {
        alert(`Failed to update profile: ${data.message}`);
      }
    } catch (e) {
      alert('Network error updating profile.');
    }
  };

  const handleSaveAIBehaviour = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_tone: aiTone,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert('AI behaviour settings updated successfully!');
        fetchSettings();
      } else {
        alert(`Failed to update AI behaviour: ${data.message}`);
      }
    } catch (e) {
      alert('Network error updating AI behaviour.');
    }
  };

  const handleSaveWorkingHours = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          working_hours_start: workingHoursStart,
          working_hours_end: workingHoursEnd,
          working_days: workingDays,
          auto_reply_enabled: autoReplyEnabled,
          out_of_hours_message: outOfHoursMessage,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert('Working hours settings updated successfully!');
        fetchSettings();
      } else {
        alert(`Failed to update working hours: ${data.message}`);
      }
    } catch (e) {
      alert('Network error updating working hours.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return <Card><p>Loading settings...</p></Card>;
    }

    switch (activeTab) {
      case 'profile':
        return (
          <Card title="Business Profile">
            <form onSubmit={handleSaveProfile} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <div>
                <label className="form-label">Business Name</label>
                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="input-field" required/>
              </div>
              <div>
                <label className="form-label">Business Description</label>
                <textarea value={businessDescription} onChange={e => setBusinessDescription(e.target.value)} className="input-field" rows="4"/>
              </div>
              <button type="submit" className="button-primary"><Save size={16}/> Save Profile</button>
            </form>
          </Card>
        );
      case 'ai-behaviour':
        return (
          <Card title="AI Behaviour">
            <form onSubmit={handleSaveAIBehaviour} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <div>
                <label className="form-label">AI Tone</label>
                <select value={aiTone} onChange={e => setAiTone(e.target.value)} className="input-field">
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
              <button type="submit" className="button-primary"><Save size={16}/> Save AI Behaviour</button>
            </form>
          </Card>
        );
      case 'working-hours':
        return (
          <Card title="Working Hours & Auto-Reply">
            <form onSubmit={handleSaveWorkingHours} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <div style={{display:'flex', gap:'15px'}}>
                <div style={{flex:1}}>
                  <label className="form-label">Start Time</label>
                  <input type="time" value={workingHoursStart} onChange={e => setWorkingHoursStart(e.target.value)} className="input-field" required/>
                </div>
                <div style={{flex:1}}>
                  <label className="form-label">End Time</label>
                  <input type="time" value={workingHoursEnd} onChange={e => setWorkingHoursEnd(e.target.value)} className="input-field" required/>
                </div>
              </div>
              <div>
                <label className="form-label">Working Days</label>
                <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                  {Object.keys(workingDays).map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setWorkingDays(prev => ({ ...prev, [day]: !prev[day] }))}
                      style={{
                        padding:'8px 12px', borderRadius:'8px', border:`1px solid ${workingDays[day] ? '#10b981' : '#334155'}`,
                        background: workingDays[day] ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                        color: workingDays[day] ? '#10b981' : '#cbd5e1',
                        fontWeight:600,
                        fontSize:'0.85em',
                        cursor:'pointer',
                      }}
                    >
                      {day.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <input
                  type="checkbox"
                  id="auto-reply-toggle"
                  checked={autoReplyEnabled}
                  onChange={e => setAutoReplyEnabled(e.target.checked)}
                  style={{width:'auto'}}
                />
                <label htmlFor="auto-reply-toggle" className="form-label" style={{marginBottom:0}}>Enable Out-of-Hours Auto-Reply</label>
              </div>
              {autoReplyEnabled && (
                <div>
                  <label className="form-label">Out-of-Hours Message</label>
                  <textarea value={outOfHoursMessage} onChange={e => setOutOfHoursMessage(e.target.value)} className="input-field" rows="3" placeholder="e.g., Thanks for your message! We're currently closed but will get back to you during business hours."/>
                </div>
              )}
              <button type="submit" className="button-primary"><Save size={16}/> Save Working Hours</button>
            </form>
          </Card>
        );
      case 'system-info':
        return (
          <Card title="System Information">
            <div style={{fontSize:'0.9em', lineHeight:'1.6'}}>
              <p style={{marginBottom:'10px'}}>API Base: <code style={{background:'rgba(255,255,255,0.1)', padding:'3px 6px', borderRadius:'4px'}}>{API_BASE}</code></p>
              <p style={{marginBottom:'10px'}}>Active Business ID: <code style={{background:'rgba(255,255,255,0.1)', padding:'3px 6px', borderRadius:'4px'}}>{activeBusiness?.id || 'N/A'}</code></p>
              <p style={{marginBottom:'10px'}}>Active Business Name: <code style={{background:'rgba(255,255,255,0.1)', padding:'3px 6px', borderRadius:'4px'}}>{activeBusiness?.name || 'N/A'}</code></p>
              <p style={{marginBottom:'10px'}}>Current Time: <code style={{background:'rgba(255,255,255,0.1)', padding:'3px 6px', borderRadius:'4px'}}>{new Date().toLocaleString()}</code></p>
              <p style={{marginBottom:'10px'}}>Frontend Version: <code style={{background:'rgba(255,255,255,0.1)', padding:'3px 6px', borderRadius:'4px'}}>1.0.0</code></p>
              <p>Backend Version: <code style={{background:'rgba(255,255,255,0.1)', padding:'3px 6px', borderRadius:'4px'}}>1.0.0</code></p>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <section>
      <Title title="Settings" sub="Manage your business settings and AI behavior"/>
      <div style={{display:'flex', gap:'15px', marginBottom:'20px', borderBottom:'1px solid #334155'}}>
        <button onClick={() => setActiveTab('profile')} className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}>Business Profile</button>
        <button onClick={() => setActiveTab('ai-behaviour')} className={`tab-button ${activeTab === 'ai-behaviour' ? 'active' : ''}`}>AI Behaviour</button>
        <button onClick={() => setActiveTab('working-hours')} className={`tab-button ${activeTab === 'working-hours' ? 'active' : ''}`}>Working Hours</button>
        <button onClick={() => setActiveTab('system-info')} className={`tab-button ${activeTab === 'system-info' ? 'active' : ''}`}>System Info</button>
      </div>
      {renderContent()}
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
