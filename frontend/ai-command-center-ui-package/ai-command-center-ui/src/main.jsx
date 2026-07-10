import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, HelpCircle, Search, Settings, LayoutDashboard, MessagesSquare, Users, Bug, Bot, Brain, UserRound, BarChart3, Workflow, Plus, Download, Filter, Play, X, Phone, MapPin, BookOpen, Star, Clock, ChevronRight, ToggleLeft, ToggleRight, Pencil, Trash2, Tag, Zap, Save, AlertTriangle, Building2, Globe, CheckCircle, Plug, Wifi, WifiOff, RefreshCw, ExternalLink, Key, Link } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import './styles.css';

const API_BASE = "https://sap-guru-assistant.onrender.com";

const nav = [
  ['Overview', LayoutDashboard], ['Conversations', MessagesSquare], ['Leads', Users], ['Pipeline Debugger', Bug],
  ['AI Playground', Bot], ['Business Brain', Brain], ['Customer 360°', UserRound], ['Reports', BarChart3], ['Automation', Workflow], ['Businesses', Building2], ['Integrations', Plug], ['Settings', Settings]
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
      <Sidebar page={page} setPage={setPage}/>
      <main>
        <Topbar businesses={businesses} activeBusiness={activeBusiness} onSwitch={handleSwitchBusiness} onNavigate={setPage} notifications={notifications} unreadCount={unreadCount} onMarkAllRead={() => setUnreadCount(0)}/>
        <Screen page={page} dashboard={dashboard} activeBusiness={activeBusiness} setPage={setPage}/>
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
    if (showSwitcher) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSwitcher]);

  // Close notification panel when clicking outside
  React.useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifsState(false);
    };
    if (showNotifs) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifs]);

  const handleBellClick = () => {
    setShowNotifsState(p => !p);
    if (!showNotifs && unreadCount > 0) onMarkAllRead();
  };

  return (
    <header style={{position:'relative'}}>
      <div className="search"><Search size={16}/><input placeholder="Search anything..."/></div>

      {/* Business Switcher */}
      <div style={{position:'relative'}} ref={dropdownRef}>
        <button
          onClick={() => setShowSwitcher(p => !p)}
          style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',borderRadius:8,border:'1px solid #e2e8f0',background: showSwitcher ? '#f0f9ff' : 'white',cursor:'pointer',fontSize:13,fontWeight:500,color:'#1e293b',maxWidth:220,transition:'background 0.15s'}}
        >
          <Building2 size={14} color="#3b82f6"/>
          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>
            {activeBusiness ? activeBusiness.name : 'Select Workspace'}
          </span>
          <span style={{fontSize:10,color:'#94a3b8',marginLeft:2,display:'inline-block',transform: showSwitcher ? 'rotate(180deg)' : 'rotate(0deg)',transition:'transform 0.15s'}}>▾</span>
        </button>

        {showSwitcher && (
          <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,background:'white',border:'1px solid #e2e8f0',borderRadius:10,boxShadow:'0 8px 30px rgba(0,0,0,0.15)',zIndex:9000,minWidth:260,overflow:'hidden'}}>
            <div style={{padding:'10px 14px',fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'1px solid #f1f5f9'}}>Switch Workspace</div>
            {businesses.length === 0 && (
              <div style={{padding:'16px 14px',fontSize:13,color:'#94a3b8',textAlign:'center'}}>No workspaces yet</div>
            )}
            {businesses.map(biz => {
              const isSelected = activeBusiness && activeBusiness.id === biz.id;
              return (
                <button key={biz.id} onClick={() => { onSwitch(biz); setShowSwitcher(false); }}
                  style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background: isSelected ? '#f0f9ff' : 'white',border:'none',cursor:'pointer',textAlign:'left',borderBottom:'1px solid #f8fafc'}}>
                  <div style={{width:30,height:30,borderRadius:7,background: isSelected ? '#3b82f6' : '#e2e8f0',display:'flex',alignItems:'center',justifyContent:'center',color: isSelected ? 'white' : '#64748b',fontSize:13,fontWeight:700,flexShrink:0}}>{(biz.name||'?')[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{biz.name}</div>
                    <div style={{fontSize:11,color:'#94a3b8'}}>{biz.industry || 'Business'}</div>
                  </div>
                  {isSelected && <CheckCircle size={15} color="#3b82f6"/>}
                </button>
              );
            })}
            <div style={{padding:'8px 14px',borderTop:'1px solid #f1f5f9'}}>
              <button onClick={() => { setShowSwitcher(false); onNavigate('Businesses'); }}
                style={{width:'100%',padding:'8px',borderRadius:6,background:'#f8fafc',border:'1px solid #e2e8f0',cursor:'pointer',fontSize:12,color:'#3b82f6',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                <Plus size={13}/> Add New Business
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bell Icon with badge */}
      <div style={{position:'relative'}} ref={notifRef}>
        <button onClick={handleBellClick}
          style={{background:'none',border:'none',cursor:'pointer',padding:'6px',borderRadius:8,color: showNotifs ? '#3b82f6' : '#64748b',position:'relative',display:'flex',alignItems:'center',transition:'color 0.15s'}}>
          <Bell size={18}/>
          {unreadCount > 0 && (
            <span style={{position:'absolute',top:2,right:2,width:16,height:16,borderRadius:'50%',background:'#ef4444',color:'white',fontSize:9,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'white',border:'1px solid #e2e8f0',borderRadius:12,boxShadow:'0 12px 40px rgba(0,0,0,0.15)',zIndex:9000,width:360,maxHeight:480,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Header */}
            <div style={{padding:'14px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{fontSize:14,fontWeight:700,color:'#1e293b'}}>Notifications</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {notifications.length > 0 && (
                  <span style={{fontSize:11,color:'#64748b'}}>{notifications.length} alerts</span>
                )}
              </div>
            </div>

            {/* Notification list */}
            <div style={{overflowY:'auto',flex:1}}>
              {notifications.length === 0 ? (
                <div style={{padding:32,textAlign:'center'}}>
                  <Bell size={28} color="#e2e8f0" style={{margin:'0 auto 10px',display:'block'}}/>
                  <div style={{fontSize:13,color:'#94a3b8',fontWeight:500}}>All caught up!</div>
                  <div style={{fontSize:12,color:'#cbd5e1',marginTop:4}}>No new alerts right now</div>
                </div>
              ) : (
                notifications.map((notif, idx) => {
                  const cfg = NOTIF_ICONS[notif.type] || { icon: '🔔', color: '#64748b', bg: '#f8fafc' };
                  return (
                    <div key={notif.id}
                      onClick={() => { onNavigate(notif.target_page); setShowNotifsState(false); }}
                      style={{display:'flex',gap:12,padding:'12px 16px',borderBottom:'1px solid #f8fafc',cursor:'pointer',background: notif.is_read ? 'white' : '#fafbff',transition:'background 0.1s'}}
                      onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background= notif.is_read ? 'white' : '#fafbff'}
                    >
                      <div style={{width:36,height:36,borderRadius:9,background:cfg.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{cfg.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
                          <span style={{fontSize:12,fontWeight:700,color:'#1e293b'}}>{notif.title}</span>
                          <span style={{fontSize:10,color:'#94a3b8',flexShrink:0,marginLeft:8}}>{timeAgo(notif.time)}</span>
                        </div>
                        <div style={{fontSize:12,color:'#64748b',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{notif.message}</div>
                        <div style={{fontSize:11,color:cfg.color,fontWeight:600,marginTop:4}}>{notif.action} →</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{padding:'10px 16px',borderTop:'1px solid #f1f5f9',flexShrink:0}}>
                <button onClick={() => { onNavigate('Leads'); setShowNotifsState(false); }}
                  style={{width:'100%',padding:'7px',borderRadius:6,background:'#f8fafc',border:'1px solid #e2e8f0',cursor:'pointer',fontSize:12,color:'#475569',fontWeight:500}}>
                  View All Leads
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <HelpCircle size={18} style={{color:'#94a3b8',cursor:'pointer'}}/>
      <div className="avatar small">A</div>
    </header>
  );
}

function Screen({page, dashboard, activeBusiness, setPage}) {
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
      {page==='Businesses'&&<BusinessesAdmin activeBusiness={activeBusiness} setPage={setPage}/>}
      {page==='Integrations'&&<IntegrationsPage activeBusiness={activeBusiness}/>}
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
                  background:'#f1f5f9',
                  border:'1px solid #cbd5e1',
                  borderRadius:'16px 16px 16px 4px',
                  fontSize:'0.88em', color:'#1e293b', lineHeight:'1.6',
                }}>
                  <div style={{fontSize:'0.75em', color:'#64748b', marginBottom:'4px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>Customer</div>
                  {item.user}
                </div>
              </div>
            )}
            {item.assistant && (
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <div style={{
                  maxWidth:'78%', padding:'10px 13px',
                  background:'#dbeafe',
                  border:'1px solid #93c5fd',
                  borderRadius:'16px 16px 4px 16px',
                  fontSize:'0.88em', color:'#1e3a8a', lineHeight:'1.6',
                }}>
                  <div style={{fontSize:'0.75em', color:'#2563eb', marginBottom:'4px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>AI Assistant</div>
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
              <div style={{padding:'10px 12px', background:'#f3f0ff', borderRadius:'8px', borderLeft:'3px solid #8b5cf6', fontSize:'0.88em', color:'#3b0764', fontStyle:'italic', lineHeight:'1.5'}}>
                "{summary.summary?.one_liner}"
              </div>

              {/* Intent + Stage + Urgency row */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px'}}>
                <div style={{padding:'8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'0.7em', color:'#64748b', marginBottom:'3px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>INTENT</div>
                  <div style={{fontSize:'0.82em', color:'#1e293b', fontWeight:600}}>{summary.summary?.intent || '-'}</div>
                </div>
                <div style={{padding:'8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'0.7em', color:'#64748b', marginBottom:'3px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>STAGE</div>
                  <div style={{fontSize:'0.82em', color:'#1e293b', fontWeight:600}}>{summary.summary?.stage || '-'}</div>
                </div>
                <div style={{padding:'8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'0.7em', color:'#64748b', marginBottom:'3px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>URGENCY</div>
                  <div style={{fontSize:'0.82em', fontWeight:700, color: URGENCY_COLORS[summary.summary?.urgency] || '#475569', textTransform:'capitalize'}}>
                    {summary.summary?.urgency || '-'}
                  </div>
                </div>
              </div>

              {/* Key facts */}
              {summary.summary?.key_facts?.length > 0 && (
                <div style={{background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'10px 12px'}}>
                  <div style={{fontSize:'0.75em', color:'#475569', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em'}}>Key Facts</div>
                  <ul style={{margin:0, padding:'0 0 0 16px', display:'flex', flexDirection:'column', gap:'5px'}}>
                    {summary.summary.key_facts.map((fact, i) => (
                      <li key={i} style={{fontSize:'0.85em', color:'#1e293b', lineHeight:'1.5'}}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended action */}
              {summary.summary?.recommended_action && (
                <div style={{padding:'10px 12px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', borderLeft:'3px solid #10b981'}}>
                  <div style={{fontSize:'0.72em', color:'#15803d', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px'}}>Recommended Action</div>
                  <div style={{fontSize:'0.87em', color:'#14532d', lineHeight:'1.5'}}>{summary.summary.recommended_action}</div>
                </div>
              )}

              {/* Meta */}
              <div style={{fontSize:'0.75em', color:'#64748b', display:'flex', gap:'12px'}}>
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

const STAGE_ICONS = {
  'Customer Stage': '👤',
  'Identity Stage': '🪪',
  'Conversation Stage': '💬',
  'Business Brain Stage': '🧠',
  'Customer Brain Stage': '✨',
  'Intent Stage': '🎯',
  'Lead Stage': '🔥',
  'Decision Stage': '⚡',
  'Reply Stage': '📤',
};

const STAGE_COLORS = {
  completed: { bg: '#f0fdf4', border: '#86efac', dot: '#10b981', text: '#14532d' },
  skipped:   { bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8', text: '#64748b' },
  error:     { bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444', text: '#7f1d1d' },
  running:   { bg: '#eff6ff', border: '#93c5fd', dot: '#2563eb', text: '#1e3a8a' },
};

function Debugger() {
  const [message, setMessage] = useState('I want to learn SAP FICO. I am based in Mumbai. Please share fee details.');
  const [senderId, setSenderId] = useState('debug_test_user');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedStage, setExpandedStage] = useState(null);

  const runPipeline = async () => {
    if (!message.trim()) return;
    setRunning(true);
    setResult(null);
    setError(null);
    setExpandedStage(null);
    try {
      const res = await fetch(`${API_BASE}/debug/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), sender_id: senderId.trim() || 'debug_test_user' }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setResult(data);
      } else {
        setError(data.message || 'Pipeline failed');
      }
    } catch (e) {
      setError('Network error — is the backend running?');
    }
    setRunning(false);
  };

  const maxTiming = result ? Math.max(...result.stages.map(s => s.timing_ms || 0), 1) : 1;

  return (
    <section>
      <Title title="Pipeline Debugger" sub="Type any message and watch the AI process it stage by stage"/>

      {/* Input panel */}
      <Card>
        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          <div style={{display:'flex', gap:'10px'}}>
            <div style={{flex:1}}>
              <label style={{fontSize:'0.78em', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em', display:'block', marginBottom:'5px'}}>Test Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) runPipeline(); }}
                style={{width:'100%', minHeight:'70px', maxHeight:'120px', resize:'vertical', fontSize:'0.9em', boxSizing:'border-box'}}
                placeholder="Type any message a customer might send..."
              />
            </div>
            <div style={{width:'180px', flexShrink:0}}>
              <label style={{fontSize:'0.78em', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.04em', display:'block', marginBottom:'5px'}}>Sender ID (optional)</label>
              <input
                value={senderId}
                onChange={e => setSenderId(e.target.value)}
                style={{width:'100%', fontSize:'0.88em', boxSizing:'border-box'}}
                placeholder="debug_test_user"
              />
              <div style={{fontSize:'0.72em', color:'#94a3b8', marginTop:'4px'}}>Use a real sender_id to test with existing conversation history</div>
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <button onClick={runPipeline} disabled={running || !message.trim()} style={{display:'flex', alignItems:'center', gap:'6px', padding:'8px 20px'}}>
              <Play size={14}/> {running ? 'Running Pipeline...' : 'Run Pipeline'}
            </button>
            {result && (
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                <span style={{fontSize:'0.8em', padding:'4px 10px', borderRadius:'20px', background: result.is_lead ? '#fef3c7' : '#f1f5f9', color: result.is_lead ? '#92400e' : '#475569', fontWeight:600, border:`1px solid ${result.is_lead ? '#fcd34d' : '#e2e8f0'}`}}>
                  {result.is_lead ? '🔥 Lead Detected' : '👤 Not a Lead'}
                </span>
                <span style={{fontSize:'0.8em', padding:'4px 10px', borderRadius:'20px', background:'#eff6ff', color:'#1e40af', fontWeight:600, border:'1px solid #bfdbfe'}}>
                  🎯 {result.intent}
                </span>
                <span style={{fontSize:'0.8em', padding:'4px 10px', borderRadius:'20px', background: result.needs_human ? '#fef2f2' : '#f0fdf4', color: result.needs_human ? '#991b1b' : '#14532d', fontWeight:600, border:`1px solid ${result.needs_human ? '#fca5a5' : '#86efac'}`}}>
                  {result.needs_human ? '🚨 Needs Human' : '✅ AI Handled'}
                </span>
                <span style={{fontSize:'0.8em', padding:'4px 10px', borderRadius:'20px', background:'#f8fafc', color:'#475569', fontWeight:600, border:'1px solid #e2e8f0'}}>
                  ⏱ {result.total_ms}ms total
                </span>
              </div>
            )}
          </div>
          <div style={{fontSize:'0.75em', color:'#94a3b8'}}>Ctrl+Enter to run · This runs a test — it will NOT send any message to Instagram</div>
        </div>
      </Card>

      {error && (
        <div style={{padding:'12px 16px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', color:'#991b1b', fontSize:'0.88em', marginTop:'12px'}}>
          ⚠ {error}
        </div>
      )}

      {result && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginTop:'16px'}}>

          {/* Stage cards */}
          <Card title={`Pipeline Stages · ${result.stages.length} stages · ${result.total_ms}ms`}>
            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
              {result.stages.map((stage, i) => {
                const colors = STAGE_COLORS[stage.status] || STAGE_COLORS.completed;
                const isExpanded = expandedStage === i;
                const timingPct = Math.round((stage.timing_ms / maxTiming) * 100);
                return (
                  <div
                    key={i}
                    onClick={() => setExpandedStage(isExpanded ? null : i)}
                    style={{
                      padding:'10px 12px',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius:'8px',
                      cursor:'pointer',
                      transition:'all 0.15s',
                    }}
                  >
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <span style={{fontSize:'1em'}}>{STAGE_ICONS[stage.name] || '⚙️'}</span>
                        <div>
                          <div style={{fontSize:'0.85em', fontWeight:700, color:'#1e293b'}}>{stage.name}</div>
                          <div style={{fontSize:'0.75em', color:'#64748b', marginTop:'1px'}}>{stage.summary}</div>
                        </div>
                      </div>
                      <div style={{textAlign:'right', flexShrink:0, marginLeft:'8px'}}>
                        <div style={{fontSize:'0.75em', fontWeight:700, color: colors.text}}>
                          {stage.status === 'skipped' ? 'SKIPPED' : `${stage.timing_ms}ms`}
                        </div>
                        <div style={{fontSize:'0.65em', color:'#94a3b8'}}>{isExpanded ? '▲ hide' : '▼ details'}</div>
                      </div>
                    </div>
                    {/* Timing bar */}
                    {stage.status !== 'skipped' && (
                      <div style={{marginTop:'6px', height:'3px', background:'#e2e8f0', borderRadius:'2px'}}>
                        <div style={{height:'100%', width:`${timingPct}%`, background: colors.dot, borderRadius:'2px', transition:'width 0.4s ease'}} />
                      </div>
                    )}
                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{marginTop:'10px', padding:'10px', background:'rgba(255,255,255,0.7)', borderRadius:'6px', border:'1px solid #e2e8f0'}}>
                        {Object.entries(stage.details || {}).map(([k, v]) => (
                          <div key={k} style={{display:'flex', gap:'8px', marginBottom:'4px', fontSize:'0.8em'}}>
                            <span style={{color:'#64748b', fontWeight:600, minWidth:'120px', flexShrink:0}}>{k.replace(/_/g, ' ')}:</span>
                            <span style={{color:'#1e293b', wordBreak:'break-word'}}>
                              {typeof v === 'boolean' ? (v ? '✅ Yes' : '❌ No') : (v === null || v === undefined || v === '') ? <span style={{color:'#94a3b8', fontStyle:'italic'}}>none</span> : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Result panel */}
          <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>

            {/* AI Reply */}
            <Card title="AI Generated Reply">
              {result.reply_text ? (
                <div>
                  <div style={{padding:'14px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', fontSize:'0.9em', color:'#1e3a8a', lineHeight:'1.6', marginBottom:'10px'}}>
                    {result.reply_text}
                  </div>
                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                    <span style={{fontSize:'0.78em', padding:'3px 9px', borderRadius:'12px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0'}}>Category: {result.reply_category}</span>
                    <span style={{fontSize:'0.78em', padding:'3px 9px', borderRadius:'12px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0'}}>{result.reply_text.length} characters</span>
                  </div>
                </div>
              ) : (
                <div style={{padding:'14px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.88em', color:'#64748b', fontStyle:'italic'}}>
                  No reply generated — action was "{result.action}"
                </div>
              )}
            </Card>

            {/* Summary */}
            <Card title="Pipeline Summary">
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                {[
                  ['Intent', result.intent],
                  ['Action', result.action],
                  ['Lead Detected', result.is_lead ? 'Yes' : 'No'],
                  ['Needs Human', result.needs_human ? 'Yes' : 'No'],
                  ['Total Time', `${result.total_ms}ms`],
                  ['Stages Run', result.stages.filter(s => s.status === 'completed').length + ' / ' + result.stages.length],
                ].map(([k, v]) => (
                  <div key={k} style={{padding:'8px 10px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px'}}>
                    <div style={{fontSize:'0.7em', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'3px'}}>{k}</div>
                    <div style={{fontSize:'0.88em', color:'#1e293b', fontWeight:600}}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Memory */}
            {result.ai_memory && Object.keys(result.ai_memory).length > 0 && (
              <Card title="AI Memory (what the AI remembered)">
                <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                  {Object.entries(result.ai_memory).map(([k, v]) => (
                    <div key={k} style={{display:'flex', gap:'8px', fontSize:'0.82em', padding:'4px 0', borderBottom:'1px solid #f1f5f9'}}>
                      <span style={{color:'#64748b', fontWeight:600, minWidth:'140px', flexShrink:0}}>{k.replace(/_/g, ' ')}:</span>
                      <span style={{color:'#1e293b'}}>{v === null || v === undefined ? <span style={{color:'#94a3b8', fontStyle:'italic'}}>null</span> : String(v)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Logs */}
            <Card title="Pipeline Logs">
              <div style={{fontFamily:'monospace', fontSize:'0.78em', display:'flex', flexDirection:'column', gap:'3px'}}>
                {(result.logs || []).map((log, i) => (
                  <div key={i} style={{color: log.includes('error') || log.includes('Error') ? '#ef4444' : '#475569', padding:'2px 0', borderBottom:'1px solid #f8fafc'}}>
                    <span style={{color:'#94a3b8', marginRight:'8px'}}>{String(i+1).padStart(2,'0')}</span>{log}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}

function Playground() {
  const [message, setMessage] = React.useState('');
  const [senderId, setSenderId] = React.useState('playground_test_user');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const [selectedHistory, setSelectedHistory] = React.useState(null);

  const loadHistory = () => {
    setHistoryLoading(true);
    fetch(`${API_BASE}/playground/history?limit=20`)
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  React.useEffect(() => { loadHistory(); }, []);

  const runTest = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSelectedHistory(null);
    try {
      const res = await fetch(`${API_BASE}/playground/test-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), sender_id: senderId.trim() || 'playground_test_user' })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setResult(data);
        loadHistory();
      } else {
        setError(data.message || 'Unknown error');
      }
    } catch (e) {
      setError('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const displayResult = selectedHistory ? selectedHistory.result : result;

  const intentColor = (conf) => {
    if (!conf) return '#6b7280';
    if (conf >= 0.85) return '#10b981';
    if (conf >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const tempColor = { hot: '#ef4444', warm: '#f59e0b', cold: '#3b82f6' };

  return (
    <section style={{padding:'0 0 40px 0'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:'#1e293b',margin:0}}>AI Playground</h1>
          <p style={{color:'#64748b',margin:'4px 0 0',fontSize:14}}>Test any message and see exactly how the AI processes it</p>
        </div>
        <button onClick={loadHistory} style={{padding:'8px 16px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,cursor:'pointer',fontSize:13,color:'#475569'}}>↻ Refresh History</button>
      </div>

      {/* Input Panel */}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:24,marginBottom:24}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16,marginBottom:16}}>
          <div>
            <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Test Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') runTest(); }}
              placeholder="Type any message a customer might send... (Ctrl+Enter to run)"
              rows={3}
              style={{width:'100%',padding:'10px 14px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,resize:'vertical',fontFamily:'inherit',color:'#1e293b',boxSizing:'border-box'}}
            />
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:600,color:'#374151',display:'block',marginBottom:6}}>Sender ID <span style={{fontWeight:400,color:'#9ca3af'}}>(optional — use real ID for history)</span></label>
            <input
              value={senderId}
              onChange={e => setSenderId(e.target.value)}
              placeholder="playground_test_user"
              style={{width:'100%',padding:'10px 14px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,fontFamily:'inherit',color:'#1e293b',boxSizing:'border-box'}}
            />
            <p style={{fontSize:12,color:'#9ca3af',margin:'6px 0 0'}}>Use a real sender_id to include conversation history in the test</p>
          </div>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <button
            onClick={runTest}
            disabled={loading || !message.trim()}
            style={{padding:'10px 28px',background: loading ? '#94a3b8' : '#2563eb',color:'#fff',border:'none',borderRadius:8,cursor: loading ? 'not-allowed' : 'pointer',fontWeight:600,fontSize:14,display:'flex',alignItems:'center',gap:8}}
          >
            {loading ? '⏳ Running Pipeline...' : '▶ Run Pipeline'}
          </button>
          <button onClick={() => { setMessage(''); setResult(null); setError(null); setSelectedHistory(null); }} style={{padding:'10px 16px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,cursor:'pointer',fontSize:13,color:'#475569'}}>Clear</button>
          {loading && <span style={{fontSize:13,color:'#6b7280',fontStyle:'italic'}}>Processing through 9 pipeline stages...</span>}
        </div>
        {error && <div style={{marginTop:12,padding:'10px 14px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,color:'#dc2626',fontSize:13}}>{error}</div>}
      </div>

      {/* Results */}
      {displayResult && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>

          {/* Left: AI Reply + Analysis */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* AI Reply */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>💬</span> AI Generated Reply
              </h3>
              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'14px 16px',color:'#1e40af',fontSize:14,lineHeight:1.6,fontStyle:'italic'}}>
                {displayResult.reply?.reply || displayResult.reply?.message || 'No reply generated'}
              </div>
              {displayResult.reply?.category && (
                <div style={{marginTop:8,display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span style={{padding:'3px 10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:20,fontSize:12,color:'#15803d',fontWeight:600}}>{displayResult.reply.category}</span>
                  <span style={{padding:'3px 10px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:20,fontSize:12,color:'#475569'}}>{displayResult.reply.char_count || (displayResult.reply.reply || '').length} chars</span>
                </div>
              )}
            </div>

            {/* Intent Analysis */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>🎯</span> Intent Detection
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{padding:'12px 14px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Intent</div>
                  <div style={{fontSize:15,fontWeight:700,color:'#1e293b'}}>{displayResult.intent?.intent || 'unknown'}</div>
                </div>
                <div style={{padding:'12px 14px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Confidence</div>
                  <div style={{fontSize:15,fontWeight:700,color: intentColor(displayResult.intent?.confidence)}}>
                    {displayResult.intent?.confidence ? `${Math.round(displayResult.intent.confidence * 100)}%` : 'N/A'}
                  </div>
                </div>
              </div>
              {displayResult.intent?.reason && (
                <div style={{marginTop:10,fontSize:13,color:'#475569',padding:'8px 12px',background:'#f8fafc',borderRadius:6}}>
                  {displayResult.intent.reason}
                </div>
              )}
            </div>

            {/* Decision */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>⚡</span> Decision
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div style={{padding:'10px 12px',background: displayResult.decision?.should_reply ? '#f0fdf4' : '#fef2f2',borderRadius:8,border:`1px solid ${displayResult.decision?.should_reply ? '#bbf7d0' : '#fecaca'}`}}>
                  <div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Should Reply</div>
                  <div style={{fontSize:14,fontWeight:700,color: displayResult.decision?.should_reply ? '#15803d' : '#dc2626'}}>{displayResult.decision?.should_reply ? '✓ Yes' : '✗ No'}</div>
                </div>
                <div style={{padding:'10px 12px',background: displayResult.decision?.needs_human ? '#fef3c7' : '#f0fdf4',borderRadius:8,border:`1px solid ${displayResult.decision?.needs_human ? '#fde68a' : '#bbf7d0'}`}}>
                  <div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Needs Human</div>
                  <div style={{fontSize:14,fontWeight:700,color: displayResult.decision?.needs_human ? '#92400e' : '#15803d'}}>{displayResult.decision?.needs_human ? '⚠ Yes' : '✓ No'}</div>
                </div>
                <div style={{padding:'10px 12px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Action</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#1e293b'}}>{displayResult.decision?.action || 'reply'}</div>
                </div>
              </div>
              {displayResult.decision?.reason && (
                <div style={{marginTop:10,fontSize:13,color:'#475569',padding:'8px 12px',background:'#f8fafc',borderRadius:6}}>{displayResult.decision.reason}</div>
              )}
            </div>
          </div>

          {/* Right: Lead + Business Brain */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* Lead Analysis */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>🔥</span> Lead Analysis
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
                <div style={{padding:'10px 12px',background: displayResult.lead?.is_lead ? '#f0fdf4' : '#f8fafc',borderRadius:8,border:`1px solid ${displayResult.lead?.is_lead ? '#bbf7d0' : '#e2e8f0'}`}}>
                  <div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Lead</div>
                  <div style={{fontSize:14,fontWeight:700,color: displayResult.lead?.is_lead ? '#15803d' : '#6b7280'}}>{displayResult.lead?.is_lead ? '✓ Yes' : '✗ No'}</div>
                </div>
                <div style={{padding:'10px 12px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Score</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#1e293b'}}>{displayResult.lead?.lead_score ?? 'N/A'}</div>
                </div>
                <div style={{padding:'10px 12px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Temperature</div>
                  <div style={{fontSize:14,fontWeight:700,color: tempColor[displayResult.lead?.temperature] || '#6b7280',textTransform:'capitalize'}}>{displayResult.lead?.temperature || 'N/A'}</div>
                </div>
              </div>
              {displayResult.lead?.next_action && (
                <div style={{padding:'10px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,fontSize:13,color:'#92400e'}}>
                  <strong>Next Action:</strong> {displayResult.lead.next_action}
                </div>
              )}
            </div>

            {/* Business Brain */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color:'#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>🧠</span> Business Brain
              </h3>
              {displayResult.business_brain ? (
                <div>
                  <div style={{display:'flex',gap:8,marginBottom:10}}>
                    <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,background: displayResult.business_brain.matched ? '#f0fdf4' : '#f8fafc',color: displayResult.business_brain.matched ? '#15803d' : '#6b7280',border:`1px solid ${displayResult.business_brain.matched ? '#bbf7d0' : '#e2e8f0'}`}}>
                      {displayResult.business_brain.matched ? '✓ Rule Matched' : 'No Match'}
                    </span>
                  </div>
                  {displayResult.business_brain.rule_name && (
                    <div style={{padding:'10px 12px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,color:'#1e293b'}}>
                      <strong>Rule:</strong> {displayResult.business_brain.rule_name}
                    </div>
                  )}
                  {displayResult.business_brain.context_injected && (
                    <div style={{marginTop:8,padding:'10px 12px',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,fontSize:13,color:'#1e40af',fontStyle:'italic'}}>
                      {displayResult.business_brain.context_injected}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{padding:'10px 12px',background:'#f8fafc',borderRadius:8,fontSize:13,color:'#6b7280'}}>No business brain data returned</div>
              )}
            </div>

            {/* Customer Brain / Memory */}
            {displayResult.customer_brain && (
              <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
                <h3 style={{fontSize:14,fontWeight:700,color:'#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:18}}>✨</span> Customer Memory
                </h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {Object.entries(displayResult.customer_brain).map(([k,v]) => v ? (
                    <div key={k} style={{padding:'8px 12px',background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                      <div style={{fontSize:11,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:2}}>{k.replace(/_/g,' ')}</div>
                      <div style={{fontSize:13,color:'#1e293b',fontWeight:500}}>{String(v)}</div>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test History */}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
        <h3 style={{fontSize:15,fontWeight:700,color:'#1e293b',margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}>
          <span>📋</span> Test History
          <span style={{fontSize:13,fontWeight:400,color:'#9ca3af',marginLeft:4}}>({history.length} tests)</span>
        </h3>
        {historyLoading ? (
          <div style={{color:'#9ca3af',fontSize:13,padding:'20px 0',textAlign:'center'}}>Loading history...</div>
        ) : history.length === 0 ? (
          <div style={{color:'#9ca3af',fontSize:13,padding:'20px 0',textAlign:'center'}}>No tests run yet. Send a message above to get started.</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {history.map((item, idx) => {
              const r = item.result || {};
              const isSelected = selectedHistory === item;
              return (
                <div
                  key={idx}
                  onClick={() => { setSelectedHistory(isSelected ? null : item); setResult(null); }}
                  style={{padding:'12px 16px',border:`1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,borderRadius:8,cursor:'pointer',background: isSelected ? '#eff6ff' : '#fafafa',display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:12,alignItems:'center',transition:'all 0.15s'}}
                >
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#1e293b',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.message || '—'}</div>
                    <div style={{fontSize:12,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.reply?.reply ? `↳ ${r.reply.reply.substring(0,80)}...` : 'No reply'}</div>
                  </div>
                  <span style={{padding:'3px 10px',background:'#f1f5f9',borderRadius:20,fontSize:12,color:'#475569',fontWeight:500,whiteSpace:'nowrap'}}>{r.intent?.intent || '—'}</span>
                  <span style={{padding:'3px 10px',background: r.lead?.is_lead ? '#f0fdf4' : '#f8fafc',borderRadius:20,fontSize:12,color: r.lead?.is_lead ? '#15803d' : '#9ca3af',fontWeight:500,border:`1px solid ${r.lead?.is_lead ? '#bbf7d0' : '#e2e8f0'}`}}>{r.lead?.is_lead ? '🔥 Lead' : 'No Lead'}</span>
                  <span style={{fontSize:11,color:'#9ca3af',whiteSpace:'nowrap'}}>{item.time ? new Date(item.time).toLocaleTimeString() : ''}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
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

const TEMP_COLORS_360 = { hot: '#ef4444', warm: '#f59e0b', cold: '#3b82f6' };
const TIMELINE_ICONS = { start: '💬', lead: '🔥', qualified: '✅', activity: '⚡' };
const SENTIMENT_COLORS = { positive: '#10b981', neutral: '#64748b', negative: '#ef4444' };
const URGENCY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

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
                      <div style={{width:'32px', height:'32px', borderRadius:'50%', background: isSelected ? '#3b82f6' : '#e2e8f0', color: isSelected ? '#fff' : '#475569', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85em', fontWeight:700, flexShrink:0}}>
                        {(c.name || c.sender_id || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontSize:'0.85em', fontWeight:600, color:'#1e293b'}}>{c.name || c.instagram_username || c.sender_id}</div>
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
                  <div style={{fontSize:'1.2em', fontWeight:700, color:'#1e293b'}}>{profile.display_name}</div>
                  <div style={{fontSize:'0.82em', color:'#64748b', marginTop:'2px'}}>@{profile.instagram_username} · Instagram</div>
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
                  {[['Name', profile.identity?.name], ['Phone', profile.identity?.phone], ['Email', profile.identity?.email], ['Location', profile.identity?.location], ['Education', profile.identity?.education], ['Experience', profile.identity?.experience], ['Source', profile.identity?.source]].map(([k,v]) => v ? (
                    <div key={k}>
                      <div style={{fontSize:'0.7em', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color:'#1e293b', fontWeight:500, marginTop:'1px'}}>{v}</div>
                    </div>
                  ) : null)}
                </div>
              </Card>
              <Card title="Lead Data">
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {[['Interested In', profile.lead?.interested_in], ['Mode', profile.lead?.mode], ['Lead Stage', profile.lead?.lead_stage], ['Status', profile.lead?.status], ['Lead Score', profile.lead?.lead_score], ['Notes', profile.lead?.notes]].map(([k,v]) => v ? (
                    <div key={k}>
                      <div style={{fontSize:'0.7em', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color:'#1e293b', fontWeight:500, marginTop:'1px'}}>{String(v)}</div>
                    </div>
                  ) : null)}
                </div>
              </Card>
              <Card title="Conversation">
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {[['Messages', profile.conversation?.message_count], ['State', profile.conversation?.conversation_state], ['Last Message', profile.conversation?.last_message], ['Last Active', profile.conversation?.last_active ? new Date(profile.conversation.last_active).toLocaleDateString() : null]].map(([k,v]) => v ? (
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
                  {[['Interest', profile.ai_profile.interest], ['Intent', profile.ai_profile.intent], ['Journey Stage', profile.ai_profile.stage], ['Contact Shared', profile.ai_profile.contact_info_shared]].map(([k,v]) => v ? (
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
                      <div style={{fontSize:'0.88em', color:'#1e3a8a', fontStyle:'italic', lineHeight:'1.5'}}>"{profile.ai_profile.follow_up_message}"</div>
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
        ) : null}
      </div>
    </section>
  );
}

function Reports() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [days, setDays] = React.useState(30);

  const fetchReports = React.useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`${API_BASE}/reports?days=${days}`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setData(d);
        else setError(d.message || 'Failed to load reports');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  React.useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleExport = () => {
    window.open(`${API_BASE}/reports/export-csv`, '_blank');
  };

  const s = data?.summary || {};
  const COLORS = ['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6','#f97316','#06b6d4','#84cc16'];

  const windowOptions = [
    {label:'Last 7 days', value:7},
    {label:'Last 30 days', value:30},
    {label:'Last 90 days', value:90},
    {label:'Last 180 days', value:180},
  ];

  return (
    <section>
      <Title
        title="Reports & Analytics"
        sub={`Data for the last ${days} days — ${data?.generated_at ? new Date(data.generated_at).toLocaleString() : 'loading...'}`}
        action={
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              style={{padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,background:'white',cursor:'pointer'}}
            >
              {windowOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={fetchReports} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',cursor:'pointer',fontSize:13}}>↻ Refresh</button>
            <button onClick={handleExport} style={{padding:'6px 14px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>⬇ Export CSV</button>
          </div>
        }
      />

      {loading && <div style={{textAlign:'center',padding:40,color:'#64748b'}}>Loading report data...</div>}
      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:16,color:'#dc2626',marginBottom:16}}>{error}</div>}

      {!loading && data && (
        <>
          {/* Row 1 — Primary stats */}
          <div className="grid4" style={{marginBottom:16}}>
            <div style={{background:'white',borderRadius:10,padding:'18px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color:'#64748b',marginBottom:4}}>Total Leads (All Time)</div>
              <div style={{fontSize:28,fontWeight:700,color:'#1e293b'}}>{s.total_leads ?? 0}</div>
              <div style={{fontSize:12,color:'#3b82f6',marginTop:4}}>{s.window_leads ?? 0} in last {days} days</div>
            </div>
            <div style={{background:'white',borderRadius:10,padding:'18px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color:'#64748b',marginBottom:4}}>Hot Leads</div>
              <div style={{fontSize:28,fontWeight:700,color:'#ef4444'}}>{s.hot_leads ?? 0}</div>
              <div style={{fontSize:12,color:'#64748b',marginTop:4}}>phone + email captured</div>
            </div>
            <div style={{background:'white',borderRadius:10,padding:'18px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color:'#64748b',marginBottom:4}}>Qualified Leads</div>
              <div style={{fontSize:28,fontWeight:700,color:'#10b981'}}>{s.qualified ?? 0}</div>
              <div style={{fontSize:12,color:'#64748b',marginTop:4}}>{s.conversion_rate ?? 0}% conversion rate</div>
            </div>
            <div style={{background:'white',borderRadius:10,padding:'18px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color:'#64748b',marginBottom:4}}>Contact Rate</div>
              <div style={{fontSize:28,fontWeight:700,color:'#8b5cf6'}}>{s.contact_rate ?? 0}%</div>
              <div style={{fontSize:12,color:'#64748b',marginTop:4}}>{s.with_phone ?? 0} phone · {s.with_email ?? 0} email</div>
            </div>
          </div>

          {/* Row 2 — Secondary stats */}
          <div className="grid4" style={{marginBottom:16}}>
            <div style={{background:'white',borderRadius:10,padding:'14px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color:'#64748b',marginBottom:2}}>Total Conversations</div>
              <div style={{fontSize:22,fontWeight:700,color:'#1e293b'}}>{s.total_conversations ?? 0}</div>
            </div>
            <div style={{background:'white',borderRadius:10,padding:'14px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color:'#64748b',marginBottom:2}}>AI Replied</div>
              <div style={{fontSize:22,fontWeight:700,color:'#3b82f6'}}>{s.ai_replied ?? 0}</div>
            </div>
            <div style={{background:'white',borderRadius:10,padding:'14px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color:'#64748b',marginBottom:2}}>Warm Leads</div>
              <div style={{fontSize:22,fontWeight:700,color:'#f59e0b'}}>{s.warm_leads ?? 0}</div>
            </div>
            <div style={{background:'white',borderRadius:10,padding:'14px 20px',border:'1px solid #e2e8f0', borderLeft: s.needs_human > 0 ? '4px solid #ef4444' : '1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color:'#64748b',marginBottom:2}}>Needs Human</div>
              <div style={{fontSize:22,fontWeight:700,color: s.needs_human > 0 ? '#ef4444' : '#1e293b'}}>{s.needs_human ?? 0}</div>
            </div>
          </div>

          {/* Row 3 — Daily trend + Temperature pie */}
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background:'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color:'#1e293b',marginBottom:16,fontSize:14}}>Daily Lead & Conversation Trend</div>
              {data.daily_trend && data.daily_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.daily_trend} margin={{top:0,right:0,bottom:0,left:-20}}>
                    <XAxis dataKey="label" tick={{fontSize:10,fill:'#94a3b8'}} interval={Math.floor(data.daily_trend.length/7)}/>
                    <YAxis tick={{fontSize:10,fill:'#94a3b8'}}/>
                    <Tooltip contentStyle={{fontSize:12}}/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                    <Bar dataKey="leads" name="New Leads" fill="#3b82f6" radius={[3,3,0,0]}/>
                    <Bar dataKey="conversations" name="Conversations" fill="#8b5cf6" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{textAlign:'center',color:'#94a3b8',padding:40}}>No trend data for this period</div>}
              <div style={{display:'flex',gap:16,marginTop:8}}>
                <span style={{fontSize:11,color:'#64748b'}}>■ <span style={{color:'#3b82f6'}}>New Leads</span></span>
                <span style={{fontSize:11,color:'#64748b'}}>■ <span style={{color:'#8b5cf6'}}>Conversations</span></span>
              </div>
            </div>
            <div style={{background:'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color:'#1e293b',marginBottom:16,fontSize:14}}>Lead Temperature</div>
              {data.temperature_split && data.temperature_split.some(t => t.value > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data.temperature_split} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,value}) => `${name}: ${value}`} labelLine={false}>
                        {data.temperature_split.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                      </Pie>
                      <Tooltip/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:4}}>
                    {data.temperature_split.map((t,i) => (
                      <span key={i} style={{fontSize:11,color:'#64748b'}}>
                        <span style={{color:t.color,fontWeight:700}}>●</span> {t.name}: {t.value}
                      </span>
                    ))}
                  </div>
                </>
              ) : <div style={{textAlign:'center',color:'#94a3b8',padding:40}}>No temperature data</div>}
            </div>
          </div>

          {/* Row 4 — Module breakdown + Stage funnel */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background:'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color:'#1e293b',marginBottom:16,fontSize:14}}>Top Interested Modules / Products</div>
              {data.module_breakdown && data.module_breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.module_breakdown} layout="vertical" margin={{top:0,right:20,bottom:0,left:60}}>
                    <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}}/>
                    <YAxis type="category" dataKey="module" tick={{fontSize:10,fill:'#475569'}} width={60}/>
                    <Tooltip contentStyle={{fontSize:12}}/>
                    <Bar dataKey="count" fill="#10b981" radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{textAlign:'center',color:'#94a3b8',padding:40}}>No module data yet</div>}
            </div>
            <div style={{background:'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color:'#1e293b',marginBottom:16,fontSize:14}}>Lead Stage Funnel</div>
              {data.stage_funnel && data.stage_funnel.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.stage_funnel} layout="vertical" margin={{top:0,right:20,bottom:0,left:80}}>
                    <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}}/>
                    <YAxis type="category" dataKey="stage" tick={{fontSize:10,fill:'#475569'}} width={80}/>
                    <Tooltip contentStyle={{fontSize:12}}/>
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{textAlign:'center',color:'#94a3b8',padding:40}}>No stage data yet</div>}
            </div>
          </div>

          {/* Row 5 — Location + Mode */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background:'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color:'#1e293b',marginBottom:12,fontSize:14}}>Top Locations</div>
              {data.top_locations && data.top_locations.length > 0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {data.top_locations.map((loc,i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,fontSize:13,color:'#475569',fontWeight:500}}>{loc.location}</div>
                      <div style={{width:120,background:'#f1f5f9',borderRadius:4,height:8,overflow:'hidden'}}>
                        <div style={{width:`${Math.round(loc.count/data.top_locations[0].count*100)}%`,background:'#3b82f6',height:'100%',borderRadius:4}}/>
                      </div>
                      <div style={{fontSize:12,color:'#64748b',minWidth:24,textAlign:'right'}}>{loc.count}</div>
                    </div>
                  ))}
                </div>
              ) : <div style={{textAlign:'center',color:'#94a3b8',padding:20}}>No location data</div>}
            </div>
            <div style={{background:'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color:'#1e293b',marginBottom:12,fontSize:14}}>Online vs Offline Preference</div>
              {data.mode_breakdown && data.mode_breakdown.some(m => m.value > 0) ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data.mode_breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({name,value}) => value > 0 ? `${name}: ${value}` : ''} labelLine={false}>
                      {data.mode_breakdown.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{textAlign:'center',color:'#94a3b8',padding:40}}>No mode data</div>}
            </div>
          </div>

          {/* Row 6 — Top leads table */}
          <div style={{background:'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0',marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontWeight:600,color:'#1e293b',fontSize:14}}>Top Priority Leads</div>
              <button onClick={handleExport} style={{padding:'5px 12px',borderRadius:6,background:'#f1f5f9',border:'1px solid #e2e8f0',cursor:'pointer',fontSize:12,color:'#475569'}}>⬇ Export All as CSV</button>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'2px solid #f1f5f9'}}>
                  {['Name','Phone','Module','Temperature','Stage','Qualified','Last Active'].map(h => (
                    <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:11,color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.top_leads || []).map((lead,i) => (
                  <tr key={i} style={{borderBottom:'1px solid #f8fafc'}}>
                    <td style={{padding:'10px',fontSize:13,color:'#1e293b',fontWeight:500}}>{lead.name}</td>
                    <td style={{padding:'10px',fontSize:13,color:'#475569'}}>{lead.phone || '—'}</td>
                    <td style={{padding:'10px',fontSize:13,color:'#475569'}}>{lead.module || '—'}</td>
                    <td style={{padding:'10px'}}>
                      <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,
                        background: lead.temperature==='hot' ? '#fef2f2' : lead.temperature==='warm' ? '#fffbeb' : '#eff6ff',
                        color: lead.temperature==='hot' ? '#ef4444' : lead.temperature==='warm' ? '#f59e0b' : '#3b82f6'
                      }}>
                        {lead.temperature==='hot' ? '🔴' : lead.temperature==='warm' ? '🟡' : '🔵'} {lead.temperature}
                      </span>
                    </td>
                    <td style={{padding:'10px',fontSize:12,color:'#64748b'}}>{lead.stage || '—'}</td>
                    <td style={{padding:'10px',fontSize:12}}>
                      {lead.is_qualified
                        ? <span style={{color:'#10b981',fontWeight:600}}>✓ Yes</span>
                        : <span style={{color:'#94a3b8'}}>No</span>}
                    </td>
                    <td style={{padding:'10px',fontSize:12,color:'#94a3b8'}}>
                      {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
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
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [sendingRule, setSendingRule] = useState(null);
  const [sendConfirm, setSendConfirm] = useState(null); // {ruleId, count, message, target}
  const [bulkForm, setBulkForm] = useState({ target_group: 'hot_leads', message_template: '' });
  const [bulkPreview, setBulkPreview] = useState(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [toast, setToast] = useState('');
  const [newRule, setNewRule] = useState({ name: '', target_group: 'hot_leads', message_template: '' });
  const [saving, setSaving] = useState(false);

  const TARGET_LABELS = {
    hot_leads: { label: 'Hot Leads', color: '#ef4444', bg: '#fef2f2', emoji: '🔴' },
    warm_leads: { label: 'Warm Leads', color: '#f59e0b', bg: '#fffbeb', emoji: '🟡' },
    all_leads: { label: 'All Leads', color: '#3b82f6', bg: '#eff6ff', emoji: '📋' },
    qualified: { label: 'Qualified Leads', color: '#10b981', bg: '#f0fdf4', emoji: '✅' },
    needs_human: { label: 'Needs Human Review', color: '#8b5cf6', bg: '#f5f3ff', emoji: '👤' },
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchRules = () => {
    setLoading(true);
    fetch(`${API_BASE}/automation/rules`)
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setRules(d.rules || []); })
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, []);

  const handleToggle = (rule) => {
    const newState = !rule.is_active;
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: newState } : r));
    fetch(`${API_BASE}/automation/rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: newState })
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') showToast(`Rule "${rule.name}" ${newState ? 'enabled' : 'disabled'}`); })
      .catch(() => { setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !newState } : r)); showToast('Failed to update rule'); });
  };

  const handleSendNow = (rule) => {
    setSendingRule(rule.id);
    fetch(`${API_BASE}/automation/preview-audience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_group: rule.target_group, message_template: rule.message_template })
    })
      .then(r => r.json())
      .then(d => {
        setSendingRule(null);
        setSendConfirm({ ruleId: rule.id, count: d.count || 0, message: rule.message_template, target: rule.target_group, ruleName: rule.name });
      })
      .catch(() => { setSendingRule(null); showToast('Failed to preview audience'); });
  };

  const confirmSend = () => {
    if (!sendConfirm) return;
    setSendingRule(sendConfirm.ruleId);
    fetch(`${API_BASE}/automation/send-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_group: sendConfirm.target, message_template: sendConfirm.message })
    })
      .then(r => r.json())
      .then(d => {
        setSendingRule(null);
        setSendConfirm(null);
        showToast(d.message || `Queued ${d.queued} messages successfully!`);
      })
      .catch(() => { setSendingRule(null); setSendConfirm(null); showToast('Send failed'); });
  };

  const handleDeleteRule = (ruleId, ruleName) => {
    if (!window.confirm(`Delete rule "${ruleName}"?`)) return;
    fetch(`${API_BASE}/automation/rules/${ruleId}`, { method: 'DELETE' })
      .then(() => { setRules(prev => prev.filter(r => r.id !== ruleId)); showToast('Rule deleted'); })
      .catch(() => showToast('Delete failed'));
  };

  const handleAddRule = () => {
    if (!newRule.name.trim() || !newRule.message_template.trim()) { showToast('Name and message are required'); return; }
    setSaving(true);
    fetch(`${API_BASE}/automation/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newRule, is_active: false })
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setRules(prev => [...prev, d.rule]);
          setShowAddModal(false);
          setNewRule({ name: '', target_group: 'hot_leads', message_template: '' });
          showToast('Rule created!');
        } else showToast(d.detail || 'Failed to create rule');
      })
      .catch(() => showToast('Failed to create rule'))
      .finally(() => setSaving(false));
  };

  const handleBulkPreview = () => {
    if (!bulkForm.message_template.trim()) { showToast('Enter a message first'); return; }
    fetch(`${API_BASE}/automation/preview-audience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulkForm)
    })
      .then(r => r.json())
      .then(d => setBulkPreview(d.count || 0))
      .catch(() => showToast('Preview failed'));
  };

  const handleBulkSend = () => {
    if (!bulkForm.message_template.trim()) { showToast('Enter a message first'); return; }
    setBulkSending(true);
    fetch(`${API_BASE}/automation/send-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulkForm)
    })
      .then(r => r.json())
      .then(d => { setBulkResult(d); setBulkSending(false); })
      .catch(() => { showToast('Send failed'); setBulkSending(false); });
  };

  return (
    <section>
      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:'#1e293b',color:'white',padding:'12px 20px',borderRadius:10,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
          {toast}
        </div>
      )}

      <Title
        title="Automation"
        sub="Manage automation rules and send bulk messages to your lead groups"
        action={
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => setShowBulkModal(true)} style={{padding:'7px 14px',borderRadius:6,background:'#10b981',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
              <Zap size={14}/> Bulk Message
            </button>
            <button onClick={() => setShowAddModal(true)} style={{padding:'7px 14px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
              <Plus size={14}/> New Rule
            </button>
          </div>
        }
      />

      {/* Stats strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          { label:'Total Rules', value: rules.length, color:'#1e293b' },
          { label:'Active Rules', value: rules.filter(r=>r.is_active).length, color:'#10b981' },
          { label:'Inactive Rules', value: rules.filter(r=>!r.is_active).length, color:'#94a3b8' },
          { label:'Target Groups', value: [...new Set(rules.map(r=>r.target_group))].length, color:'#3b82f6' },
        ].map((s,i) => (
          <div key={i} style={{background:'white',borderRadius:10,padding:'14px 18px',border:'1px solid #e2e8f0'}}>
            <div style={{fontSize:11,color:'#64748b',marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Rules list */}
      {loading ? (
        <div style={{textAlign:'center',padding:40,color:'#64748b'}}>Loading automation rules...</div>
      ) : rules.length === 0 ? (
        <div style={{background:'white',borderRadius:10,border:'1px solid #e2e8f0',padding:48,textAlign:'center'}}>
          <Zap size={40} color="#e2e8f0" style={{margin:'0 auto 12px'}}/>
          <div style={{fontSize:16,fontWeight:600,color:'#1e293b',marginBottom:6}}>No automation rules yet</div>
          <div style={{fontSize:13,color:'#64748b',marginBottom:20}}>Create your first rule to start automating follow-ups</div>
          <button onClick={() => setShowAddModal(true)} style={{padding:'8px 20px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>+ Create First Rule</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {rules.map(rule => {
            const tg = TARGET_LABELS[rule.target_group] || { label: rule.target_group, color:'#64748b', bg:'#f8fafc', emoji:'📋' };
            const isSending = sendingRule === rule.id;
            return (
              <div key={rule.id} style={{background:'white',borderRadius:10,border:`1px solid ${rule.is_active ? '#bfdbfe' : '#e2e8f0'}`,padding:'18px 20px',display:'flex',alignItems:'flex-start',gap:16,transition:'border-color 0.2s'}}>
                {/* Left — toggle */}
                <div style={{paddingTop:2}}>
                  <button
                    onClick={() => handleToggle(rule)}
                    title={rule.is_active ? 'Click to disable' : 'Click to enable'}
                    style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center'}}
                  >
                    {rule.is_active
                      ? <ToggleRight size={32} color="#3b82f6"/>
                      : <ToggleLeft size={32} color="#cbd5e1"/>}
                  </button>
                </div>

                {/* Middle — content */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                    <span style={{fontSize:15,fontWeight:700,color:'#1e293b'}}>{rule.name}</span>
                    <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,background:tg.bg,color:tg.color}}>{tg.emoji} {tg.label}</span>
                    {rule.is_active
                      ? <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,background:'#f0fdf4',color:'#10b981'}}>● Active</span>
                      : <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,background:'#f8fafc',color:'#94a3b8'}}>○ Inactive</span>}
                  </div>
                  <div style={{fontSize:13,color:'#475569',background:'#f8fafc',borderRadius:6,padding:'10px 12px',fontFamily:'monospace',lineHeight:1.5,wordBreak:'break-word'}}>
                    {rule.message_template}
                  </div>
                  {rule.created_at && (
                    <div style={{fontSize:11,color:'#94a3b8',marginTop:6}}>Created {new Date(rule.created_at).toLocaleDateString()}</div>
                  )}
                </div>

                {/* Right — actions */}
                <div style={{display:'flex',flexDirection:'column',gap:8,minWidth:100}}>
                  <button
                    onClick={() => handleSendNow(rule)}
                    disabled={isSending}
                    style={{padding:'7px 14px',borderRadius:6,background: isSending ? '#e2e8f0' : '#3b82f6',color: isSending ? '#94a3b8' : 'white',border:'none',cursor: isSending ? 'not-allowed' : 'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}
                  >
                    <Play size={12}/> {isSending ? 'Loading...' : 'Send Now'}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id, rule.name)}
                    style={{padding:'7px 14px',borderRadius:6,background:'white',color:'#ef4444',border:'1px solid #fecaca',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}
                  >
                    <Trash2 size={12}/> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirm Send Modal ── */}
      {sendConfirm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',borderRadius:12,padding:28,width:440,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{fontSize:16,fontWeight:700,color:'#1e293b',marginBottom:8}}>Confirm Bulk Send</div>
            <div style={{fontSize:13,color:'#64748b',marginBottom:16}}>You are about to send a message to <strong style={{color:'#1e293b'}}>{sendConfirm.count} leads</strong> in the <strong style={{color:'#1e293b'}}>{TARGET_LABELS[sendConfirm.target]?.label || sendConfirm.target}</strong> group.</div>
            <div style={{background:'#f8fafc',borderRadius:8,padding:'12px 14px',fontSize:13,color:'#475569',fontFamily:'monospace',marginBottom:20,lineHeight:1.5}}>{sendConfirm.message}</div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={() => setSendConfirm(null)} style={{padding:'8px 18px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={confirmSend} style={{padding:'8px 18px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>Send to {sendConfirm.count} leads</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Rule Modal ── */}
      {showAddModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',borderRadius:12,padding:28,width:500,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,color:'#1e293b'}}>Create Automation Rule</div>
              <button onClick={() => setShowAddModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4}}>RULE NAME</label>
                <input value={newRule.name} onChange={e => setNewRule(p => ({...p, name: e.target.value}))} placeholder="e.g. Hot Lead Follow-Up" style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4}}>TARGET GROUP</label>
                <select value={newRule.target_group} onChange={e => setNewRule(p => ({...p, target_group: e.target.value}))} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,background:'white',boxSizing:'border-box'}}>
                  {Object.entries(TARGET_LABELS).map(([k,v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4}}>MESSAGE TEMPLATE</label>
                <textarea value={newRule.message_template} onChange={e => setNewRule(p => ({...p, message_template: e.target.value}))} placeholder="Hi {name}, just checking in..." rows={4} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
                <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>Use {'{name}'} to personalise with the lead's name</div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button onClick={() => setShowAddModal(false)} style={{padding:'8px 18px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={handleAddRule} disabled={saving} style={{padding:'8px 18px',borderRadius:6,background: saving ? '#93c5fd' : '#3b82f6',color:'white',border:'none',cursor: saving ? 'not-allowed' : 'pointer',fontSize:13,fontWeight:600}}>{saving ? 'Saving...' : 'Create Rule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Message Modal ── */}
      {showBulkModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',borderRadius:12,padding:28,width:520,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,color:'#1e293b'}}>Send Bulk Message</div>
              <button onClick={() => { setShowBulkModal(false); setBulkPreview(null); setBulkResult(null); setBulkForm({target_group:'hot_leads',message_template:''}); }} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8'}}><X size={18}/></button>
            </div>

            {bulkResult ? (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:40,marginBottom:12}}>✅</div>
                <div style={{fontSize:16,fontWeight:700,color:'#10b981',marginBottom:6}}>Messages Queued!</div>
                <div style={{fontSize:13,color:'#64748b',marginBottom:20}}>{bulkResult.message}</div>
                <button onClick={() => { setShowBulkModal(false); setBulkPreview(null); setBulkResult(null); setBulkForm({target_group:'hot_leads',message_template:''}); }} style={{padding:'8px 20px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>Done</button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4}}>TARGET GROUP</label>
                  <select value={bulkForm.target_group} onChange={e => { setBulkForm(p => ({...p, target_group: e.target.value})); setBulkPreview(null); }} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,background:'white',boxSizing:'border-box'}}>
                    {Object.entries(TARGET_LABELS).map(([k,v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4}}>MESSAGE</label>
                  <textarea value={bulkForm.message_template} onChange={e => { setBulkForm(p => ({...p, message_template: e.target.value})); setBulkPreview(null); }} placeholder="Hi {name}, just checking in..." rows={4} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>Use {'{name}'} to personalise with the lead's name</div>
                </div>

                {bulkPreview !== null && (
                  <div style={{background: bulkPreview > 0 ? '#f0fdf4' : '#fef2f2',border:`1px solid ${bulkPreview > 0 ? '#bbf7d0' : '#fecaca'}`,borderRadius:8,padding:'10px 14px',fontSize:13,color: bulkPreview > 0 ? '#166534' : '#dc2626',fontWeight:600}}>
                    {bulkPreview > 0 ? `✓ ${bulkPreview} leads will receive this message` : '⚠ No leads found in this group'}
                  </div>
                )}

                <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
                  <button onClick={handleBulkPreview} style={{padding:'8px 16px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',cursor:'pointer',fontSize:13}}>Preview Audience</button>
                  <button onClick={handleBulkSend} disabled={bulkSending || bulkPreview === 0} style={{padding:'8px 18px',borderRadius:6,background: bulkSending ? '#93c5fd' : '#3b82f6',color:'white',border:'none',cursor: bulkSending ? 'not-allowed' : 'pointer',fontSize:13,fontWeight:600}}>
                    {bulkSending ? 'Sending...' : bulkPreview !== null ? `Send to ${bulkPreview} leads` : 'Send'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── BUSINESSES ADMIN ────────────────────────────────────────────────────────

const INDUSTRIES = [
  'Education / Training', 'E-commerce / Retail', 'Real Estate', 'Healthcare',
  'Finance / Banking', 'IT Services', 'Consulting', 'Food & Beverage',
  'Fitness / Wellness', 'Travel / Hospitality', 'Legal Services', 'Other'
];

function BusinessesAdmin({ activeBusiness, setPage }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ name: '', industry: 'Education / Training', instagram_handle: '', description: '' });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchBusinesses = () => {
    setLoading(true);
    fetch(`${API_BASE}/businesses/`)
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setBusinesses(d.businesses || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBusinesses(); }, []);

  const handleAdd = () => {
    if (!form.name.trim()) { showToast('Business name is required'); return; }
    setSaving(true);
    fetch(`${API_BASE}/businesses/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setBusinesses(prev => [...prev, d.business]);
          setShowAddModal(false);
          setForm({ name: '', industry: 'Education / Training', instagram_handle: '', description: '' });
          showToast('Business workspace created!');
        } else showToast(d.detail || 'Failed to create business');
      })
      .catch(() => showToast('Failed to create business'))
      .finally(() => setSaving(false));
  };

  const INDUSTRY_COLORS = {
    'Education / Training': '#3b82f6',
    'E-commerce / Retail': '#10b981',
    'Real Estate': '#f59e0b',
    'Healthcare': '#ef4444',
    'Finance / Banking': '#8b5cf6',
    'IT Services': '#06b6d4',
    'Consulting': '#f97316',
    'Food & Beverage': '#84cc16',
  };

  return (
    <section>
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:'#1e293b',color:'white',padding:'12px 20px',borderRadius:10,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
          {toast}
        </div>
      )}

      <Title
        title="Business Workspaces"
        sub="Manage all businesses on this platform. Each workspace has isolated leads, conversations, and settings."
        action={
          <button onClick={() => setShowAddModal(true)} style={{padding:'7px 16px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
            <Plus size={14}/> Add Business
          </button>
        }
      />

      {/* Platform stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          { label:'Total Workspaces', value: businesses.length, color:'#1e293b' },
          { label:'Active', value: businesses.filter(b=>b.is_active).length, color:'#10b981' },
          { label:'Industries', value: [...new Set(businesses.map(b=>b.industry).filter(Boolean))].length, color:'#3b82f6' },
          { label:'Current Workspace', value: activeBusiness?.name || '—', color:'#8b5cf6', small: true },
        ].map((s,i) => (
          <div key={i} style={{background:'white',borderRadius:10,padding:'14px 18px',border:'1px solid #e2e8f0'}}>
            <div style={{fontSize:11,color:'#64748b',marginBottom:4}}>{s.label}</div>
            <div style={{fontSize: s.small ? 14 : 24,fontWeight:700,color:s.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Business cards grid */}
      {loading ? (
        <div style={{textAlign:'center',padding:40,color:'#64748b'}}>Loading workspaces...</div>
      ) : businesses.length === 0 ? (
        <div style={{background:'white',borderRadius:10,border:'1px solid #e2e8f0',padding:48,textAlign:'center'}}>
          <Building2 size={40} color="#e2e8f0" style={{margin:'0 auto 12px'}}/>
          <div style={{fontSize:16,fontWeight:600,color:'#1e293b',marginBottom:6}}>No business workspaces yet</div>
          <div style={{fontSize:13,color:'#64748b',marginBottom:20}}>Your first workspace will be created when you run the SQL migration</div>
          <button onClick={() => setShowAddModal(true)} style={{padding:'8px 20px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>+ Add First Business</button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {businesses.map(biz => {
            const isActive = activeBusiness?.id === biz.id;
            const color = INDUSTRY_COLORS[biz.industry] || '#64748b';
            return (
              <div key={biz.id} style={{background:'white',borderRadius:12,border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',padding:20,position:'relative',transition:'border-color 0.2s'}}>
                {isActive && (
                  <div style={{position:'absolute',top:12,right:12,background:'#eff6ff',color:'#3b82f6',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Active</div>
                )}
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:10,background:color,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:18,fontWeight:700,flexShrink:0}}>
                    {(biz.name||'?')[0].toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{biz.name}</div>
                    <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{biz.industry || 'Business'}</div>
                  </div>
                </div>

                {biz.description && (
                  <div style={{fontSize:12,color:'#64748b',marginBottom:12,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{biz.description}</div>
                )}

                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
                  {biz.instagram_handle && (
                    <span style={{fontSize:11,color:'#8b5cf6',background:'#f5f3ff',padding:'2px 8px',borderRadius:10,fontWeight:500}}>
                      📸 {biz.instagram_handle}
                    </span>
                  )}
                  <span style={{fontSize:11,color: biz.is_active ? '#10b981' : '#94a3b8',background: biz.is_active ? '#f0fdf4' : '#f8fafc',padding:'2px 8px',borderRadius:10,fontWeight:500}}>
                    {biz.is_active ? '● Active' : '○ Inactive'}
                  </span>
                </div>

                <div style={{display:'flex',gap:8}}>
                  <button
                    onClick={() => setPage('Overview')}
                    style={{flex:1,padding:'7px',borderRadius:6,background: isActive ? '#3b82f6' : '#f1f5f9',color: isActive ? 'white' : '#475569',border:'none',cursor:'pointer',fontSize:12,fontWeight:600}}
                  >
                    {isActive ? '✓ Current Workspace' : 'View Dashboard'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How it works info box */}
      <div style={{background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:10,padding:'16px 20px',marginTop:20}}>
        <div style={{fontWeight:600,color:'#0369a1',fontSize:13,marginBottom:6}}>💡 How Multi-Business Works</div>
        <div style={{fontSize:12,color:'#0c4a6e',lineHeight:1.7}}>
          Each business workspace has its own isolated leads, conversations, automation rules, and settings.
          Switch workspaces using the dropdown in the top navigation bar. Future versions will include
          per-business login so each client only sees their own data.
        </div>
      </div>

      {/* Add Business Modal */}
      {showAddModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',borderRadius:12,padding:28,width:500,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,color:'#1e293b'}}>Add New Business Workspace</div>
              <button onClick={() => setShowAddModal(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4}}>BUSINESS NAME *</label>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Archon Solutions" style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4}}>INDUSTRY</label>
                <select value={form.industry} onChange={e => setForm(p=>({...p,industry:e.target.value}))} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,background:'white',boxSizing:'border-box'}}>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4}}>INSTAGRAM HANDLE</label>
                <input value={form.instagram_handle} onChange={e => setForm(p=>({...p,instagram_handle:e.target.value}))} placeholder="@yourbusiness" style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4}}>DESCRIPTION</label>
                <textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Brief description of the business..." rows={3} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button onClick={() => setShowAddModal(false)} style={{padding:'8px 18px',borderRadius:6,border:'1px solid #e2e8f0',background:'white',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={handleAdd} disabled={saving} style={{padding:'8px 18px',borderRadius:6,background: saving ? '#93c5fd' : '#3b82f6',color:'white',border:'none',cursor: saving ? 'not-allowed' : 'pointer',fontSize:13,fontWeight:600}}>{saving ? 'Creating...' : 'Create Workspace'}</button>
            </div>
          </div>
        </div>
      )}
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

// ─── INTEGRATIONS PAGE ─────────────────────────────────────────────────────

const INTEGRATIONS_CONFIG = [
  {
    id: 'instagram',
    name: 'Instagram DM',
    description: 'Receive and reply to Instagram Direct Messages. Required for AI-powered DM automation.',
    icon: '📸',
    color: '#e1306c',
    bg: '#fdf2f8',
    category: 'Messaging',
    fields: [
      { key: 'page_access_token', label: 'Page Access Token', type: 'password', placeholder: 'EAAxxxxxxx...' },
      { key: 'instagram_account_id', label: 'Instagram Account ID', type: 'text', placeholder: '17841xxxxxxxxx' },
    ],
    docs_url: 'https://developers.facebook.com/docs/messenger-platform',
    status_note: 'Webhook must be configured on Meta Developer Portal'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Send and receive WhatsApp messages via the WhatsApp Business API. Ideal for follow-up sequences.',
    icon: '💬',
    color: '#25d366',
    bg: '#f0fdf4',
    category: 'Messaging',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: '1234567890' },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'EAAxxxxxxx...' },
      { key: 'verify_token', label: 'Webhook Verify Token', type: 'text', placeholder: 'your_verify_token' },
    ],
    docs_url: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    status_note: 'Requires WhatsApp Business API approval from Meta'
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Automatically export leads and conversations to a Google Sheet. Great for reporting and CRM sync.',
    icon: '📊',
    color: '#34a853',
    bg: '#f0fdf4',
    category: 'Data',
    fields: [
      { key: 'spreadsheet_id', label: 'Spreadsheet ID', type: 'text', placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms' },
      { key: 'service_account_email', label: 'Service Account Email', type: 'text', placeholder: 'myapp@project.iam.gserviceaccount.com' },
      { key: 'private_key', label: 'Private Key (JSON)', type: 'password', placeholder: '-----BEGIN PRIVATE KEY-----...' },
    ],
    docs_url: 'https://developers.google.com/sheets/api',
    status_note: 'Share your Google Sheet with the service account email'
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    description: 'Send lead and conversation events to any external URL. Use to connect HubSpot, Zoho, Zapier, or any CRM.',
    icon: '🔗',
    color: '#6366f1',
    bg: '#f5f3ff',
    category: 'Developer',
    fields: [
      { key: 'url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.zapier.com/hooks/catch/...' },
      { key: 'secret', label: 'Secret Key (optional)', type: 'password', placeholder: 'Used to verify requests' },
    ],
    docs_url: null,
    status_note: 'Events: new_lead, lead_qualified, conversation_started'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Power the AI assistant, conversation summaries, and lead scoring with OpenAI GPT models.',
    icon: '🤖',
    color: '#10a37f',
    bg: '#f0fdf9',
    category: 'AI',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'sk-xxxxxxxxxxxxxxxx' },
      { key: 'model', label: 'Model', type: 'text', placeholder: 'gpt-4o' },
    ],
    docs_url: 'https://platform.openai.com/docs',
    status_note: 'Used for AI replies, summaries, and lead analysis'
  },
  {
    id: 'supabase',
    name: 'Supabase (Database)',
    description: 'Your primary database for leads, conversations, and business rules. Already connected.',
    icon: '🗄️',
    color: '#3ecf8e',
    bg: '#f0fdf4',
    category: 'Data',
    fields: [
      { key: 'url', label: 'Supabase URL', type: 'text', placeholder: 'https://xxxx.supabase.co' },
      { key: 'anon_key', label: 'Anon Key', type: 'password', placeholder: 'eyJhbGci...' },
    ],
    docs_url: 'https://supabase.com/docs',
    status_note: 'Core database — always required'
  },
];

function IntegrationsPage({ activeBusiness }) {
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // integration config id
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('All');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';

  const fetchIntegrations = () => {
    setLoading(true);
    fetch(`${API_BASE}/integrations/`, {
      headers: { 'X-Business-ID': bizId }
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setIntegrations(d.integrations || {}); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchIntegrations(); }, [bizId]);

  const openModal = (integ) => {
    setActiveModal(integ);
    // Pre-fill with existing saved values (masked for passwords)
    const saved = integrations[integ.id] || {};
    const prefilled = {};
    integ.fields.forEach(f => { prefilled[f.key] = saved[f.key] || ''; });
    setFormValues(prefilled);
  };

  const handleSave = () => {
    if (!activeModal) return;
    setSaving(true);
    fetch(`${API_BASE}/integrations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Business-ID': bizId },
      body: JSON.stringify({
        provider: activeModal.id,
        is_connected: true,
        credentials: formValues
      })
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setIntegrations(prev => ({ ...prev, [activeModal.id]: { ...prev[activeModal.id], is_connected: true } }));
          setActiveModal(null);
          showToast(`${activeModal.name} connected successfully!`);
        } else showToast(d.detail || 'Failed to save');
      })
      .catch(() => showToast('Failed to save'))
      .finally(() => setSaving(false));
  };

  const handleDisconnect = (integId, integName) => {
    if (!window.confirm(`Disconnect ${integName}? This will disable the integration for this workspace.`)) return;
    fetch(`${API_BASE}/integrations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Business-ID': bizId },
      body: JSON.stringify({ provider: integId, is_connected: false, credentials: {} })
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setIntegrations(prev => ({ ...prev, [integId]: { ...prev[integId], is_connected: false } }));
          showToast(`${integName} disconnected`);
        }
      })
      .catch(() => showToast('Failed to disconnect'));
  };

  const categories = ['All', ...new Set(INTEGRATIONS_CONFIG.map(i => i.category))];
  const filtered = filter === 'All' ? INTEGRATIONS_CONFIG : INTEGRATIONS_CONFIG.filter(i => i.category === filter);
  const connectedCount = INTEGRATIONS_CONFIG.filter(i => integrations[i.id]?.is_connected).length;

  return (
    <section>
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:'#1e293b',color:'white',padding:'12px 20px',borderRadius:10,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
          {toast}
        </div>
      )}

      <Title
        title="Integrations"
        sub={`Connect channels, databases, and tools for ${activeBusiness?.name || 'your workspace'}`}
        action={
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:8,background:'#f0fdf4',border:'1px solid #bbf7d0'}}>
            <Wifi size={14} color="#10b981"/>
            <span style={{fontSize:13,fontWeight:600,color:'#166534'}}>{connectedCount} of {INTEGRATIONS_CONFIG.length} connected</span>
          </div>
        }
      />

      {/* Category filter tabs */}
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{padding:'6px 14px',borderRadius:20,border:'1px solid',borderColor: filter===cat ? '#3b82f6' : '#e2e8f0',background: filter===cat ? '#eff6ff' : 'white',color: filter===cat ? '#3b82f6' : '#64748b',fontSize:12,fontWeight: filter===cat ? 600 : 400,cursor:'pointer',transition:'all 0.15s'}}
          >{cat}</button>
        ))}
      </div>

      {/* Integration cards grid */}
      {loading ? (
        <div style={{textAlign:'center',padding:40,color:'#64748b'}}>Loading integrations...</div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:16}}>
          {filtered.map(integ => {
            const status = integrations[integ.id] || {};
            const isConnected = status.is_connected || false;
            return (
              <div key={integ.id} style={{background:'white',borderRadius:12,border: isConnected ? `2px solid ${integ.color}30` : '1px solid #e2e8f0',padding:20,display:'flex',flexDirection:'column',gap:14,transition:'border-color 0.2s'}}>
                {/* Header */}
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:46,height:46,borderRadius:10,background:integ.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                    {integ.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                      <span style={{fontSize:15,fontWeight:700,color:'#1e293b'}}>{integ.name}</span>
                      <span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:10,background: isConnected ? '#f0fdf4' : '#f8fafc',color: isConnected ? '#16a34a' : '#94a3b8',border:`1px solid ${isConnected ? '#bbf7d0' : '#e2e8f0'}`}}>
                        {isConnected ? '● Connected' : '○ Not connected'}
                      </span>
                    </div>
                    <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:'#f1f5f9',color:'#64748b',fontWeight:500}}>{integ.category}</span>
                  </div>
                </div>

                {/* Description */}
                <div style={{fontSize:12,color:'#64748b',lineHeight:1.6}}>{integ.description}</div>

                {/* Status note */}
                <div style={{fontSize:11,color: isConnected ? '#16a34a' : '#94a3b8',background: isConnected ? '#f0fdf4' : '#f8fafc',borderRadius:6,padding:'6px 10px',display:'flex',alignItems:'center',gap:6}}>
                  {isConnected ? <Wifi size={11}/> : <WifiOff size={11}/>}
                  {isConnected ? `Active — ${integ.status_note}` : integ.status_note}
                </div>

                {/* Last synced */}
                {isConnected && status.last_synced && (
                  <div style={{fontSize:11,color:'#94a3b8'}}>Last updated: {new Date(status.last_synced).toLocaleString()}</div>
                )}

                {/* Actions */}
                <div style={{display:'flex',gap:8,marginTop:'auto'}}>
                  <button
                    onClick={() => openModal(integ)}
                    style={{flex:1,padding:'8px',borderRadius:6,background: isConnected ? '#f8fafc' : integ.bg,color: isConnected ? '#475569' : integ.color,border:`1px solid ${isConnected ? '#e2e8f0' : integ.color+'40'}`,cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}
                  >
                    <Key size={12}/> {isConnected ? 'Update Credentials' : 'Connect'}
                  </button>
                  {isConnected && (
                    <button
                      onClick={() => handleDisconnect(integ.id, integ.name)}
                      style={{padding:'8px 12px',borderRadius:6,background:'white',color:'#ef4444',border:'1px solid #fecaca',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5}}
                    >
                      <WifiOff size={12}/> Disconnect
                    </button>
                  )}
                  {integ.docs_url && (
                    <a href={integ.docs_url} target="_blank" rel="noreferrer" style={{padding:'8px 10px',borderRadius:6,background:'white',color:'#94a3b8',border:'1px solid #e2e8f0',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',textDecoration:'none'}}>
                      <ExternalLink size={12}/>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div style={{background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:10,padding:'16px 20px',marginTop:20}}>
        <div style={{fontWeight:600,color:'#0369a1',fontSize:13,marginBottom:6}}>💡 How Integrations Work</div>
        <div style={{fontSize:12,color:'#0c4a6e',lineHeight:1.7}}>
          Each integration is stored per workspace — different businesses can have different channels connected.
          Credentials are encrypted and stored securely in your Supabase database.
          Connecting an integration here enables the relevant features across the dashboard (e.g., connecting WhatsApp enables bulk WhatsApp messaging in the Automation page).
        </div>
      </div>

      {/* ── Credentials Modal ── */}
      {activeModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'white',borderRadius:14,padding:28,width:520,maxWidth:'92vw',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:8,background:activeModal.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{activeModal.icon}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:'#1e293b'}}>Connect {activeModal.name}</div>
                  <div style={{fontSize:11,color:'#94a3b8'}}>{activeModal.category}</div>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',padding:4}}><X size={18}/></button>
            </div>

            <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#92400e',marginBottom:18,display:'flex',gap:8,alignItems:'flex-start'}}>
              <AlertTriangle size={14} style={{flexShrink:0,marginTop:1}}/>
              <span>Credentials are stored in your Supabase database. Never share your API keys publicly.</span>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {activeModal.fields.map(field => (
                <div key={field.key}>
                  <label style={{fontSize:12,fontWeight:600,color:'#475569',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.04em'}}>{field.label}</label>
                  <input
                    type={field.type}
                    value={formValues[field.key] || ''}
                    onChange={e => setFormValues(p => ({...p, [field.key]: e.target.value}))}
                    placeholder={field.placeholder}
                    style={{width:'100%',padding:'9px 11px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,fontFamily: field.type==='password' ? 'monospace' : 'inherit',boxSizing:'border-box',color:'#1e293b'}}
                  />
                </div>
              ))}
            </div>

            {activeModal.docs_url && (
              <a href={activeModal.docs_url} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#3b82f6',marginTop:14,textDecoration:'none'}}>
                <ExternalLink size={12}/> View {activeModal.name} documentation
              </a>
            )}

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:22}}>
              <button onClick={() => setActiveModal(null)} style={{padding:'9px 18px',borderRadius:7,border:'1px solid #e2e8f0',background:'white',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{padding:'9px 20px',borderRadius:7,background: saving ? '#93c5fd' : '#3b82f6',color:'white',border:'none',cursor: saving ? 'not-allowed' : 'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:7}}
              >
                {saving ? <RefreshCw size={13} style={{animation:'spin 1s linear infinite'}}/> : <CheckCircle size={13}/>}
                {saving ? 'Saving...' : 'Save & Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

createRoot(document.getElementById('root')).render(<App />);

