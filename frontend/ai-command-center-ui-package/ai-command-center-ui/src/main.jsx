import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, HelpCircle, Search, Settings, LayoutDashboard, MessagesSquare, Users, Bug, Bot, Brain, UserRound, BarChart3, Workflow, Plus, Download, Filter, Play, X, Phone, MapPin, BookOpen, Star, Clock, ChevronRight, ToggleLeft, ToggleRight, Pencil, Trash2, Tag, Zap, Save, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import './styles.css';

const API_BASE = "https://sap-guru-assistant.onrender.com";

const nav = [
  ['Overview', LayoutDashboard], ['Conversations', MessagesSquare], ['Leads', Users], ['Pipeline Debugger', Bug],
  ['AI Playground', Bot], ['Business Brain', Brain], ['Customer 360°', UserRound], ['Reports', BarChart3], ['Automation', Workflow], ['Settings', Settings]
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

function App() {
  const [page, setPage] = useState("Overview");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard-data`)
      .then(res => res.json())
      .then(data => {
        console.log("Dashboard Data:", data);
        setDashboard(data);
      })
      .catch(err => console.error("Dashboard fetch error:", err));
  }, []);

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage}/>
      <main>
        <Topbar/>
        <Screen page={page} dashboard={dashboard}/>
      </main>
    </div>
  );
}

function Sidebar({page,setPage}) {
  return (
    <aside>
      <div className="brand"><div className="logo">AI</div><b>AI COMMAND CENTER</b></div>
      <nav>
        {nav.map(([n,Icon])=>
          <button key={n} onClick={()=>setPage(n)} className={page===n?'active':''}>
            <Icon size={17}/>{n}
          </button>
        )}
      </nav>
      <div className="profile"><div className="avatar">A</div><span><b>Aslam</b><small>Administrator</small></span></div>
    </aside>
  );
}

function Topbar() {
  return (
    <header>
      <div className="search"><Search size={16}/><input placeholder="Search anything..."/></div>
      <Bell size={18}/><HelpCircle size={18}/><div className="avatar small">A</div>
    </header>
  );
}

function Screen({page, dashboard}) {
  return (
    <>
      {page==='Overview'&&<Overview dashboard={dashboard}/>}
      {page==='Conversations'&&<Conversations dashboard={dashboard}/>}
      {page==='Leads'&&<Leads/>}
      {page==='Pipeline Debugger'&&<Debugger/>}
      {page==='AI Playground'&&<Playground/>}
      {page==='Business Brain'&&<BusinessBrain/>}
      {page==='Customer 360°'&&<Customer360/>}
      {page==='Reports'&&<Reports dashboard={dashboard}/>}
      {page==='Automation'&&<Automation/>}
      {page==='Settings'&&<SettingsPage/>}
    </>
  );
}

function Title({title,sub,action}) {
  return <div className="title"><div><h1>{title}</h1><p>{sub}</p></div>{action}</div>;
}

function Stat({label,value,change}) {
  return <div className="card stat"><p>{label}</p><h2>{value}</h2><span>{change}</span><small>live data</small></div>;
}

function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchOverview = () => {
    setLoading(true);
    fetch(`${API_BASE}/overview`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setData(d);
          setLastRefresh(new Date());
        }
      })
      .catch(err => console.error('Overview fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOverview(); }, []);

  const s = data?.stat_cards || {};
  const tempBreakdown = data?.temperature_breakdown || [];
  const moduleBreakdown = data?.module_breakdown || [];
  const activityChart = data?.activity_chart || [];
  const recentLeads = data?.recent_leads || [];
  const needsHumanList = data?.needs_human_list || [];

  // % change for new leads today vs yesterday
  const todayChange = s.new_leads_yesterday > 0
    ? Math.round(((s.new_leads_today - s.new_leads_yesterday) / s.new_leads_yesterday) * 100)
    : null;

  const TEMP_COLORS = { Hot: '#ef4444', Warm: '#f59e0b', Cold: '#3b82f6' };
  const STAGE_LABELS_OV = { new: 'New', qualified: 'Qualified', phone_pending: 'Phone Pending', name_pending: 'Name Pending', lead_collection: 'In Progress' };

  return (
    <section>
      <Title
        title="Dashboard Overview"
        sub={lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : 'Loading live data...'}
        action={
          <button onClick={fetchOverview} disabled={loading} className="ghost">
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        }
      />

      {/* Row 1 — Primary stat cards */}
      <div className="grid4">
        <div className="card stat">
          <p>Total Leads</p>
          <h2>{loading ? '...' : s.total_leads ?? 0}</h2>
          <span style={{color:'#f59e0b'}}>{s.hot_leads ?? 0} hot · {s.warm_leads ?? 0} warm</span>
          <small>all time</small>
        </div>
        <div className="card stat">
          <p>New Today</p>
          <h2>{loading ? '...' : s.new_leads_today ?? 0}</h2>
          <span style={{color: todayChange >= 0 ? '#10b981' : '#ef4444'}}>
            {todayChange !== null ? `${todayChange >= 0 ? '+' : ''}${todayChange}% vs yesterday` : 'vs yesterday'}
          </span>
          <small>leads created today</small>
        </div>
        <div className="card stat">
          <p>Qualified Leads</p>
          <h2>{loading ? '...' : s.qualified_leads ?? 0}</h2>
          <span style={{color:'#10b981'}}>of {s.total_leads ?? 0} total</span>
          <small>manually qualified</small>
        </div>
        <div className="card stat">
          <p>Needs Human</p>
          <h2 style={{color: (s.needs_human ?? 0) > 0 ? '#ef4444' : 'inherit'}}>{loading ? '...' : s.needs_human ?? 0}</h2>
          <span style={{color: (s.needs_human ?? 0) > 0 ? '#ef4444' : '#64748b'}}>waiting for you</span>
          <small>manual review required</small>
        </div>
      </div>

      {/* Row 2 — Secondary stat cards */}
      <div className="grid4" style={{marginTop:'12px'}}>
        <div className="card stat">
          <p>Total Conversations</p>
          <h2>{loading ? '...' : s.total_conversations ?? 0}</h2>
          <span>all Instagram DMs</span>
          <small>all time</small>
        </div>
        <div className="card stat">
          <p>Hot Leads</p>
          <h2 style={{color:'#ef4444'}}>{loading ? '...' : s.hot_leads ?? 0}</h2>
          <span style={{color:'#ef4444'}}>phone + email captured</span>
          <small>highest priority</small>
        </div>
        <div className="card stat">
          <p>With Phone</p>
          <h2>{loading ? '...' : s.leads_with_phone ?? 0}</h2>
          <span>contactable leads</span>
          <small>have phone number</small>
        </div>
        <div className="card stat">
          <p>With Email</p>
          <h2>{loading ? '...' : s.leads_with_email ?? 0}</h2>
          <span>email captured</span>
          <small>have email address</small>
        </div>
      </div>

      {/* Row 3 — Charts */}
      <div className="grid2" style={{marginTop:'20px'}}>
        {/* 7-day activity chart */}
        <Card title="7-Day Activity">
          {activityChart.length > 0 ? (
            <ResponsiveContainer height={220}>
              <BarChart data={activityChart} margin={{top:5, right:10, left:-20, bottom:0}}>
                <XAxis dataKey="day" tick={{fontSize:12, fill:'#64748b'}}/>
                <YAxis tick={{fontSize:11, fill:'#64748b'}}/>
                <Tooltip
                  contentStyle={{background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', fontSize:'0.82em'}}
                  labelStyle={{color:'#e2e8f0'}}
                />
                <Bar dataKey="leads" name="New Leads" fill="#2563eb" radius={[4,4,0,0]}/>
                <Bar dataKey="conversations" name="Conversations" fill="#8b5cf6" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{height:'220px', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569'}}>Loading chart data...</div>
          )}
          <div style={{display:'flex', gap:'16px', marginTop:'8px', fontSize:'0.78em', color:'#64748b'}}>
            <span><i style={{display:'inline-block', width:'10px', height:'10px', borderRadius:'2px', background:'#2563eb', marginRight:'5px'}}/> New Leads</span>
            <span><i style={{display:'inline-block', width:'10px', height:'10px', borderRadius:'2px', background:'#8b5cf6', marginRight:'5px'}}/> Conversations</span>
          </div>
        </Card>

        {/* Temperature breakdown pie */}
        <Card title="Lead Temperature">
          {tempBreakdown.length > 0 ? (
            <div className="pie">
              <ResponsiveContainer height={200}>
                <PieChart>
                  <Pie data={tempBreakdown} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {tempBreakdown.map((entry, i) => (
                      <Cell key={i} fill={TEMP_COLORS[entry.label] || colors[i]}/>
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', fontSize:'0.82em'}}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div>
                {tempBreakdown.map((d, i) => (
                  <p key={d.label}>
                    <i style={{background: TEMP_COLORS[d.label] || colors[i]}}/>
                    {d.label} <b>{d.value}</b>
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div style={{height:'200px', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569'}}>Loading...</div>
          )}
        </Card>
      </div>

      {/* Row 4 — Module breakdown + Needs Human */}
      <div className="grid2" style={{marginTop:'20px'}}>
        {/* Top modules */}
        <Card title="Top Interested Modules">
          {moduleBreakdown.length > 0 ? (
            <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'4px'}}>
              {moduleBreakdown.map((mod, i) => {
                const maxVal = moduleBreakdown[0]?.value || 1;
                const pct = Math.round((mod.value / maxVal) * 100);
                return (
                  <div key={i}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.83em', marginBottom:'4px'}}>
                      <span style={{color:'#e2e8f0'}}>{mod.label}</span>
                      <span style={{color:'#64748b'}}>{mod.value} leads</span>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.06)', borderRadius:'4px', height:'6px'}}>
                      <div style={{width:`${pct}%`, height:'6px', borderRadius:'4px', background: colors[i % colors.length]}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{padding:'20px', textAlign:'center', color:'#475569', fontSize:'0.85em'}}>No module data yet</div>
          )}
        </Card>

        {/* Needs Human list */}
        <Card title={`Needs Human Review ${needsHumanList.length > 0 ? `(${needsHumanList.length})` : ''}`}>
          {needsHumanList.length > 0 ? (
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {needsHumanList.map((item, i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', background:'rgba(239,68,68,0.06)', borderRadius:'8px', borderLeft:'3px solid #ef4444'}}>
                  <div>
                    <div style={{fontSize:'0.88em', color:'#e2e8f0', fontWeight:600}}>{item.name}</div>
                    <div style={{fontSize:'0.75em', color:'#64748b', marginTop:'2px'}}>
                      {item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}
                    </div>
                  </div>
                  <Badge text="Review" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{padding:'20px', textAlign:'center', color:'#10b981', fontSize:'0.85em'}}>
              ✓ All conversations handled — no manual review needed
            </div>
          )}
        </Card>
      </div>

      {/* Row 5 — Recent Leads */}
      <div style={{marginTop:'20px'}}>
        <Card title="Recent Leads">
          {recentLeads.length > 0 ? (
            <Table
              heads={['Name', 'Module', 'Phone', 'Temperature', 'Stage', 'Last Active']}
              rows={recentLeads.map(lead => [
                <Name name={lead.name}/>,
                lead.interested_module || <span style={{color:'#475569'}}>—</span>,
                lead.phone || <span style={{color:'#475569'}}>—</span>,
                <LeadTemperatureDot temp={lead.temperature}/>,
                <Badge text={STAGE_LABELS_OV[lead.lead_stage] || lead.lead_stage || 'New'}/>,
                lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '—',
              ])}
            />
          ) : (
            <div style={{padding:'20px', textAlign:'center', color:'#475569'}}>Loading recent leads...</div>
          )}
        </Card>
      </div>
    </section>
  );
}

const CONV_FILTER_LABELS = {
  all: 'All',
  needs_human: 'Needs Human',
  pending_reply: 'Pending Reply',
  ai_replied: 'AI Replied',
  manual_replied: 'Manual Replied',
};

const CONV_STATE_COLORS = {
  needs_human: '#ef4444',
  pending_reply: '#f59e0b',
  ai_replied: '#10b981',
  manual_replied: '#2563eb',
  lead_collection: '#8b5cf6',
  replied: '#10b981',
};

function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState(null);
  const [fullConv, setFullConv] = useState(null);
  const [fullLoading, setFullLoading] = useState(false);

  const fetchConversations = (f = filter, s = search) => {
    setLoading(true);
    const params = new URLSearchParams({ filter: f, limit: '100' });
    if (s) params.set('search', s);
    fetch(`${API_BASE}/conversations?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setConversations(data.conversations || []);
          setTotal(data.total || 0);
        }
      })
      .catch(err => console.error('Conversations fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchConversations(); }, []);

  const handleFilterChange = (f) => {
    setFilter(f);
    setSelected(null);
    setFullConv(null);
    fetchConversations(f, search);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchConversations(filter, searchInput);
  };

  const handleSelectConversation = (conv) => {
    setSelected(conv);
    setFullConv(null);
    setFullLoading(true);
    fetch(`${API_BASE}/conversation/${conv.sender_id}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setFullConv(data.conversation);
        }
      })
      .catch(err => console.error('Full conv error:', err))
      .finally(() => setFullLoading(false));
  };

  const FILTER_KEYS = ['all', 'needs_human', 'pending_reply', 'ai_replied', 'manual_replied'];

  return (
    <section>
      <Title
        title="Conversations"
        sub={loading ? 'Loading...' : `${total} conversations`}
        action={
          <div style={{display:'flex', gap:'8px'}}>
            <button className="ghost" onClick={() => fetchConversations()}>↻ Refresh</button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div style={{display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap'}}>
        {FILTER_KEYS.map(f => (
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
            {CONV_FILTER_LABELS[f]}
            {f === 'needs_human' && conversations.filter(c => c.needs_human).length > 0 && filter !== 'needs_human' && (
              <span style={{marginLeft:'6px', background:'#ef4444', color:'#fff', borderRadius:'10px', padding:'1px 6px', fontSize:'0.75em'}}>
                {conversations.filter(c => c.needs_human).length}
              </span>
            )}
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
          <button type="button" className="outline" onClick={() => { setSearchInput(''); setSearch(''); fetchConversations(filter, ''); }}>
            Clear
          </button>
        )}
      </form>

      {/* Main layout */}
      <div style={{display:'grid', gridTemplateColumns: selected ? '1fr 1.1fr' : '1fr', gap:'16px', alignItems:'start'}}>

        {/* Inbox list */}
        <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
          {loading ? (
            <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>No conversations found.</div>
          ) : conversations.map((conv, i) => {
            const isSelected = selected?.sender_id === conv.sender_id;
            const stateColor = conv.needs_human ? '#ef4444' : (CONV_STATE_COLORS[conv.conversation_state] || '#475569');
            const stateLabel = conv.needs_human ? 'Needs Human' : (conv.conversation_state || 'active').replace(/_/g, ' ');
            const lastMsg = conv.last_message || '';
            const isUserLast = conv.last_sender === 'user';

            return (
              <div
                key={i}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  padding:'12px 14px',
                  background: isSelected ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? '#2563eb' : '#1e293b'}`,
                  borderLeft: `3px solid ${isSelected ? '#2563eb' : stateColor}`,
                  borderRadius:'8px',
                  cursor:'pointer',
                  transition:'all 0.15s',
                }}
              >
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'5px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'0.88em', fontWeight:700, flexShrink:0}}>
                      {String(conv.display_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{fontSize:'0.9em', fontWeight:600, color:'#e2e8f0'}}>{conv.display_name}</div>
                      <div style={{fontSize:'0.72em', color:'#475569'}}>
                        <span className="ig" style={{fontSize:'0.85em', marginRight:'4px'}}>IG</span>
                        {conv.message_count || 0} messages
                      </div>
                    </div>
                  </div>
                  <div style={{textAlign:'right', flexShrink:0}}>
                    <div style={{fontSize:'0.72em', color:'#475569', marginBottom:'3px'}}>
                      {conv.updated_at ? new Date(conv.updated_at).toLocaleDateString() : '-'}
                    </div>
                    <span style={{fontSize:'0.72em', padding:'2px 7px', borderRadius:'10px', background:`${stateColor}18`, color:stateColor, fontWeight:600}}>
                      {stateLabel}
                    </span>
                  </div>
                </div>
                <div style={{fontSize:'0.82em', color: isUserLast ? '#94a3b8' : '#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingLeft:'40px'}}>
                  {isUserLast ? '' : <span style={{color:'#8b5cf6', marginRight:'4px'}}>AI:</span>}
                  {String(lastMsg).slice(0, 90) || <span style={{fontStyle:'italic'}}>No messages</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat panel */}
        {selected && (
          <ConversationChatPanel
            conv={selected}
            fullConv={fullConv}
            loading={fullLoading}
            onClose={() => { setSelected(null); setFullConv(null); }}
            onRefresh={() => handleSelectConversation(selected)}
          />
        )}
      </div>
    </section>
  );
}

function ConversationChatPanel({ conv, fullConv, loading, onClose, onRefresh }) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const chatEndRef = React.useRef(null);

  const history = fullConv?.history || [];
  const stateColor = conv.needs_human ? '#ef4444' : (CONV_STATE_COLORS[conv.conversation_state] || '#475569');
  const stateLabel = conv.needs_human ? 'Needs Human' : (conv.conversation_state || 'active').replace(/_/g, ' ');

  // Scroll to bottom when history loads
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history.length]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${API_BASE}/conversation/send-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: conv.sender_id, message: replyText.trim() }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSendResult({ ok: true, msg: 'Reply sent successfully' });
        setReplyText('');
        setTimeout(() => { onRefresh(); setSendResult(null); }, 1500);
      } else {
        setSendResult({ ok: false, msg: data.message || 'Send failed' });
      }
    } catch (e) {
      setSendResult({ ok: false, msg: 'Network error' });
    }
    setSending(false);
  };

  return (
    <div style={{display:'flex', flexDirection:'column', height:'calc(100vh - 160px)', background:'rgba(255,255,255,0.02)', border:'1px solid #1e293b', borderRadius:'12px', overflow:'hidden'}}>

      {/* Header */}
      <div style={{padding:'14px 16px', borderBottom:'1px solid #1e293b', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700}}>
            {String(conv.display_name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{fontWeight:700, color:'#e2e8f0', fontSize:'0.95em'}}>{conv.display_name}</div>
            <div style={{fontSize:'0.75em', display:'flex', alignItems:'center', gap:'6px'}}>
              <span className="ig" style={{fontSize:'0.85em'}}>IG</span>
              <span style={{color: stateColor, fontWeight:600}}>{stateLabel}</span>
              <span style={{color:'#475569'}}>· {history.length} messages</span>
            </div>
          </div>
        </div>
        <div style={{display:'flex', gap:'8px'}}>
          <button className="ghost" onClick={onRefresh} style={{padding:'4px 10px', fontSize:'0.8em'}}>↻</button>
          <button className="outline" onClick={onClose} style={{padding:'4px 10px', fontSize:'0.8em'}}><X size={13}/></button>
        </div>
      </div>

      {/* Chat history */}
      <div style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'10px'}}>
        {loading ? (
          <div style={{textAlign:'center', color:'#64748b', padding:'40px'}}>Loading messages...</div>
        ) : history.length === 0 ? (
          <div style={{textAlign:'center', color:'#64748b', padding:'40px', fontStyle:'italic'}}>No message history found.</div>
        ) : history.map((item, i) => (
          <React.Fragment key={i}>
            {item.user && (
              <div style={{display:'flex', justifyContent:'flex-start'}}>
                <div style={{
                  maxWidth:'78%', padding:'10px 13px',
                  background:'rgba(255,255,255,0.07)',
                  border:'1px solid #334155',
                  borderRadius:'16px 16px 16px 4px',
                  fontSize:'0.85em', color:'#e2e8f0', lineHeight:'1.5',
                }}>
                  <div style={{fontSize:'0.72em', color:'#64748b', marginBottom:'4px', fontWeight:600}}>Customer</div>
                  {item.user}
                </div>
              </div>
            )}
            {item.assistant && (
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <div style={{
                  maxWidth:'78%', padding:'10px 13px',
                  background:'rgba(37,99,235,0.15)',
                  border:'1px solid rgba(37,99,235,0.3)',
                  borderRadius:'16px 16px 4px 16px',
                  fontSize:'0.85em', color:'#e2e8f0', lineHeight:'1.5',
                }}>
                  <div style={{fontSize:'0.72em', color:'#2563eb', marginBottom:'4px', fontWeight:600}}>AI Assistant</div>
                  {item.assistant}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
        <div ref={chatEndRef}/>
      </div>

      {/* Reply box */}
      <div style={{padding:'12px 14px', borderTop:'1px solid #1e293b', flexShrink:0}}>
        {sendResult && (
          <div style={{marginBottom:'8px', fontSize:'0.8em', color: sendResult.ok ? '#10b981' : '#ef4444', padding:'6px 10px', background: sendResult.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius:'6px'}}>
            {sendResult.msg}
          </div>
        )}
        <div style={{display:'flex', gap:'8px', alignItems:'flex-end'}}>
          <textarea
            placeholder="Type a manual reply and send directly to Instagram..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSendReply(); }}
            style={{flex:1, minHeight:'60px', maxHeight:'120px', resize:'vertical', fontSize:'0.85em'}}
          />
          <button
            onClick={handleSendReply}
            disabled={sending || !replyText.trim()}
            style={{padding:'8px 16px', alignSelf:'flex-end', flexShrink:0}}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div style={{fontSize:'0.72em', color:'#475569', marginTop:'5px'}}>Ctrl+Enter to send · This sends directly to Instagram</div>
      </div>
    </div>
  );
}

// ─── LEADS PAGE (Fully Wired) ─────────────────────────────────────────────────

const LEAD_TEMP_COLORS = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#3b82f6',
  new: '#8b5cf6',
};

const STAGE_LABELS = {
  qualified: 'Qualified',
  lead_information: 'Lead Info',
  phone_pending: 'Phone Pending',
  name_pending: 'Name Pending',
  learning_lead: 'Learning Lead',
  job_inquiry: 'Job Inquiry',
  new: 'New',
};

function LeadTemperatureDot({ temp }) {
  const color = LEAD_TEMP_COLORS[String(temp).toLowerCase()] || '#64748b';
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:'5px'}}>
      <span style={{width:8, height:8, borderRadius:'50%', background:color, display:'inline-block'}}/>
      <span style={{color, fontWeight:600, fontSize:'0.82em', textTransform:'capitalize'}}>{temp || 'Unknown'}</span>
    </span>
  );
}

function Leads() {
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [stageFilter, setStageFilter] = useState('All');

  const tabs = ['All Leads', 'New', 'Warm', 'Hot', 'Qualified', 'Converted'];

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/all-leads`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setAllLeads(data.leads || []);
        } else {
          console.error('Failed to load leads:', data);
        }
      })
      .catch(err => console.error('Leads fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const getLeadName = (lead) =>
    lead.customer_name || lead.instagram_username || lead.name ||
    (lead.sender_id ? `User ${String(lead.sender_id).slice(-4)}` : 'Unknown');

  // Filter by tab (temperature)
  const tabFiltered = allLeads.filter(lead => {
    if (activeTab === 'All Leads') return true;
    if (activeTab === 'Qualified') return lead.lead_stage === 'qualified' || lead.status === 'qualified';
    if (activeTab === 'Converted') return lead.status === 'converted';
    return String(lead.temperature || '').toLowerCase() === activeTab.toLowerCase();
  });

  // Filter by stage dropdown
  const stageFiltered = tabFiltered.filter(lead => {
    if (stageFilter === 'All') return true;
    return lead.lead_stage === stageFilter;
  });

  // Filter by search
  const filtered = stageFiltered.filter(lead => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      getLeadName(lead).toLowerCase().includes(q) ||
      String(lead.phone || '').includes(q) ||
      String(lead.email || '').toLowerCase().includes(q) ||
      String(lead.interested_module || '').toLowerCase().includes(q) ||
      String(lead.location || '').toLowerCase().includes(q)
    );
  });

  // Stats
  const total = allLeads.length;
  const qualified = allLeads.filter(l => l.lead_stage === 'qualified' || l.status === 'qualified').length;
  const hot = allLeads.filter(l => String(l.temperature || '').toLowerCase() === 'hot').length;
  const warm = allLeads.filter(l => String(l.temperature || '').toLowerCase() === 'warm').length;

  const uniqueStages = ['All', ...new Set(allLeads.map(l => l.lead_stage).filter(Boolean))];

  return (
    <section>
      <Title
        title="Leads Management"
        sub="Track and manage all your leads"
        action={<button><Plus size={15}/> Add Lead</button>}
      />

      {/* Stats row */}
      <div className="grid4" style={{marginBottom: '20px'}}>
        <Stat label="Total Leads" value={loading ? '...' : total} change="All captured leads"/>
        <Stat label="Qualified" value={loading ? '...' : qualified} change="Ready for follow-up"/>
        <Stat label="Hot Leads" value={loading ? '...' : hot} change="High intent"/>
        <Stat label="Warm Leads" value={loading ? '...' : warm} change="Engaged"/>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t}
            className={activeTab === t ? 'active' : ''}
            onClick={() => { setActiveTab(t); setSelectedLead(null); }}
          >
            {t}
            <span style={{
              marginLeft: '6px', fontSize: '0.75em', opacity: 0.7,
              background: activeTab === t ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              borderRadius: '10px', padding: '1px 6px'
            }}>
              {t === 'All Leads' ? allLeads.length :
               t === 'Qualified' ? allLeads.filter(l => l.lead_stage === 'qualified' || l.status === 'qualified').length :
               t === 'Converted' ? allLeads.filter(l => l.status === 'converted').length :
               allLeads.filter(l => String(l.temperature || '').toLowerCase() === t.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          {uniqueStages.map(s => (
            <option key={s} value={s}>{s === 'All' ? 'Lead Stage: All' : STAGE_LABELS[s] || s}</option>
          ))}
        </select>
        <div className="search wide">
          <Search size={15}/>
          <input
            placeholder="Search by name, phone or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{background:'none',border:'none',cursor:'pointer',padding:'0 4px'}}>
              <X size={13}/>
            </button>
          )}
        </div>
        <button className="icon"><Filter size={15}/></button>
      </div>

      {/* Main content — table + detail panel */}
      <div style={{display:'grid', gridTemplateColumns: selectedLead ? '1.4fr 1fr' : '1fr', gap:'16px', alignItems:'start'}}>

        {/* Table */}
        <div className="table">
          {loading ? (
            <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Loading leads...</div>
          ) : filtered.length === 0 ? (
            <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>
              {searchQuery ? `No leads found for "${searchQuery}"` : 'No leads in this category yet.'}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Contact</th><th>Location</th>
                  <th>Interested In</th><th>Temperature</th><th>Stage</th>
                  <th>Status</th><th>Updated</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <tr
                    key={lead.id || i}
                    style={{cursor:'pointer', background: selectedLead?.id === lead.id ? 'rgba(37,99,235,0.08)' : ''}}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td><Name name={getLeadName(lead)}/></td>
                    <td>{lead.phone || lead.email || '-'}</td>
                    <td>{lead.location || '-'}</td>
                    <td>{lead.interested_module || '-'}</td>
                    <td><LeadTemperatureDot temp={lead.temperature}/></td>
                    <td><span style={{fontSize:'0.8em', color:'#94a3b8'}}>{STAGE_LABELS[lead.lead_stage] || lead.lead_stage || '-'}</span></td>
                    <td><Badge text={lead.status || 'new'}/></td>
                    <td style={{fontSize:'0.78em', color:'#64748b'}}>{lead.updated_at ? new Date(lead.updated_at).toLocaleString() : '-'}</td>
                    <td><ChevronRight size={14} color="#64748b"/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Lead Detail Panel */}
        {selectedLead && (
          <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} getLeadName={getLeadName}/>
        )}
      </div>
    </section>
  );
}

function LeadDetailPanel({ lead: initialLead, onClose, getLeadName }) {
  const [lead, setLead] = useState(initialLead);
  const [qualifying, setQualifying] = useState(false);
  const [qualifyDone, setQualifyDone] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  // Reset state when a different lead is selected
  useEffect(() => {
    setLead(initialLead);
    setQualifyDone(false);
    setSummary(null);
    setShowSummary(false);
    setSummaryError('');
  }, [initialLead.id]);

  const name = getLeadName(lead);

  const handleQualify = async () => {
    if (!lead.id) return;
    setQualifying(true);
    try {
      const res = await fetch(`${API_BASE}/leads/${lead.id}/qualify`, { method: 'PATCH' });
      const data = await res.json();
      if (data.status === 'success') {
        setLead({ ...lead, is_qualified: true, status: 'qualified', lead_stage: 'qualified', temperature: 'hot' });
        setQualifyDone(true);
      }
    } catch (e) { console.error(e); }
    setQualifying(false);
  };

  const handleViewSummary = async () => {
    if (showSummary) { setShowSummary(false); return; }
    if (summary) { setShowSummary(true); return; }
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await fetch(`${API_BASE}/leads/${lead.sender_id}/summary`);
      const data = await res.json();
      if (data.status === 'success') {
        setSummary(data);
        setShowSummary(true);
      } else {
        setSummaryError(data.message || 'No conversation found for this lead.');
        setShowSummary(true);
      }
    } catch (e) {
      setSummaryError('Could not load summary. Check your connection.');
      setShowSummary(true);
    }
    setSummaryLoading(false);
  };

  const URGENCY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

  return (
    <Card>
      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <div className="avatar big" style={{background:'#2563eb', color:'white', fontSize:'1.2em'}}>
            {String(name)[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{margin:0, fontSize:'1.1em'}}>{name}</h2>
            <div style={{marginTop:'4px'}}><LeadTemperatureDot temp={lead.temperature}/></div>
          </div>
        </div>
        <button className="outline" onClick={onClose} style={{padding:'4px 10px'}}><X size={14}/></button>
      </div>

      {/* Contact info */}
      <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px'}}>
        {lead.phone && (
          <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88em', color:'#94a3b8'}}>
            <Phone size={13}/> {lead.phone}
          </div>
        )}
        {lead.location && (
          <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88em', color:'#94a3b8'}}>
            <MapPin size={13}/> {lead.location}
          </div>
        )}
        {lead.interested_module && (
          <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88em', color:'#94a3b8'}}>
            <BookOpen size={13}/> {lead.interested_module}
          </div>
        )}
        {lead.updated_at && (
          <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88em', color:'#94a3b8'}}>
            <Clock size={13}/> Last updated: {new Date(lead.updated_at).toLocaleString()}
          </div>
        )}
      </div>

      {/* Key details */}
      <KeyVals data={{
        'Lead Stage': STAGE_LABELS[lead.lead_stage] || lead.lead_stage || '-',
        'Status': lead.status || '-',
        'Channel': 'Instagram',
        ...(lead.mode ? {'Mode': lead.mode} : {}),
        ...(lead.email ? {'Email': lead.email} : {}),
      }}/>

      {/* Notes */}
      {lead.notes && (
        <div style={{marginTop:'14px', padding:'10px 12px', background:'rgba(37,99,235,0.06)', borderRadius:'8px', fontSize:'0.82em', color:'#94a3b8', borderLeft:'3px solid #2563eb'}}>
          <b style={{color:'#cbd5e1', display:'block', marginBottom:'4px'}}>Notes</b>
          {lead.notes}
        </div>
      )}

      {/* Actions */}
      <div style={{marginTop:'16px', display:'flex', gap:'8px', flexWrap:'wrap'}}>
        {lead.is_qualified || qualifyDone ? (
          <button disabled style={{flex:1, opacity:0.6, background:'#10b981'}}>
            ✓ Qualified
          </button>
        ) : (
          <button
            style={{flex:1}}
            onClick={handleQualify}
            disabled={qualifying}
          >
            {qualifying ? 'Qualifying...' : 'Mark Qualified'}
          </button>
        )}
        <button
          className="outline"
          style={{flex:1}}
          onClick={handleViewSummary}
          disabled={summaryLoading}
        >
          {summaryLoading ? 'Loading...' : showSummary ? 'Hide Summary' : 'View Conversation'}
        </button>
      </div>

      {/* AI Summary Panel */}
      {showSummary && (
        <div style={{marginTop:'16px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
            <Brain size={14} color="#8b5cf6"/>
            <span style={{fontSize:'0.82em', fontWeight:700, color:'#8b5cf6', textTransform:'uppercase', letterSpacing:'0.05em'}}>AI Conversation Summary</span>
          </div>

          {summaryError ? (
            <div style={{padding:'12px', background:'rgba(239,68,68,0.08)', borderRadius:'8px', fontSize:'0.83em', color:'#ef4444'}}>
              {summaryError}
            </div>
          ) : summary ? (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>

              {/* One-liner */}
              <div style={{padding:'10px 12px', background:'rgba(139,92,246,0.08)', borderRadius:'8px', borderLeft:'3px solid #8b5cf6', fontSize:'0.88em', color:'#e2e8f0', fontStyle:'italic'}}>
                "{summary.summary?.one_liner}"
              </div>

              {/* Intent + Stage + Urgency row */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px'}}>
                <div style={{padding:'8px', background:'rgba(255,255,255,0.04)', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'0.7em', color:'#64748b', marginBottom:'3px'}}>INTENT</div>
                  <div style={{fontSize:'0.8em', color:'#e2e8f0'}}>{summary.summary?.intent || '-'}</div>
                </div>
                <div style={{padding:'8px', background:'rgba(255,255,255,0.04)', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'0.7em', color:'#64748b', marginBottom:'3px'}}>STAGE</div>
                  <div style={{fontSize:'0.8em', color:'#e2e8f0'}}>{summary.summary?.stage || '-'}</div>
                </div>
                <div style={{padding:'8px', background:'rgba(255,255,255,0.04)', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'0.7em', color:'#64748b', marginBottom:'3px'}}>URGENCY</div>
                  <div style={{fontSize:'0.8em', fontWeight:700, color: URGENCY_COLORS[summary.summary?.urgency] || '#94a3b8', textTransform:'capitalize'}}>
                    {summary.summary?.urgency || '-'}
                  </div>
                </div>
              </div>

              {/* Key facts */}
              {summary.summary?.key_facts?.length > 0 && (
                <div>
                  <div style={{fontSize:'0.75em', color:'#64748b', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Key Facts</div>
                  <ul style={{margin:0, padding:'0 0 0 16px', display:'flex', flexDirection:'column', gap:'4px'}}>
                    {summary.summary.key_facts.map((fact, i) => (
                      <li key={i} style={{fontSize:'0.83em', color:'#94a3b8'}}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended action */}
              {summary.summary?.recommended_action && (
                <div style={{padding:'10px 12px', background:'rgba(16,185,129,0.08)', borderRadius:'8px', borderLeft:'3px solid #10b981'}}>
                  <div style={{fontSize:'0.72em', color:'#10b981', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px'}}>Recommended Action</div>
                  <div style={{fontSize:'0.85em', color:'#e2e8f0'}}>{summary.summary.recommended_action}</div>
                </div>
              )}

              {/* Meta */}
              <div style={{fontSize:'0.75em', color:'#475569', display:'flex', gap:'12px'}}>
                <span>{summary.message_count} messages</span>
                {summary.last_active && <span>Last active: {new Date(summary.last_active).toLocaleDateString()}</span>}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

// ─── OTHER PAGES (unchanged) ──────────────────────────────────────────────────

function Debugger() {
  const stages=['Customer Stage','Identity Stage','Conversation Stage','Business Brain Stage','Customer Brain Stage','Intent Stage','Lead Stage','Decision Stage','Reply Stage'];
  return (
    <section>
      <Title title="Pipeline Debugger" sub="See how the AI is thinking"/>
      <div className="debug-input"><input defaultValue="I want to learn SAP and become a functional consultant. I am based in Dubai..."/><button><Play size={14}/> Run Pipeline</button></div>
      <div className="grid2">
        <Card title="Pipeline Stages"><div>{stages.map((s,i)=><div className="stage" key={s}><span>{i+1}. {s}</span><b>Completed</b><small>{[120,89,112,210,310,15,18,10,120][i]}ms</small></div>)}</div><h3>Total Time: 1.013s</h3></Card>
        <Card title="Pipeline Result"><Badge text="Lead Detected"/><KeyVals data={{Intent:'training_enquiry','Intent Confidence':'0.95','Lead Detected':'True','Lead Score':'85','Temperature':'Warm','Action':'reply','Should Reply':'True'}}/><div className="reply">Sure... please share your name, contact number, location and whether you prefer online/offline.</div></Card>
      </div>
    </section>
  );
}

function Playground() {
  return (
    <section>
      <Title title="AI Playground" sub="Test the AI in real-time"/>
      <Tabs tabs={['Chat Mode','Intent Test','Lead Test','Business Brain Test']}/>
      <div className="grid2">
        <Card title="Your Message"><textarea defaultValue="Any SAP jobs available in Dubai?"/><button>Send</button><h3>AI Response</h3><div className="reply">Yes, there are good opportunities for SAP professionals in Dubai. What is your background?</div></Card>
        <Card title="AI Analysis"><KeyVals data={{Intent:'job_enquiry',Confidence:'0.96','Lead Detected':'False','Business Brain':'Checked','Active Campaigns':'2 Found',Action:'reply','Should Reply':'True'}}/></Card>
      </div>
      <Card title="Conversation History"><Table heads={['Message','Reply','Category','Lead']} rows={[["I want to learn SAP FICO.","Sure... please share your name...",'training_enquiry','True'],["Any SAP jobs in Dubai?","Yes, there are good opportunities...",'job_enquiry','False']]}/></Card>
    </section>
  );
}

const CATEGORY_COLORS = {
  greeting: '#2563eb',
  business_rule: '#10b981',
  lead_collection: '#8b5cf6',
  promotion: '#f59e0b',
  job: '#ef4444',
  faq: '#06b6d4',
  appointment: '#ec4899',
};

const CATEGORY_LABELS = {
  greeting: 'Greeting',
  business_rule: 'Business Rule',
  lead_collection: 'Lead Collection',
  promotion: 'Promotion',
  job: 'Job / Career',
  faq: 'FAQ',
  appointment: 'Appointment',
};

const EMPTY_RULE = { rule_name: '', category: 'business_rule', trigger_keywords: '', response_template: '', priority: 10, notes: '' };

function BusinessBrain() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const loadRules = () => {
    setLoading(true);
    fetch(`${API_BASE}/brain/rules`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') setRules(data.rules || []);
      })
      .catch(err => console.error('Brain rules error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRules(); }, []);

  const openAdd = () => {
    setEditingRule(null);
    setForm(EMPTY_RULE);
    setShowForm(true);
  };

  const openEdit = (rule) => {
    setEditingRule(rule);
    setForm({
      rule_name: rule.rule_name || '',
      category: rule.category || 'business_rule',
      trigger_keywords: Array.isArray(rule.trigger_keywords) ? rule.trigger_keywords.join(', ') : (rule.trigger_keywords || ''),
      response_template: rule.response_template || '',
      priority: rule.priority || 10,
      notes: rule.notes || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.rule_name.trim() || !form.response_template.trim()) return;
    setSaving(true);
    const payload = {
      rule_name: form.rule_name.trim(),
      category: form.category,
      trigger_keywords: form.trigger_keywords.split(',').map(k => k.trim()).filter(Boolean),
      response_template: form.response_template.trim(),
      priority: Number(form.priority) || 10,
      notes: form.notes.trim(),
    };
    try {
      if (editingRule) {
        await fetch(`${API_BASE}/brain/rules/${editingRule.id}`, {
          method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE}/brain/rules`, {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
      }
      setShowForm(false);
      loadRules();
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const handleToggle = async (rule) => {
    await fetch(`${API_BASE}/brain/rules/${rule.id}/toggle`, { method: 'PATCH' });
    loadRules();
  };

  const handleDelete = async (ruleId) => {
    await fetch(`${API_BASE}/brain/rules/${ruleId}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    loadRules();
  };

  const categories = ['All', ...new Set(rules.map(r => r.category).filter(Boolean))];
  const filtered = activeCategory === 'All' ? rules : rules.filter(r => r.category === activeCategory);
  const activeCount = rules.filter(r => r.is_active).length;

  return (
    <section>
      <Title
        title="Business Brain"
        sub="Teach your AI how to respond — like briefing a new employee"
        action={
          <button onClick={openAdd}><Plus size={15}/> Add New Rule</button>
        }
      />

      {/* Stats */}
      <div className="grid4" style={{marginBottom:'20px'}}>
        <Stat label="Total Rules" value={loading ? '...' : rules.length} change="All configured rules"/>
        <Stat label="Active Rules" value={loading ? '...' : activeCount} change="Currently in use by AI"/>
        <Stat label="Inactive Rules" value={loading ? '...' : rules.length - activeCount} change="Paused rules"/>
        <Stat label="Categories" value={loading ? '...' : categories.length - 1} change="Rule categories"/>
      </div>

      {/* Category filter tabs */}
      <div className="tabs" style={{marginBottom:'16px'}}>
        {categories.map(cat => (
          <button
            key={cat}
            className={activeCategory === cat ? 'active' : ''}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'All' ? 'All Rules' : (CATEGORY_LABELS[cat] || cat)}
            <span style={{
              marginLeft:'6px', fontSize:'0.75em', opacity:0.7,
              background: activeCategory === cat ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
              borderRadius:'10px', padding:'1px 6px'
            }}>
              {cat === 'All' ? rules.length : rules.filter(r => r.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card" style={{marginBottom:'20px', border:'1px solid #2563eb', borderRadius:'12px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
            <h3 style={{margin:0}}>{editingRule ? 'Edit Rule' : 'Add New Rule'}</h3>
            <button className="outline" onClick={() => setShowForm(false)}><X size={14}/></button>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
            <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <span style={{fontSize:'0.82em',color:'#94a3b8'}}>Rule Name *</span>
              <input
                placeholder="e.g. SAP MM Weekend Batch Enquiry"
                value={form.rule_name}
                onChange={e => setForm({...form, rule_name: e.target.value})}
              />
            </label>
            <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <span style={{fontSize:'0.82em',color:'#94a3b8'}}>Category</span>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'12px'}}>
            <span style={{fontSize:'0.82em',color:'#94a3b8'}}>Trigger Keywords <span style={{opacity:0.6}}>(comma separated — e.g. mm, sap mm, material management)</span></span>
            <input
              placeholder="mm, sap mm, material management, weekend batch"
              value={form.trigger_keywords}
              onChange={e => setForm({...form, trigger_keywords: e.target.value})}
            />
          </label>

          <label style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'12px'}}>
            <span style={{fontSize:'0.82em',color:'#94a3b8'}}>What should the AI reply? *</span>
            <textarea
              placeholder="Write what the AI should say when this rule is triggered. Be natural — like you are telling a new employee what to say."
              value={form.response_template}
              onChange={e => setForm({...form, response_template: e.target.value})}
              style={{minHeight:'90px'}}
            />
          </label>

          <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'12px', marginTop:'12px'}}>
            <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <span style={{fontSize:'0.82em',color:'#94a3b8'}}>Priority <span style={{opacity:0.6}}>(higher = matched first)</span></span>
              <input
                type="number" min="1" max="100"
                value={form.priority}
                onChange={e => setForm({...form, priority: e.target.value})}
              />
            </label>
            <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <span style={{fontSize:'0.82em',color:'#94a3b8'}}>Internal Notes <span style={{opacity:0.6}}>(not shown to customers)</span></span>
              <input
                placeholder="Optional notes for yourself"
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
              />
            </label>
          </div>

          <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
            <button onClick={handleSave} disabled={saving || !form.rule_name.trim() || !form.response_template.trim()}>
              <Save size={14}/> {saving ? 'Saving...' : (editingRule ? 'Update Rule' : 'Save Rule')}
            </button>
            <button className="outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="card" style={{marginBottom:'16px', border:'1px solid #ef4444', borderRadius:'12px', background:'rgba(239,68,68,0.06)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#ef4444'}}>
            <AlertTriangle size={18}/>
            <span>Are you sure you want to delete <b>"{deleteConfirm.rule_name}"</b>? This cannot be undone.</span>
          </div>
          <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
            <button style={{background:'#ef4444'}} onClick={() => handleDelete(deleteConfirm.id)}>Yes, Delete</button>
            <button className="outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Rules grid */}
      {loading ? (
        <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>Loading rules...</div>
      ) : filtered.length === 0 ? (
        <div style={{padding:'40px', textAlign:'center', color:'#64748b'}}>
          {activeCategory === 'All'
            ? 'No rules yet. Click "Add New Rule" to teach your AI how to respond.'
            : `No rules in the "${CATEGORY_LABELS[activeCategory] || activeCategory}" category.`}
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:'16px'}}>
          {filtered.map(rule => {
            const catColor = CATEGORY_COLORS[rule.category] || '#64748b';
            const keywords = Array.isArray(rule.trigger_keywords) ? rule.trigger_keywords : [];
            return (
              <div key={rule.id} className="card" style={{
                border: `1px solid ${rule.is_active ? catColor + '40' : '#334155'}`,
                opacity: rule.is_active ? 1 : 0.6,
                transition: 'all 0.2s'
              }}>
                {/* Card header */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                  <div>
                    <span style={{
                      fontSize:'0.72em', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em',
                      color: catColor, background: catColor + '18', padding:'2px 8px', borderRadius:'20px'
                    }}>
                      {CATEGORY_LABELS[rule.category] || rule.category}
                    </span>
                    <h3 style={{margin:'8px 0 0', fontSize:'0.95em'}}>{rule.rule_name}</h3>
                  </div>
                  <button
                    onClick={() => handleToggle(rule)}
                    style={{background:'none', border:'none', cursor:'pointer', padding:'4px', color: rule.is_active ? '#10b981' : '#64748b'}}
                    title={rule.is_active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {rule.is_active ? <ToggleRight size={26}/> : <ToggleLeft size={26}/>}
                  </button>
                </div>

                {/* Keywords */}
                {keywords.length > 0 && (
                  <div style={{display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'10px'}}>
                    <Tag size={11} color="#64748b" style={{marginTop:'3px'}}/>
                    {keywords.slice(0, 6).map((kw, i) => (
                      <span key={i} style={{
                        fontSize:'0.72em', background:'rgba(255,255,255,0.06)',
                        border:'1px solid #334155', borderRadius:'20px', padding:'2px 8px', color:'#94a3b8'
                      }}>{kw}</span>
                    ))}
                    {keywords.length > 6 && (
                      <span style={{fontSize:'0.72em', color:'#64748b'}}>+{keywords.length - 6} more</span>
                    )}
                  </div>
                )}

                {/* Response preview */}
                <div style={{
                  fontSize:'0.83em', color:'#94a3b8', lineHeight:'1.5',
                  background:'rgba(255,255,255,0.03)', borderRadius:'8px',
                  padding:'8px 10px', marginBottom:'12px',
                  borderLeft: `3px solid ${catColor}40`,
                  maxHeight:'70px', overflow:'hidden',
                  display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical'
                }}>
                  {rule.response_template}
                </div>

                {/* Footer */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                    <Zap size={11} color="#64748b"/>
                    <span style={{fontSize:'0.75em', color:'#64748b'}}>Priority: {rule.priority}</span>
                    <span style={{fontSize:'0.75em', color: rule.is_active ? '#10b981' : '#64748b', marginLeft:'8px'}}>
                      {rule.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <div style={{display:'flex', gap:'6px'}}>
                    <button
                      className="outline"
                      style={{padding:'4px 10px', fontSize:'0.78em'}}
                      onClick={() => openEdit(rule)}
                    >
                      <Pencil size={11}/> Edit
                    </button>
                    <button
                      style={{padding:'4px 10px', fontSize:'0.78em', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444'}}
                      onClick={() => setDeleteConfirm(rule)}
                    >
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </div>

                {rule.notes && (
                  <div style={{marginTop:'8px', fontSize:'0.75em', color:'#475569', fontStyle:'italic'}}>
                    Note: {rule.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Customer360() {
  return (
    <section>
      <Title title="Customer 360° View" sub="Complete profile and interaction history"/>
      <div className="customer">
        <Card><div className="profileBig"><div className="avatar big">J</div><h2>John Dsouza</h2><Badge text="Warm Lead"/></div><KeyVals data={{Phone:'+971 50 123 4567',Email:'john.dsouza@email.com','Interested In':'SAP FICO','Lead Score':'85 / 100','Lead Stage':'phone_pending','First Contact':'May 20, 2025','Last Contact':'2 minutes ago'}}/></Card>
        <Card title="Overview"><p>Customer 360 will be connected after the conversation detail screen is ready.</p><h3>Next Best Action</h3><p>Select a real conversation and open the full customer profile.</p><button>Start Conversation</button></Card>
      </div>
    </section>
  );
}

function Reports({dashboard}) {
  const counts = dashboard?.counts || {};
  return (
    <section>
      <Title title="Reports & Analytics" sub="Deep insights into performance" action={<button><Download size={15}/> Export</button>}/>
      <div className="grid4">
        <Stat label="Conversations" value={counts.total_conversations ?? "Loading..."} change="Live"/>
        <Stat label="Total Leads" value={counts.total_leads ?? "Loading..."} change="Live"/>
        <Stat label="Qualified Leads" value={counts.qualified_leads ?? "Loading..."} change="Live"/>
        <Stat label="Needs Human" value={counts.needs_human ?? "Loading..."} change="Live"/>
      </div>
      <div className="grid3">
        <Card title="Leads by Source"><PieBlock data={[{name:'Instagram',value:62},{name:'Website',value:18},{name:'WhatsApp',value:12},{name:'Other',value:8}]}/></Card>
        <Card title="Leads by Temperature"><PieBlock data={[{name:'Hot',value:24},{name:'Warm',value:46},{name:'Cold',value:30}]}/></Card>
        <Card title="Lead Funnel"><ResponsiveContainer height={220}><BarChart data={[{n:'New',v:156},{n:'Contacted',v:98},{n:'Engaged',v:54},{n:'Qualified',v:38},{n:'Converted',v:12}]}><XAxis dataKey="n"/><Tooltip/><Bar dataKey="v" radius={8}/></BarChart></ResponsiveContainer></Card>
      </div>
    </section>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Local form state
  const [form, setForm] = useState({
    business_name: '',
    business_description: '',
    reply_delay_minutes: 15,
    ai_tone: 'friendly',
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    working_days: 'Mon,Tue,Wed,Thu,Fri',
    auto_reply_enabled: false,
    out_of_hours_message: '',
  });

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/settings`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          const s = data.settings;
          setSettings(s);
          setForm({
            business_name: s.business_name || '',
            business_description: s.business_description || '',
            reply_delay_minutes: s.reply_delay_minutes ?? 15,
            ai_tone: s.ai_tone || 'friendly',
            working_hours_start: s.working_hours_start || '09:00',
            working_hours_end: s.working_hours_end || '18:00',
            working_days: s.working_days || 'Mon,Tue,Wed,Thu,Fri',
            auto_reply_enabled: s.auto_reply_enabled || false,
            out_of_hours_message: s.out_of_hours_message || '',
          });
        }
      })
      .catch(err => console.error('Settings load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (section) => {
    setSaving(section);
    setSaved(false);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSaved(section);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.message || 'Save failed');
      }
    } catch (e) {
      setError('Network error — could not save');
    }
    setSaving(false);
  };

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const selectedDays = form.working_days ? form.working_days.split(',').map(d => d.trim()) : [];

  const toggleDay = (day) => {
    const current = selectedDays;
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    // Keep original order
    const ordered = DAYS.filter(d => updated.includes(d));
    setForm({ ...form, working_days: ordered.join(',') });
  };

  const SaveBtn = ({ section }) => (
    <button
      onClick={() => handleSave(section)}
      disabled={saving === section}
      style={{ marginTop: '16px' }}
    >
      <Save size={14}/>
      {saving === section ? ' Saving...' : saved === section ? ' Saved ✓' : ' Save Changes'}
    </button>
  );

  if (loading) return (
    <section>
      <Title title="Settings" sub="Configure your AI Command Center"/>
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading settings...</div>
    </section>
  );

  return (
    <section>
      <Title title="Settings" sub="Configure your AI Command Center — changes take effect immediately"/>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={15}/> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Business Profile */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.95em', color: '#e2e8f0' }}>Business Profile</h3>
          <p style={{ fontSize: '0.82em', color: '#64748b', marginBottom: '16px', marginTop: 0 }}>
            This information is used by the AI to understand your business and reply in context.
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82em', color: '#94a3b8' }}>Business Name</span>
            <input
              placeholder="e.g. SAP Guru by Mohamed Aslam"
              value={form.business_name}
              onChange={e => setForm({ ...form, business_name: e.target.value })}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82em', color: '#94a3b8' }}>Business Description <span style={{ opacity: 0.6 }}>(used in AI prompts)</span></span>
            <textarea
              placeholder="Describe your business in 2-3 sentences. The AI will use this to understand what you do and reply accordingly."
              value={form.business_description}
              onChange={e => setForm({ ...form, business_description: e.target.value })}
              style={{ minHeight: '80px' }}
            />
          </label>

          <SaveBtn section="profile"/>
        </div>

        {/* AI Behaviour */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.95em', color: '#e2e8f0' }}>AI Behaviour</h3>
          <p style={{ fontSize: '0.82em', color: '#64748b', marginBottom: '16px', marginTop: 0 }}>
            Control how the AI sounds and when it sends replies.
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82em', color: '#94a3b8' }}>AI Tone</span>
            <select value={form.ai_tone} onChange={e => setForm({ ...form, ai_tone: e.target.value })}>
              <option value="friendly">Friendly — warm, casual, approachable</option>
              <option value="professional">Professional — clear, business-like</option>
              <option value="formal">Formal — structured, respectful</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82em', color: '#94a3b8' }}>
              Reply Delay — <b style={{ color: '#f59e0b' }}>{form.reply_delay_minutes} minutes</b>
              <span style={{ opacity: 0.6, fontWeight: 400 }}> (AI waits this long before sending)</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range" min={1} max={60} step={1}
                value={form.reply_delay_minutes}
                onChange={e => setForm({ ...form, reply_delay_minutes: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <input
                type="number" min={1} max={60}
                value={form.reply_delay_minutes}
                onChange={e => setForm({ ...form, reply_delay_minutes: Number(e.target.value) })}
                style={{ width: '60px' }}
              />
            </div>
            <span style={{ fontSize: '0.75em', color: '#475569' }}>
              If you reply manually within this window, the AI reply is cancelled automatically.
            </span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
            <div
              onClick={() => setForm({ ...form, auto_reply_enabled: !form.auto_reply_enabled })}
              style={{ color: form.auto_reply_enabled ? '#10b981' : '#64748b' }}
            >
              {form.auto_reply_enabled ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
            </div>
            <div>
              <div style={{ fontSize: '0.88em', color: '#e2e8f0' }}>Auto Reply</div>
              <div style={{ fontSize: '0.75em', color: '#64748b' }}>
                {form.auto_reply_enabled
                  ? 'AI sends replies automatically after the delay'
                  : 'AI generates replies but does NOT send — you review first'}
              </div>
            </div>
          </label>

          <SaveBtn section="ai"/>
        </div>

        {/* Working Hours */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.95em', color: '#e2e8f0' }}>Working Hours</h3>
          <p style={{ fontSize: '0.82em', color: '#64748b', marginBottom: '16px', marginTop: 0 }}>
            The AI will use this to set expectations with customers outside working hours.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.82em', color: '#94a3b8' }}>Start Time</span>
              <input
                type="time"
                value={form.working_hours_start}
                onChange={e => setForm({ ...form, working_hours_start: e.target.value })}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.82em', color: '#94a3b8' }}>End Time</span>
              <input
                type="time"
                value={form.working_hours_end}
                onChange={e => setForm({ ...form, working_hours_end: e.target.value })}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82em', color: '#94a3b8' }}>Working Days</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.8em',
                    background: selectedDays.includes(day) ? '#2563eb' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${selectedDays.includes(day) ? '#2563eb' : '#334155'}`,
                    borderRadius: '20px',
                    color: selectedDays.includes(day) ? '#fff' : '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82em', color: '#94a3b8' }}>Out-of-hours message <span style={{ opacity: 0.6 }}>(optional)</span></span>
            <textarea
              placeholder="e.g. Thanks for reaching out! We are currently closed. Our team will respond during working hours (Mon-Fri, 9am-6pm)."
              value={form.out_of_hours_message}
              onChange={e => setForm({ ...form, out_of_hours_message: e.target.value })}
              style={{ minHeight: '70px' }}
            />
          </label>

          <SaveBtn section="hours"/>
        </div>

        {/* System Info */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '0.95em', color: '#e2e8f0' }}>System Info</h3>
          <p style={{ fontSize: '0.82em', color: '#64748b', marginBottom: '16px', marginTop: 0 }}>
            Read-only information about your AI Command Center setup.
          </p>
          <KeyVals data={{
            'Platform': 'AI Command Center v1.0',
            'Backend': 'sap-guru-assistant.onrender.com',
            'Channel': 'Instagram DM',
            'Organisation ID': '1 (SAP Guru)',
            'Auto Reply Mode': form.auto_reply_enabled ? 'Enabled' : 'Disabled (Delay Mode)',
            'Current Delay': `${form.reply_delay_minutes} minutes`,
            'AI Tone': form.ai_tone || 'friendly',
            'Last Updated': settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : 'Never',
          }}/>
          <div style={{ marginTop: '16px', padding: '10px 12px', background: 'rgba(37,99,235,0.06)', borderRadius: '8px', fontSize: '0.8em', color: '#64748b', borderLeft: '3px solid #2563eb' }}>
            <b style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>How delay mode works</b>
            When a customer messages you, the AI generates a reply and waits {form.reply_delay_minutes} minutes.
            If you reply manually in that window, the AI reply is cancelled.
            If you don't reply, the AI sends automatically.
          </div>
        </div>

      </div>
    </section>
  );
}

function Automation() {
  return (
    <section>
      <Title title="Automation" sub="Rules, delays and approval flow" action={<button><Plus size={15}/> New Rule</button>}/>
      <Card title="Auto Reply Engine"><Table heads={['Rule','Trigger','Delay','Status','Action']} rows={[[ '15-minute delayed reply','Pending reply created','15 min',<Badge text="Active"/>,<button className="outline">Edit</button>],[ 'Manual review required','Low confidence reply','No auto send',<Badge text="Active"/>,<button className="outline">Edit</button>],[ 'Lead handoff','High-intent course enquiry','Instant',<Badge text="Active"/>,<button className="outline">Edit</button>]]}/></Card>
    </section>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Card({title,children}) { return <div className="card">{title&&<h3>{title}</h3>}{children}</div>; }
function Tabs({tabs}) { return <div className="tabs">{tabs.map((t,i)=><button className={i===0?'active':''} key={t}>{t}</button>)}</div>; }
function Table({heads,rows}) { return <div className="table"><table><thead><tr>{heads.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>; }
function Name({name}) { return <span className="name"><span className="mini">{String(name || "?")[0]}</span>{name}</span>; }
function Badge({text}) { return <span className={'badge '+String(text).toLowerCase().replaceAll(' ','-')}>{text}</span>; }
function KeyVals({data}) { return <div className="kv">{Object.entries(data).map(([k,v])=><React.Fragment key={k}><span>{k}</span><b>{v}</b></React.Fragment>)}</div>; }
function LineBlock() { return <ResponsiveContainer height={240}><LineChart data={conversationData}><XAxis dataKey="day"/><YAxis/><Tooltip/><Line dataKey="total" strokeWidth={3}/><Line dataKey="ai" strokeWidth={3}/></LineChart></ResponsiveContainer>; }
function PieBlock({data}) { return <div className="pie"><ResponsiveContainer height={230}><PieChart><Pie data={data} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={2}>{data.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div>{data.map((d,i)=><p key={d.name}><i style={{background:colors[i%colors.length]}}/> {d.name} <b>{d.value}%</b></p>)}</div></div>; }

createRoot(document.getElementById('root')).render(<App />);
