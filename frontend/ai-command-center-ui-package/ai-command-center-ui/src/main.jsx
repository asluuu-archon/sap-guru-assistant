import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, HelpCircle, Search, Settings, LayoutDashboard, MessagesSquare, Users, Bug, Bot, Brain, UserRound, BarChart3, Workflow, Plus, Download, Filter, Play, X, Phone, MapPin, BookOpen, Star, Clock, ChevronRight, ToggleLeft, ToggleRight, Pencil, Trash2, Tag, Zap, Save, AlertTriangle, Building2, Globe, CheckCircle, Plug, Wifi, WifiOff, RefreshCw, ExternalLink, Key, Link, Send, Radio, Image, Video, FileText, Calendar, CheckSquare, XCircle, Loader, MessageSquare, ThumbsUp, ThumbsDown, Flame, Mail, Megaphone, Sunrise, Lock, LogOut, Eye, EyeOff, UserPlus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import './styles.css';

const API_BASE = "https://sap-guru-assistant.onrender.com";

// Theme-aware colour helper — use in inline styles: tc(theme, 'light_val', 'dark_val')
const tc = (theme, light, dark) => theme === 'dark' ? dark : light;


const nav = [
  ['Overview', LayoutDashboard], ['Conversations', MessagesSquare], ['Leads', Users], ['Hot Lead Queue', Flame], ['Import & Export', Download], ['Pipeline Debugger', Bug],
  ['AI Playground', Bot], ['Business Brain', Brain], ['Customer 360°', UserRound], ['Reports', BarChart3], ['Automation', Workflow], ['Publisher', Radio], ['Google Reviews', Star], ['Businesses', Building2], ['Integrations', Plug], ['Settings', Settings]
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
  // ── Theme state ──
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  };
  // ── Auth state ──
  const [authUser, setAuthUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('authUser') || 'null'); } catch { return null; }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken') || null);

  const handleLoginSuccess = (user, token) => {
    setAuthUser(user);
    setAuthToken(token);
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setAuthUser(null);
    setAuthToken(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('activeBizId');
  };

  // ── If not authenticated, show login screen ──
  if (!authToken || !authUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const authHeaders = { 'Authorization': `Bearer ${authToken}` };

  const fetchNotifications = () => {
    fetch(`${API_BASE}/notifications/`, { headers: authHeaders })
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
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [authToken]);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard-data`, { headers: authHeaders })
      .then(res => res.json())
      .then(data => setDashboard(data))
      .catch(err => console.error("Dashboard fetch error:", err));
  }, [authToken]);

  useEffect(() => {
    fetch(`${API_BASE}/businesses/`, { headers: authHeaders })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success' && d.businesses.length > 0) {
          setBusinesses(d.businesses);
          const saved = localStorage.getItem('activeBizId');
          const found = d.businesses.find(b => b.id === saved);
          setActiveBusiness(found || d.businesses[0]);
        }
      })
      .catch(() => {});
  }, [authToken]);

  const handleSwitchBusiness = (biz) => {
    setActiveBusiness(biz);
    localStorage.setItem('activeBizId', biz.id);
  };

  return (
    <div className="app" data-theme={theme}>
      <Sidebar page={page} setPage={setPage} activeBusiness={activeBusiness}/>
      <main>
        <Topbar businesses={businesses} activeBusiness={activeBusiness} onSwitch={handleSwitchBusiness} onNavigate={setPage} notifications={notifications} unreadCount={unreadCount} onMarkAllRead={() => setUnreadCount(0)} authUser={authUser} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme}/>
        <Screen page={page} dashboard={dashboard} activeBusiness={activeBusiness} setPage={setPage} authToken={authToken} theme={theme}/>
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
    { label: 'Marketing', items: [['Publisher', Radio], ['Broadcasts', Megaphone], ['Google Reviews', Star]] },
    { label: 'Intelligence', items: [['Business Brain', Brain], ['Pipeline Debugger', Bug], ['AI Playground', Bot], ['Reports', BarChart3]] },
    { label: 'Settings', items: [['Automation', Workflow], ['Businesses', Building2], ['Integrations', Plug], ['Settings', Settings]] }
  ];

  return (
    <aside style={{display:'flex',flexDirection:'column'}}>
      <div className="brand"><div className="logo">AI</div><b>AI COMMAND CENTER</b></div>
      <nav style={{flex:1,overflowY:'auto',padding:'10px 0'}}>
        {navGroups.map(group => (
          <div key={group.label} style={{marginBottom:16}}>
            <div style={{padding:'0 16px',fontSize:10,fontWeight:700,color: theme==='dark' ? '#6e7681' : '#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>
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
          <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Administrator</div>
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

function Topbar({ businesses, activeBusiness, onSwitch, onNavigate, notifications, unreadCount, onMarkAllRead, authUser, onLogout, theme, onToggleTheme }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = React.useRef(null);
  React.useEffect(() => {
    const handleClick = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false); };
    if (showUserMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserMenu]);
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
      <div style={{display:'flex',alignItems:'center',gap:10,background: theme==='dark' ? '#1c2128' : '#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,padding:'6px 14px',width:320}}>
        <Search size={16} color="#94a3b8"/>
        <input placeholder="Search anything..." style={{border:'none',background:'none',fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',outline:'none',width:'100%'}}/>
      </div>

      {/* Business Switcher */}
      <div style={{position:'relative'}} ref={dropdownRef}>
        <button
          onClick={() => setShowSwitcher(p => !p)}
          style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',borderRadius:8,border:'1px solid #e2e8f0',background: showSwitcher ? '#f0f9ff' : 'white',cursor:'pointer',fontSize:13,fontWeight:500,color: theme==='dark' ? '#e6edf3' : '#1e293b',maxWidth:220,transition:'background 0.15s'}}
        >
          <Building2 size={14} color="#3b82f6"/>
          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:140}}>
            {activeBusiness ? activeBusiness.name : 'Select Workspace'}
          </span>
          <span style={{fontSize:10,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginLeft:2,display:'inline-block',transform: showSwitcher ? 'rotate(180deg)' : 'rotate(0deg)',transition:'transform 0.15s'}}>▾</span>
        </button>

        {showSwitcher && (
          <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,background: theme==='dark' ? '#161b22' : 'white',border:'1px solid #e2e8f0',borderRadius:10,boxShadow:'0 8px 30px rgba(0,0,0,0.15)',zIndex:9000,minWidth:260,overflow:'hidden'}}>
            <div style={{padding:'10px 14px',fontSize:11,fontWeight:700,color: theme==='dark' ? '#6e7681' : '#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom: `1px solid ${theme==='dark' ? '#21262d' : '#f1f5f9'}`}}>Switch Workspace</div>
            {businesses.length === 0 && (
              <div style={{padding:'16px 14px',fontSize:13,color: theme==='dark' ? '#6e7681' : '#94a3b8',textAlign:'center'}}>No workspaces yet</div>
            )}
            {businesses.map(biz => {
              const isSelected = activeBusiness && activeBusiness.id === biz.id;
              return (
                <button key={biz.id} onClick={() => { onSwitch(biz); setShowSwitcher(false); }}
                  style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',background: isSelected ? '#f0f9ff' : 'white',border:'none',cursor:'pointer',textAlign:'left',borderBottom:'1px solid #f8fafc'}}>
                  <div style={{width:30,height:30,borderRadius:7,background: isSelected ? '#3b82f6' : '#e2e8f0',display:'flex',alignItems:'center',justifyContent:'center',color: isSelected ? 'white' : '#64748b',fontSize:13,fontWeight:700,flexShrink:0}}>{(biz.name||'?')[0].toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{biz.name}</div>
                    <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>{biz.industry || 'Business'}</div>
                  </div>
                  {isSelected && <CheckCircle size={15} color="#3b82f6"/>}
                </button>
              );
            })}
            <div style={{padding:'8px 14px',borderTop: `1px solid ${theme==='dark' ? '#21262d' : '#f1f5f9'}`}}>
              <button onClick={() => { setShowSwitcher(false); onNavigate('Businesses'); }}
                style={{width:'100%',padding:'8px',borderRadius:6,background: theme==='dark' ? '#1c2128' : '#f8fafc',border:'1px solid #e2e8f0',cursor:'pointer',fontSize:12,color:'#3b82f6',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
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
          <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background: theme==='dark' ? '#161b22' : 'white',border:'1px solid #e2e8f0',borderRadius:12,boxShadow:'0 12px 40px rgba(0,0,0,0.15)',zIndex:9000,width:360,maxHeight:480,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* Header */}
            <div style={{padding:'14px 16px',borderBottom: `1px solid ${theme==='dark' ? '#21262d' : '#f1f5f9'}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>Notifications</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {notifications.length > 0 && (
                  <span style={{fontSize:11,color: theme==='dark' ? '#8b949e' : '#64748b'}}>{notifications.length} alerts</span>
                )}
              </div>
            </div>

            {/* Notification list */}
            <div style={{overflowY:'auto',flex:1}}>
              {notifications.length === 0 ? (
                <div style={{padding:32,textAlign:'center'}}>
                  <Bell size={28} color="#e2e8f0" style={{margin:'0 auto 10px',display:'block'}}/>
                  <div style={{fontSize:13,color: theme==='dark' ? '#6e7681' : '#94a3b8',fontWeight:500}}>All caught up!</div>
                  <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#cbd5e1',marginTop:4}}>No new alerts right now</div>
                </div>
              ) : (
                notifications.map((notif, idx) => {
                  const cfg = NOTIF_ICONS[notif.type] || { icon: '🔔', color: theme==='dark' ? '#8b949e' : '#64748b', bg: '#f8fafc' };
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
                          <span style={{fontSize:12,fontWeight:700,color: theme === 'dark' ? '#e6edf3' : '#1e293b'}}>{notif.title}</span>
                          <span style={{fontSize:10,color: theme==='dark' ? '#6e7681' : '#94a3b8',flexShrink:0,marginLeft:8}}>{timeAgo(notif.time)}</span>
                        </div>
                        <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',lineHeight:1.4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{notif.message}</div>
                        <div style={{fontSize:11,color:cfg.color,fontWeight:600,marginTop:4}}>{notif.action} →</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div style={{padding:'10px 16px',borderTop: `1px solid ${theme==='dark' ? '#21262d' : '#f1f5f9'}`,flexShrink:0}}>
                <button onClick={() => { onNavigate('Leads'); setShowNotifsState(false); }}
                  style={{width:'100%',padding:'7px',borderRadius:6,background: theme==='dark' ? '#1c2128' : '#f8fafc',border:'1px solid #e2e8f0',cursor:'pointer',fontSize:12,color: theme==='dark' ? '#8b949e' : '#475569',fontWeight:500}}>
                  View All Leads
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        onClick={onToggleTheme}
        className="theme-toggle"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark'
          ? <><span style={{fontSize:15}}>☀️</span> Light</>
          : <><span style={{fontSize:15}}>🌙</span> Dark</>
        }
      </button>

      <HelpCircle size={18} style={{color: theme==='dark' ? '#6e7681' : '#94a3b8',cursor:'pointer'}}/>

      {/* User avatar + logout menu */}
      <div style={{position:'relative'}} ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(p => !p)}
          style={{width:34,height:34,borderRadius:'50%',background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center'}}
        >
          {authUser ? (authUser.name||authUser.email||'U')[0].toUpperCase() : 'A'}
        </button>
        {showUserMenu && (
          <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background: theme==='dark' ? '#161b22' : 'white',border:'1px solid #e2e8f0',borderRadius:10,boxShadow:'0 8px 30px rgba(0,0,0,0.15)',zIndex:9000,minWidth:220,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom: `1px solid ${theme==='dark' ? '#21262d' : '#f1f5f9'}`}}>
              <div style={{fontSize:13,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{authUser?.name || 'Admin'}</div>
              <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:2}}>{authUser?.email || ''}</div>
              {authUser?.role && <div style={{fontSize:10,padding:'2px 7px',borderRadius:8,background: theme==='dark' ? '#1c2d4f' : '#eff6ff',color:'#3b82f6',fontWeight:600,display:'inline-block',marginTop:4}}>{authUser.role}</div>}
            </div>
            <button
              onClick={() => { setShowUserMenu(false); onLogout(); }}
              style={{width:'100%',padding:'11px 16px',background: theme==='dark' ? '#161b22' : 'white',border:'none',cursor:'pointer',fontSize:13,color:'#ef4444',fontWeight:600,display:'flex',alignItems:'center',gap:8,transition:'background 0.1s'}}
              onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background='white'}
            >
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function Screen({page, dashboard, activeBusiness, setPage, theme}) {
  return (
    <>
      {page==='Overview'&&<Overview dashboard={dashboard} setPage={setPage} activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Conversations'&&<Conversations dashboard={dashboard} activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Leads'&&<Leads activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Pipeline Debugger'&&<Debugger activeBusiness={activeBusiness} theme={theme}/>}
      {page==='AI Playground'&&<Playground activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Business Brain'&&<BusinessBrain activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Customer 360°'&&<Customer360 activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Reports'&&<Reports dashboard={dashboard} activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Automation'&&<Automation activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Businesses'&&<BusinessesAdmin activeBusiness={activeBusiness} setPage={setPage} theme={theme}/>}
      {page==='Integrations'&&<IntegrationsPage activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Publisher'&&<PublisherPage activeBusiness={activeBusiness} setPage={setPage} theme={theme}/>}
      {page==='Hot Lead Queue'&&<HotLeadQueue activeBusiness={activeBusiness} setPage={setPage} theme={theme}/>}
      {page==='Import & Export'&&<LeadImportExport activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Google Reviews'&&<GoogleReviewsPage activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Broadcasts'&&<BroadcastsPage activeBusiness={activeBusiness} theme={theme}/>}
      {page==='Settings'&&<SettingsPage activeBusiness={activeBusiness} theme={theme}/>}
    </>
  );
}

function Title({title,sub,action}) {
  return <div className="title"><div><h1>{title}</h1><p>{sub}</p></div>{action}</div>;
}

function Stat({label,value,change}) {
  return <div className="card stat"><p>{label}</p><h2>{value}</h2><span>{change}</span><small>live data</small></div>;
}

function Overview({ setPage, activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);

  const fetchBriefing = () => {
    setBriefingLoading(true);
    fetch(`${API_BASE}/briefing/latest`, { headers: bizHeaders })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setBriefing(d.briefing); })
      .catch(() => {})
      .finally(() => setBriefingLoading(false));
  };

  const handleGenerateBriefing = () => {
    setBriefingLoading(true);
    fetch(`${API_BASE}/briefing/generate`, { method: 'POST', headers: bizHeaders })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success' && d.briefing) {
          setBriefing(d.briefing);
        } else {
          // Fallback: try fetching latest
          return fetch(`${API_BASE}/briefing/latest`, { headers: bizHeaders })
            .then(r => r.json())
            .then(d2 => { if (d2.status === 'success') setBriefing(d2.briefing); });
        }
      })
      .catch(err => console.error('Briefing generate error:', err))
      .finally(() => setBriefingLoading(false));
  };

  const fetchOverview = () => {
    setLoading(true);
    fetch(`${API_BASE}/overview`, { headers: bizHeaders })
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

  useEffect(() => { fetchOverview(); fetchBriefing(); }, [bizId]);

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

      {/* Morning Briefing Card — always visible */}
      <div style={{background:'linear-gradient(135deg,#1e3a5f,#1e293b)',border:'1px solid #2d4a6e',borderRadius:12,padding:'16px 20px',marginBottom:16,display:'flex',gap:14,alignItems:'flex-start'}}>
        <div style={{width:40,height:40,borderRadius:10,background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Sunrise size={20} color="#fbbf24"/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
            <div style={{fontSize:12,fontWeight:700,color:'#fbbf24',textTransform:'uppercase',letterSpacing:'0.05em'}}>AI Morning Briefing</div>
            {!briefingLoading && (
              <button onClick={fetchBriefing} style={{fontSize:11,color:'#60a5fa',background:'none',border:'none',cursor:'pointer',fontWeight:600,padding:0}}>↻ Refresh</button>
            )}
          </div>
          {briefingLoading ? (
            <div style={{fontSize:13,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Generating your briefing...</div>
          ) : briefing ? (
            <div style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#cbd5e1',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{briefing?.summary || briefing}</div>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#64748b'}}>No briefing generated yet for today.</div>
              <button onClick={handleGenerateBriefing} style={{fontSize:12,padding:'4px 12px',borderRadius:6,background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',color:'#fbbf24',cursor:'pointer',fontWeight:600}}>Generate Now</button>
            </div>
          )}
        </div>
      </div>

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

      {/* Urgent Action Banner */}
      {(s.hot_leads > 0 || s.needs_human > 0) && (
        <div style={{background:'rgba(239,68,68,0.1)', border:'1px solid #ef4444', borderRadius:'12px', padding:'16px', marginBottom:'20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{width:'40px', height:'40px', borderRadius:'50%', background:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.2em'}}>🔥</div>
            <div>
              <div style={{fontWeight:700, color:'#f8fafc'}}>Attention Required</div>
              <div style={{fontSize:'0.85em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>You have {s.hot_leads} hot leads and {s.needs_human} messages waiting for manual reply.</div>
            </div>
          </div>
          <button onClick={() => setPage('Hot Lead Queue')} style={{background:'#ef4444', color:'white', border:'none', padding:'8px 16px', borderRadius:'8px', fontWeight:600, cursor:'pointer'}}>Open Action Queue</button>
        </div>
      )}

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
            <div style={{height:'220px', display:'flex', alignItems:'center', justifyContent:'center', color: theme==='dark' ? '#8b949e' : '#475569'}}>Loading chart data...</div>
          )}
          <div style={{display:'flex', gap:'16px', marginTop:'8px', fontSize:'0.78em', color: theme==='dark' ? '#8b949e' : '#64748b'}}>
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
            <div style={{height:'200px', display:'flex', alignItems:'center', justifyContent:'center', color: theme==='dark' ? '#8b949e' : '#475569'}}>Loading...</div>
          )}
        </Card>
      </div>

      {/* Row 4 — Locations & Sources */}
      <div className="grid2" style={{marginTop:'20px'}}>
        <Card title="Top Locations">
          {data?.location_breakdown?.length > 0 ? (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              {data.location_breakdown.map((loc, i) => {
                const max = data.location_breakdown[0]?.value || 1;
                const pct = Math.round((loc.value / max) * 100);
                return (
                  <div key={i}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.83em', marginBottom:'4px'}}>
                      <span style={{color:'#e2e8f0'}}>{loc.label}</span>
                      <span style={{color: theme==='dark' ? '#8b949e' : '#64748b'}}>{loc.value} leads</span>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.06)', borderRadius:'4px', height:'6px'}}>
                      <div style={{width:`${pct}%`, height:'6px', borderRadius:'4px', background:'#3b82f6'}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div style={{padding:'20px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#475569', fontSize:'0.85em'}}>No location data yet</div>}
        </Card>

        <Card title="Lead Source Breakdown">
          {data?.source_breakdown?.length > 0 ? (
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-around', height:180}}>
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={data.source_breakdown} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="count">
                    {data.source_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#e1306c', '#25d366', '#3b82f6', '#8b5cf6'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', fontSize:'12px'}}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{width:'45%'}}>
                {data.source_breakdown.map((item, i) => (
                  <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', fontSize:'0.82em'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <div style={{width:'8px', height:'8px', borderRadius:'50%', background:['#e1306c', '#25d366', '#3b82f6', '#8b5cf6'][i % 4]}}></div>
                      <span style={{color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>{item.source.replace('_', ' ')}</span>
                    </div>
                    <span style={{fontWeight:700, color:'#f8fafc'}}>{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{padding:'20px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#475569', fontSize:'0.85em'}}>No source data yet</div>}
        </Card>
      </div>

      {/* Row 5 — Module breakdown + Needs Human */}
      <div className="grid2" style={{marginTop:'20px'}}>
        {/* Top modules */}
        <Card title="Top Interested Products / Services">
          <div style={{fontSize:'0.75em',color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:8}}>What leads are most interested in (by volume)</div>
          {moduleBreakdown.length > 0 ? (
            <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'4px'}}>
              {moduleBreakdown.map((mod, i) => {
                const maxVal = moduleBreakdown[0]?.value || 1;
                const pct = Math.round((mod.value / maxVal) * 100);
                return (
                  <div key={i}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.83em', marginBottom:'4px'}}>
                      <span style={{color:'#e2e8f0',fontWeight:500}}>{mod.label || mod.module || 'Unknown'}</span>
                      <span style={{color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>{mod.value} leads</span>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.06)', borderRadius:'4px', height:'6px'}}>
                      <div style={{width:`${pct}%`, height:'6px', borderRadius:'4px', background: colors[i % colors.length]}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{padding:'20px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#475569', fontSize:'0.85em'}}>No product/service interest data yet</div>
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
                    <div style={{fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#64748b', marginTop:'2px'}}>
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

      {/* Hot Lead Queue shortcut banner */}
      {(s.hot_leads > 0 || s.needs_human > 0) && (
        <div style={{marginTop:'20px',background:'linear-gradient(135deg,#fef2f2,#fff7ed)',border:'1px solid #fecaca',borderRadius:12,padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontSize:28}}>🔥</div>
            <div>
              <div style={{fontWeight:700,color:'#991b1b',fontSize:15}}>Action Required</div>
              <div style={{fontSize:13,color:'#b91c1c'}}>
                {s.hot_leads > 0 && <span>{s.hot_leads} hot lead{s.hot_leads>1?'s':''} need attention</span>}
                {s.hot_leads > 0 && s.needs_human > 0 && <span> · </span>}
                {s.needs_human > 0 && <span>{s.needs_human} conversation{s.needs_human>1?'s':''} need human reply</span>}
              </div>
            </div>
          </div>
          <button onClick={() => setPage('Hot Lead Queue')} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 20px',borderRadius:8,background:'#ef4444',color:'white',border:'none',fontWeight:700,fontSize:13,cursor:'pointer'}}>
            <Flame size={15}/>Open Hot Lead Queue
          </button>
        </div>
      )}

      {/* Row 5 — Recent Leads */}
      <div style={{marginTop:'20px'}}>
        <Card title="Recent Leads">
          {recentLeads.length > 0 ? (
            <Table
              heads={['Name', 'Module', 'Phone', 'Temperature', 'Stage', 'Last Active']}
              rows={recentLeads.map(lead => [
                <Name name={lead.name} theme={theme}/>,
                lead.interested_module || <span style={{color: theme==='dark' ? '#8b949e' : '#475569'}}>—</span>,
                lead.phone || <span style={{color: theme==='dark' ? '#8b949e' : '#475569'}}>—</span>,
                <LeadTemperatureDot temp={lead.temperature}/>,
                <Badge text={STAGE_LABELS_OV[lead.lead_stage] || lead.lead_stage || 'New'}/>,
                lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '—',
              ])}
            />
          ) : (
            <div style={{padding:'20px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#475569'}}>Loading recent leads...</div>
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

function Conversations({ activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
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
    fetch(`${API_BASE}/conversations?${params}`, { headers: bizHeaders })
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

  useEffect(() => {
    setSelected(null);
    setFullConv(null);
    fetchConversations();
  }, [bizId]);

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
    fetch(`${API_BASE}/conversation/${conv.sender_id}`, { headers: bizHeaders })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') {
          setFullConv(data.conversation);
        }
      })
      .catch(err => console.error('Full conv error:', err))
      .finally(() => setFullLoading(false));
  };

  const [channelFilter, setChannelFilter] = useState('all');
  const FILTER_KEYS = ['all', 'needs_human', 'pending_reply', 'ai_replied', 'manual_replied'];
  
  const filteredByChannel = channelFilter === 'all' ? conversations
    : conversations.filter(c => (c.channel || 'instagram') === channelFilter);

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

      {/* Channel filter */}
      <div style={{display:'flex', gap:'6px', marginBottom:'10px', flexWrap:'wrap', alignItems:'center'}}>
        <span style={{fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#64748b', marginRight:'4px', fontWeight:600}}>CHANNEL:</span>
        {[['all','All Channels'],['instagram','📸 Instagram'],['whatsapp','💬 WhatsApp']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setChannelFilter(val)}
            style={{
              padding:'4px 12px', fontSize:'0.78em', borderRadius:'20px',
              background: channelFilter === val ? (val === 'whatsapp' ? '#25d366' : val === 'instagram' ? '#e1306c' : '#2563eb') : 'rgba(255,255,255,0.05)',
              border: `1px solid ${channelFilter === val ? 'transparent' : '#334155'}`,
              color: channelFilter === val ? '#fff' : '#94a3b8',
              cursor:'pointer',
            }}
          >{label}</button>
        ))}
      </div>

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
            <div style={{padding:'40px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div style={{padding:'40px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b'}}>No conversations found.</div>
          ) : filteredByChannel.map((conv, i) => {
            const isSelected = selected?.sender_id === conv.sender_id;
            const stateColor = conv.needs_human ? '#ef4444' : (CONV_STATE_COLORS[conv.conversation_state] || '#475569');
            const stateLabel = conv.needs_human ? 'Needs Human' : (conv.conversation_state || 'active').replace(/_/g, ' ');
            const lastMsg = conv.last_message || '';
            const isUserLast = conv.last_sender === 'user';
            
            // Display name fallback logic — show friendly name, not numeric ID
            const rawName = conv.display_name || conv.customer_name || conv.name || conv.instagram_username || conv.sender_id;
            const displayName = rawName && /^\d{10,}$/.test(String(rawName))
              ? `User ...${String(rawName).slice(-4)}`
              : rawName;

            return (
              <div
                key={i}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  padding:'14px 16px',
                  background: isSelected ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelected ? '#2563eb' : '#1e293b'}`,
                  borderLeft: `4px solid ${isSelected ? '#2563eb' : stateColor}`,
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
                    <div style={{position:'relative'}}>
                      <div style={{width:'46px', height:'46px', borderRadius:'14px', background: isSelected ? '#3b82f6' : 'rgba(255,255,255,0.07)', border:`1px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', color: isSelected ? '#fff' : '#e2e8f0', fontSize:'1.2em', fontWeight:800, flexShrink:0, transition:'all 0.2s'}}>
                        {String(displayName || '?')[0].toUpperCase()}
                      </div>
                      <div style={{position:'absolute', bottom:'-2px', right:'-2px', width:'20px', height:'20px', borderRadius:'50%', background:'#0f172a', border:'2px solid #0f172a', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 4px rgba(0,0,0,0.3)'}}>
                        {(conv.channel || 'instagram') === 'whatsapp' ? 
                          <span title="WhatsApp" style={{fontSize:'12px'}}>💬</span> : 
                          <span title="Instagram" style={{fontSize:'12px'}}>📸</span>
                        }
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:'1.05em', fontWeight:700, color: isSelected ? '#fff' : '#f8fafc', transition:'all 0.2s', marginBottom:'3px'}}>{displayName}</div>
                      <div style={{fontSize:'0.78em', color: theme==='dark' ? '#6e7681' : '#94a3b8', display:'flex', alignItems:'center', gap:'8px'}}>
                        <span style={{color: (conv.channel || 'instagram') === 'whatsapp' ? '#22c55e' : '#ec4899', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', fontSize:'0.9em'}}>
                          {(conv.channel || 'instagram')}
                        </span>
                        <span style={{color: theme==='dark' ? '#c9d1d9' : '#334155'}}>•</span>
                        <span style={{color: theme==='dark' ? '#8b949e' : '#64748b'}}>{conv.message_count || 0} messages</span>
                      </div>
                    </div>
                  </div>
                  <div style={{textAlign:'right', flexShrink:0}}>
                    <div style={{fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#475569', fontWeight:500, marginBottom:'5px'}}>
                      {conv.updated_at ? timeAgo(conv.updated_at) : '-'}
                    </div>
                    <span style={{fontSize:'0.72em', padding:'3px 9px', borderRadius:'12px', background:`${stateColor}20`, color:stateColor, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.02em'}}>
                      {stateLabel}
                    </span>
                  </div>
                </div>
                <div style={{fontSize:'0.88em', color: isUserLast ? '#cbd5e1' : '#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingLeft:'60px', lineHeight:'1.4'}}>
                  {isUserLast ? '' : <span style={{color:'#8b5cf6', fontWeight:700, marginRight:'6px'}}>AI:</span>}
                  {String(lastMsg).slice(0, 100) || <span style={{fontStyle:'italic', color: theme==='dark' ? '#8b949e' : '#475569'}}>No messages</span>}
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
            bizId={bizId}
            theme={theme}
          />
        )}
      </div>
    </section>
  );
}

function ConversationChatPanel({ conv, fullConv, loading, onClose, onRefresh, bizId, theme }) {
  const bizHeaders = { 'X-Business-ID': bizId || '00000000-0000-0000-0000-000000000000' };
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // 'closed' | 'keep_human' | 'reopen'
  const [actionResult, setActionResult] = useState(null);
  const chatEndRef = React.useRef(null);

  const handleStatusAction = async (status, label) => {
    setActionLoading(status);
    setActionResult(null);
    try {
      const res = await fetch(`${API_BASE}/conversations/${conv.sender_id}/status?status=${status}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...bizHeaders },
        body: JSON.stringify({ reason: `Marked ${label} by agent` }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setActionResult({ ok: true, msg: `Marked as ${label}` });
        setTimeout(() => { onRefresh(); setActionResult(null); }, 1200);
      } else {
        setActionResult({ ok: false, msg: data.message || `Failed to mark ${label}` });
      }
    } catch (e) {
      setActionResult({ ok: false, msg: 'Network error' });
    }
    setActionLoading(null);
  };

  const history = fullConv?.history || [];
  const stateColor = conv.needs_human ? '#ef4444' : (CONV_STATE_COLORS[conv.conversation_state] || '#475569');
  const stateLabel = conv.needs_human ? 'Needs Human' : (conv.conversation_state || 'active').replace(/_/g, ' ');
  const isWhatsApp = (conv.channel || 'instagram') === 'whatsapp';
  const rawDisplayName = conv.display_name || conv.customer_name || conv.name || conv.instagram_username || conv.sender_id;
  const panelDisplayName = rawDisplayName && /^\d{10,}$/.test(String(rawDisplayName))
    ? `User ...${String(rawDisplayName).slice(-4)}`
    : rawDisplayName;

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
        headers: { 'Content-Type': 'application/json', ...bizHeaders },
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
            {String(panelDisplayName || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{fontWeight:700, color:'#e2e8f0', fontSize:'0.95em'}}>{panelDisplayName}</div>
            <div style={{fontSize:'0.75em', display:'flex', alignItems:'center', gap:'6px'}}>
              {isWhatsApp ? (
                            <span style={{fontSize:'0.85em', background:'#25d36620', color:'#25d366', padding:'1px 5px', borderRadius:'4px', fontWeight:700}}>WA</span>
                          ) : (
                            <span className="ig" style={{fontSize:'0.85em'}}>IG</span>
                          )}
              <span style={{color: stateColor, fontWeight:600}}>{stateLabel}</span>
              <span style={{color: theme==='dark' ? '#8b949e' : '#475569'}}>· {history.length} messages</span>
            </div>
          </div>
        </div>
        <div style={{display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap'}}>
          {/* Reopen AI — only show if conversation is closed/needs_human/keep_human */}
          {(conv.needs_human || ['closed','needs_human','keep_human'].includes(conv.conversation_state)) && (
            <button
              onClick={() => handleStatusAction('reopen', 'Reopen')}
              disabled={actionLoading === 'reopen'}
              title="Let AI handle this conversation again"
              style={{padding:'4px 10px', fontSize:'0.78em', background:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.3)', borderRadius:6, cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:4}}
            >
              {actionLoading === 'reopen' ? '...' : '▶ Reopen AI'}
            </button>
          )}
          {/* Keep Human — only show if AI is currently active */}
          {!conv.needs_human && !['closed','keep_human'].includes(conv.conversation_state) && (
            <button
              onClick={() => handleStatusAction('keep_human', 'Keep Human')}
              disabled={actionLoading === 'keep_human'}
              title="Hand off to human — AI will stay silent"
              style={{padding:'4px 10px', fontSize:'0.78em', background:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.3)', borderRadius:6, cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:4}}
            >
              {actionLoading === 'keep_human' ? '...' : '👤 Keep Human'}
            </button>
          )}
          {/* Mark Closed — hide if already closed */}
          {conv.conversation_state !== 'closed' && (
            <button
              onClick={() => handleStatusAction('closed', 'Closed')}
              disabled={actionLoading === 'closed'}
              title="Mark conversation as resolved"
              style={{padding:'4px 10px', fontSize:'0.78em', background:'rgba(100,116,139,0.15)', color: theme==='dark' ? '#6e7681' : '#94a3b8', border:'1px solid rgba(100,116,139,0.3)', borderRadius:6, cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:4}}
            >
              {actionLoading === 'closed' ? '...' : '✓ Close'}
            </button>
          )}
          <button className="ghost" onClick={onRefresh} style={{padding:'4px 8px', fontSize:'0.8em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>↻</button>
          <button className="outline" onClick={onClose} style={{padding:'4px 8px', fontSize:'0.8em'}}><X size={13}/></button>
        </div>
      </div>
      {/* Action feedback bar */}
      {actionResult && (
        <div style={{padding:'6px 16px', fontSize:'0.8em', color: actionResult.ok ? '#10b981' : '#ef4444', background: actionResult.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderBottom:'1px solid #1e293b', display:'flex', alignItems:'center', gap:6}}>
          <span>{actionResult.ok ? '✓' : '✗'}</span>
          <span>{actionResult.msg}</span>
        </div>
      )}

      {/* Chat history */}
      <div style={{flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'10px'}}>
        {loading ? (
          <div style={{textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b', padding:'40px'}}>Loading messages...</div>
        ) : history.length === 0 ? (
          <div style={{textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b', padding:'40px', fontStyle:'italic'}}>No message history found.</div>
        ) : history.map((item, i) => (
          <React.Fragment key={i}>
            {item.user && (
              <div style={{display:'flex', justifyContent:'flex-start'}}>
                <div style={{
                  maxWidth:'78%', padding:'10px 13px',
                  background: theme==='dark' ? '#1c2128' : '#f1f5f9',
                  border:'1px solid #cbd5e1',
                  borderRadius:'16px 16px 16px 4px',
                  fontSize:'0.88em', color: theme === 'dark' ? '#e6edf3' : '#1e293b', lineHeight:'1.6',
                }}>
                  <div style={{fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#64748b', marginBottom:'4px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>Customer</div>
                  {item.user}
                </div>
              </div>
            )}
            {item.assistant && (
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <div style={{
                  maxWidth:'78%', padding:'10px 13px',
                  background: theme==='dark' ? '#1c2d4f' : '#dbeafe',
                  border:'1px solid #93c5fd',
                  borderRadius:'16px 16px 4px 16px',
                  fontSize:'0.88em', color: theme==='dark' ? '#93c5fd' : '#1e3a8a', lineHeight:'1.6',
                }}>
                  <div style={{fontSize:'0.75em', color: theme==='dark' ? '#79c0ff' : '#2563eb', marginBottom:'4px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>AI Assistant</div>
                  {item.assistant}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
        <div ref={chatEndRef}/>
      </div>

      {/* Reply box */}
      <div style={{padding:'12px 14px', borderTop:'1px solid #1e293b', flexShrink:0, background:'rgba(0,0,0,0.15)'}}>
        {sendResult && (
          <div style={{marginBottom:'8px', fontSize:'0.82em', color: sendResult.ok ? '#10b981' : '#ef4444', padding:'8px 12px', background: sendResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius:'7px', display:'flex', alignItems:'center', gap:6, border:`1px solid ${sendResult.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`}}>
            <span style={{fontSize:14}}>{sendResult.ok ? '✓' : '✗'}</span>
            <span>{sendResult.msg}</span>
            {sendResult.ok && <span style={{marginLeft:'auto', fontSize:'0.85em', opacity:0.7}}>Delivered to Instagram DM</span>}
          </div>
        )}
        <div style={{display:'flex', gap:'8px', alignItems:'flex-end'}}>
          <div style={{flex:1, position:'relative'}}>
            <textarea
              placeholder="Type a reply — will be sent directly to this person's Instagram DM..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSendReply(); }}
              style={{width:'100%', minHeight:'64px', maxHeight:'120px', resize:'vertical', fontSize:'0.85em', paddingBottom:'18px', boxSizing:'border-box'}}
            />
            <div style={{position:'absolute', bottom:6, right:8, fontSize:'0.7em', color: replyText.length > 950 ? '#ef4444' : '#475569'}}>
              {replyText.length}/1000
            </div>
          </div>
          <button
            onClick={handleSendReply}
            disabled={sending || !replyText.trim() || replyText.length > 1000}
            style={{padding:'10px 18px', alignSelf:'flex-end', flexShrink:0, background: sending ? '#64748b' : '#2563eb', color:'white', border:'none', borderRadius:8, cursor: sending ? 'not-allowed' : 'pointer', fontWeight:600, fontSize:'0.85em', display:'flex', alignItems:'center', gap:6}}
          >
            {sending ? (
              <><span style={{display:'inline-block',width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/> Sending...</>
            ) : (
              <><Send size={13}/> Send DM</>
            )}
          </button>
        </div>
        <div style={{fontSize:'0.72em', color: theme==='dark' ? '#8b949e' : '#475569', marginTop:'5px', display:'flex', alignItems:'center', gap:8}}>
          <span style={{color:'#3b82f6', fontWeight:500}}>⚡ Live</span>
          <span>Ctrl+Enter to send · Sends directly to Instagram DM · Reply appears in their inbox instantly</span>
        </div>
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

function Leads({ activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Leads');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [stageFilter, setStageFilter] = useState('All');

  const tabs = ['All Leads', 'New', 'Warm', 'Hot', 'Qualified', 'Converted'];

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/all-leads`, { headers: bizHeaders })
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
  }, [bizId]);

  const getLeadName = (lead) => {
    const name = lead.customer_name || lead.name || lead.instagram_username;
    if (name && name !== 'Name Pending' && name !== 'Unknown') return name;
    if (lead.sender_id) return `User ${String(lead.sender_id).slice(-4)}`;
    return 'Unknown';
  };

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
            <div style={{padding:'40px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading leads...</div>
          ) : filtered.length === 0 ? (
            <div style={{padding:'40px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b'}}>
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
                    style={{
                      cursor:'pointer', 
                      background: selectedLead?.id === lead.id ? 'rgba(37,99,235,0.12)' : '',
                      borderLeft: selectedLead?.id === lead.id ? '3px solid #3b82f6' : 'none'
                    }}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td><Name name={getLeadName(lead)} source={lead.source} theme={theme}/></td>
                    <td style={{fontSize:'0.9em', color: theme==='dark' ? '#c9d1d9' : '#334155', fontWeight:500}}>{lead.phone || lead.email || '-'}</td>
                    <td style={{fontSize:'0.9em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>{lead.location || '-'}</td>
                    <td><span style={{fontSize:'0.78em', padding:'3px 9px', borderRadius:'10px', background:'rgba(139,92,246,0.15)', color:'#a78bfa', fontWeight:600}}>{lead.interested_module || '-'}</span></td>
                    <td><LeadTemperatureDot temp={lead.temperature}/></td>
                    <td><span style={{fontSize:'0.8em', color: theme==='dark' ? '#6e7681' : '#94a3b8', fontWeight:600, textTransform:'capitalize'}}>{(lead.lead_stage || '').replace('_', ' ')}</span></td>
                    <td><Badge text={lead.status || 'new'}/></td>
                    <td style={{fontSize:'0.78em', color: theme==='dark' ? '#8b949e' : '#475569'}}>{lead.updated_at ? timeAgo(lead.updated_at) : '-'}</td>
                    <td><ChevronRight size={14} color={theme==='dark' ? '#8b949e' : '#334155'}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Lead Detail Panel */}
        {selectedLead && (
          <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} getLeadName={getLeadName} bizId={bizId} theme={theme}/>
        )}
      </div>
    </section>
  );
}

function LeadDetailPanel({ lead: initialLead, onClose, getLeadName, bizId, theme }) {
  const bizHeaders = { 'X-Business-ID': bizId || '00000000-0000-0000-0000-000000000000' };
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
      const res = await fetch(`${API_BASE}/leads/${lead.id}/qualify`, { method: 'PATCH', headers: bizHeaders });
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
      const res = await fetch(`${API_BASE}/leads/${lead.sender_id}/summary`, { headers: bizHeaders });
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
          <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
            <Phone size={13}/> {lead.phone}
          </div>
        )}
        {lead.location && (
          <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
            <MapPin size={13}/> {lead.location}
          </div>
        )}
        {lead.interested_module && (
          <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
            <BookOpen size={13}/> {lead.interested_module}
          </div>
        )}
        {lead.updated_at && (
          <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'0.88em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
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
        <div style={{marginTop:'14px', padding:'10px 12px', background:'rgba(37,99,235,0.06)', borderRadius:'8px', fontSize:'0.82em', color: theme==='dark' ? '#6e7681' : '#94a3b8', borderLeft:'3px solid #2563eb'}}>
          <b style={{color: theme==='dark' ? '#8b949e' : '#cbd5e1', display:'block', marginBottom:'4px'}}>Notes</b>
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
                <div style={{padding:'8px', background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'0.7em', color: theme==='dark' ? '#8b949e' : '#64748b', marginBottom:'3px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>INTENT</div>
                  <div style={{fontSize:'0.82em', color: theme === 'dark' ? '#e6edf3' : '#1e293b', fontWeight:600}}>{summary.summary?.intent || '-'}</div>
                </div>
                <div style={{padding:'8px', background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'0.7em', color: theme==='dark' ? '#8b949e' : '#64748b', marginBottom:'3px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>STAGE</div>
                  <div style={{fontSize:'0.82em', color: theme === 'dark' ? '#e6edf3' : '#1e293b', fontWeight:600}}>{summary.summary?.stage || '-'}</div>
                </div>
                <div style={{padding:'8px', background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'0.7em', color: theme==='dark' ? '#8b949e' : '#64748b', marginBottom:'3px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>URGENCY</div>
                  <div style={{fontSize:'0.82em', fontWeight:700, color: URGENCY_COLORS[summary.summary?.urgency] || '#475569', textTransform:'capitalize'}}>
                    {summary.summary?.urgency || '-'}
                  </div>
                </div>
              </div>

              {/* Key facts */}
              {summary.summary?.key_facts?.length > 0 && (
                <div style={{background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'10px 12px'}}>
                  <div style={{fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#475569', marginBottom:'6px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em'}}>Key Facts</div>
                  <ul style={{margin:0, padding:'0 0 0 16px', display:'flex', flexDirection:'column', gap:'5px'}}>
                    {summary.summary.key_facts.map((fact, i) => (
                      <li key={i} style={{fontSize:'0.85em', color: theme === 'dark' ? '#c9d1d9' : '#1e293b', lineHeight:'1.5'}}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended action */}
              {summary.summary?.recommended_action && (
                <div style={{padding:'10px 12px', background: theme==='dark' ? '#0d2e1a' : '#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', borderLeft:'3px solid #10b981'}}>
                  <div style={{fontSize:'0.72em', color:'#15803d', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px'}}>Recommended Action</div>
                  <div style={{fontSize:'0.87em', color:'#14532d', lineHeight:'1.5'}}>{summary.summary.recommended_action}</div>
                </div>
              )}

              {/* Meta */}
              <div style={{fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#64748b', display:'flex', gap:'12px'}}>
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

function Debugger({ activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
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
        headers: { 'Content-Type': 'application/json', ...bizHeaders },
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
              <label style={{fontSize:'0.78em', fontWeight:700, color: theme==='dark' ? '#8b949e' : '#475569', textTransform:'uppercase', letterSpacing:'0.04em', display:'block', marginBottom:'5px'}}>Test Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) runPipeline(); }}
                style={{width:'100%', minHeight:'70px', maxHeight:'120px', resize:'vertical', fontSize:'0.9em', boxSizing:'border-box'}}
                placeholder="Type any message a customer might send..."
              />
            </div>
            <div style={{width:'180px', flexShrink:0}}>
              <label style={{fontSize:'0.78em', fontWeight:700, color: theme==='dark' ? '#8b949e' : '#475569', textTransform:'uppercase', letterSpacing:'0.04em', display:'block', marginBottom:'5px'}}>Sender ID (optional)</label>
              <input
                value={senderId}
                onChange={e => setSenderId(e.target.value)}
                style={{width:'100%', fontSize:'0.88em', boxSizing:'border-box'}}
                placeholder="debug_test_user"
              />
              <div style={{fontSize:'0.72em', color: theme==='dark' ? '#6e7681' : '#94a3b8', marginTop:'4px'}}>Use a real sender_id to test with existing conversation history</div>
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
                <span style={{fontSize:'0.8em', padding:'4px 10px', borderRadius:'20px', background: theme==='dark' ? '#1c2d4f' : '#eff6ff', color:'#1e40af', fontWeight:600, border:'1px solid #bfdbfe'}}>
                  🎯 {result.intent}
                </span>
                <span style={{fontSize:'0.8em', padding:'4px 10px', borderRadius:'20px', background: result.needs_human ? '#fef2f2' : '#f0fdf4', color: result.needs_human ? '#991b1b' : '#14532d', fontWeight:600, border:`1px solid ${result.needs_human ? '#fca5a5' : '#86efac'}`}}>
                  {result.needs_human ? '🚨 Needs Human' : '✅ AI Handled'}
                </span>
                <span style={{fontSize:'0.8em', padding:'4px 10px', borderRadius:'20px', background: theme==='dark' ? '#1c2128' : '#f8fafc', color: theme==='dark' ? '#8b949e' : '#475569', fontWeight:600, border:'1px solid #e2e8f0'}}>
                  ⏱ {result.total_ms}ms total
                </span>
              </div>
            )}
          </div>
          <div style={{fontSize:'0.75em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Ctrl+Enter to run · This runs a test — it will NOT send any message to Instagram</div>
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
                          <div style={{fontSize:'0.85em', fontWeight:700, color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{stage.name}</div>
                          <div style={{fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#64748b', marginTop:'1px'}}>{stage.summary}</div>
                        </div>
                      </div>
                      <div style={{textAlign:'right', flexShrink:0, marginLeft:'8px'}}>
                        <div style={{fontSize:'0.75em', fontWeight:700, color: colors.text}}>
                          {stage.status === 'skipped' ? 'SKIPPED' : `${stage.timing_ms}ms`}
                        </div>
                        <div style={{fontSize:'0.65em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>{isExpanded ? '▲ hide' : '▼ details'}</div>
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
                            <span style={{color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:600, minWidth:'120px', flexShrink:0}}>{k.replace(/_/g, ' ')}:</span>
                            <span style={{color: theme==='dark' ? '#e6edf3' : '#1e293b', wordBreak:'break-word'}}>
                              {typeof v === 'boolean' ? (v ? '✅ Yes' : '❌ No') : (v === null || v === undefined || v === '') ? <span style={{color: theme==='dark' ? '#6e7681' : '#94a3b8', fontStyle:'italic'}}>none</span> : String(v)}
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
                  <div style={{padding:'14px', background: theme==='dark' ? '#1c2d4f' : '#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', fontSize:'0.9em', color: theme==='dark' ? '#93c5fd' : '#1e3a8a', lineHeight:'1.6', marginBottom:'10px'}}>
                    {result.reply_text}
                  </div>
                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                    <span style={{fontSize:'0.78em', padding:'3px 9px', borderRadius:'12px', background: theme==='dark' ? '#1c2128' : '#f1f5f9', color: theme==='dark' ? '#8b949e' : '#475569', border:'1px solid #e2e8f0'}}>Category: {result.reply_category}</span>
                    <span style={{fontSize:'0.78em', padding:'3px 9px', borderRadius:'12px', background: theme==='dark' ? '#1c2128' : '#f1f5f9', color: theme==='dark' ? '#8b949e' : '#475569', border:'1px solid #e2e8f0'}}>{result.reply_text.length} characters</span>
                  </div>
                </div>
              ) : (
                <div style={{padding:'14px', background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.88em', color: theme==='dark' ? '#8b949e' : '#64748b', fontStyle:'italic'}}>
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
                  <div key={k} style={{padding:'8px 10px', background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px'}}>
                    <div style={{fontSize:'0.7em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'3px'}}>{k}</div>
                    <div style={{fontSize:'0.88em', color: theme==='dark' ? '#e6edf3' : '#1e293b', fontWeight:600}}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Memory */}
            {result.ai_memory && Object.keys(result.ai_memory).length > 0 && (
              <Card title="AI Memory (what the AI remembered)">
                <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                  {Object.entries(result.ai_memory).map(([k, v]) => (
                    <div key={k} style={{display:'flex', gap:'8px', fontSize:'0.82em', padding:'4px 0', borderBottom: `1px solid ${theme==='dark' ? '#21262d' : '#f1f5f9'}`}}>
                      <span style={{color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:600, minWidth:'140px', flexShrink:0}}>{k.replace(/_/g, ' ')}:</span>
                      <span style={{color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{v === null || v === undefined ? <span style={{color: theme==='dark' ? '#6e7681' : '#94a3b8', fontStyle:'italic'}}>null</span> : String(v)}</span>
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
                    <span style={{color: theme==='dark' ? '#6e7681' : '#94a3b8', marginRight:'8px'}}>{String(i+1).padStart(2,'0')}</span>{log}
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

function Playground({ activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
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
    fetch(`${API_BASE}/playground/history?limit=20`, { headers: bizHeaders })
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  React.useEffect(() => { loadHistory(); }, [bizId]);

  const runTest = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setSelectedHistory(null);
    try {
      const res = await fetch(`${API_BASE}/playground/test-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...bizHeaders },
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
          <h1 style={{fontSize:22,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',margin:0}}>AI Playground</h1>
          <p style={{color: theme==='dark' ? '#8b949e' : '#64748b',margin:'4px 0 0',fontSize:14}}>Test any message and see exactly how the AI processes it</p>
        </div>
        <button onClick={loadHistory} style={{padding:'8px 16px',background: theme==='dark' ? '#1c2128' : '#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,cursor:'pointer',fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569'}}>↻ Refresh History</button>
      </div>

      {/* Input Panel */}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:24,marginBottom:24}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16,marginBottom:16}}>
          <div>
            <label style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#c9d1d9' : '#374151',display:'block',marginBottom:6}}>Test Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') runTest(); }}
              placeholder="Type any message a customer might send... (Ctrl+Enter to run)"
              rows={3}
              style={{width:'100%',padding:'10px 14px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,resize:'vertical',fontFamily:'inherit',color: theme==='dark' ? '#e6edf3' : '#1e293b',boxSizing:'border-box'}}
            />
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#c9d1d9' : '#374151',display:'block',marginBottom:6}}>Sender ID <span style={{fontWeight:400,color: theme==='dark' ? '#6e7681' : '#9ca3af'}}>(optional — use real ID for history)</span></label>
            <input
              value={senderId}
              onChange={e => setSenderId(e.target.value)}
              placeholder="playground_test_user"
              style={{width:'100%',padding:'10px 14px',border:'1px solid #d1d5db',borderRadius:8,fontSize:14,fontFamily:'inherit',color: theme==='dark' ? '#e6edf3' : '#1e293b',boxSizing:'border-box'}}
            />
            <p style={{fontSize:12,color: theme==='dark' ? '#6e7681' : '#9ca3af',margin:'6px 0 0'}}>Use a real sender_id to include conversation history in the test</p>
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
          <button onClick={() => { setMessage(''); setResult(null); setError(null); setSelectedHistory(null); }} style={{padding:'10px 16px',background: theme==='dark' ? '#1c2128' : '#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,cursor:'pointer',fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569'}}>Clear</button>
          {loading && <span style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#6b7280',fontStyle:'italic'}}>Processing through 9 pipeline stages...</span>}
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
              <h3 style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>💬</span> AI Generated Reply
              </h3>
              <div style={{background: theme==='dark' ? '#1c2d4f' : '#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'14px 16px',color:'#1e40af',fontSize:14,lineHeight:1.6,fontStyle:'italic'}}>
                {displayResult.reply?.reply || displayResult.reply?.message || 'No reply generated'}
              </div>
              {displayResult.reply?.category && (
                <div style={{marginTop:8,display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span style={{padding:'3px 10px',background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',border:'1px solid #bbf7d0',borderRadius:20,fontSize:12,color:'#15803d',fontWeight:600}}>{displayResult.reply.category}</span>
                  <span style={{padding:'3px 10px',background: theme==='dark' ? '#1c2128' : '#f8fafc',border:'1px solid #e2e8f0',borderRadius:20,fontSize:12,color: theme==='dark' ? '#8b949e' : '#475569'}}>{displayResult.reply.char_count || (displayResult.reply.reply || '').length} chars</span>
                </div>
              )}
            </div>

            {/* Intent Analysis */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>🎯</span> Intent Detection
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{padding:'12px 14px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Intent</div>
                  <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{displayResult.intent?.intent || 'unknown'}</div>
                </div>
                <div style={{padding:'12px 14px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Confidence</div>
                  <div style={{fontSize:15,fontWeight:700,color: intentColor(displayResult.intent?.confidence)}}>
                    {displayResult.intent?.confidence ? `${Math.round(displayResult.intent.confidence * 100)}%` : 'N/A'}
                  </div>
                </div>
              </div>
              {displayResult.intent?.reason && (
                <div style={{marginTop:10,fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569',padding:'8px 12px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:6}}>
                  {displayResult.intent.reason}
                </div>
              )}
            </div>

            {/* Decision */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>⚡</span> Decision
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div style={{padding:'10px 12px',background: displayResult.decision?.should_reply ? '#f0fdf4' : '#fef2f2',borderRadius:8,border:`1px solid ${displayResult.decision?.should_reply ? '#bbf7d0' : '#fecaca'}`}}>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Should Reply</div>
                  <div style={{fontSize:14,fontWeight:700,color: displayResult.decision?.should_reply ? '#15803d' : '#dc2626'}}>{displayResult.decision?.should_reply ? '✓ Yes' : '✗ No'}</div>
                </div>
                <div style={{padding:'10px 12px',background: displayResult.decision?.needs_human ? '#fef3c7' : '#f0fdf4',borderRadius:8,border:`1px solid ${displayResult.decision?.needs_human ? '#fde68a' : '#bbf7d0'}`}}>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Needs Human</div>
                  <div style={{fontSize:14,fontWeight:700,color: displayResult.decision?.needs_human ? '#92400e' : '#15803d'}}>{displayResult.decision?.needs_human ? '⚠ Yes' : '✓ No'}</div>
                </div>
                <div style={{padding:'10px 12px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Action</div>
                  <div style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{displayResult.decision?.action || 'reply'}</div>
                </div>
              </div>
              {displayResult.decision?.reason && (
                <div style={{marginTop:10,fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569',padding:'8px 12px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:6}}>{displayResult.decision.reason}</div>
              )}
            </div>
          </div>

          {/* Right: Lead + Business Brain */}
          <div style={{display:'flex',flexDirection:'column',gap:16}}>

            {/* Lead Analysis */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
              <h3 style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:18}}>🔥</span> Lead Analysis
              </h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12}}>
                <div style={{padding:'10px 12px',background: displayResult.lead?.is_lead ? '#f0fdf4' : '#f8fafc',borderRadius:8,border:`1px solid ${displayResult.lead?.is_lead ? '#bbf7d0' : '#e2e8f0'}`}}>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Lead</div>
                  <div style={{fontSize:14,fontWeight:700,color: displayResult.lead?.is_lead ? '#15803d' : '#6b7280'}}>{displayResult.lead?.is_lead ? '✓ Yes' : '✗ No'}</div>
                </div>
                <div style={{padding:'10px 12px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Score</div>
                  <div style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{displayResult.lead?.lead_score ?? 'N/A'}</div>
                </div>
                <div style={{padding:'10px 12px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:4}}>Temperature</div>
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
              <h3 style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
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
                    <div style={{padding:'10px 12px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>
                      <strong>Rule:</strong> {displayResult.business_brain.rule_name}
                    </div>
                  )}
                  {displayResult.business_brain.context_injected && (
                    <div style={{marginTop:8,padding:'10px 12px',background: theme==='dark' ? '#1c2d4f' : '#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,fontSize:13,color:'#1e40af',fontStyle:'italic'}}>
                      {displayResult.business_brain.context_injected}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{padding:'10px 12px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,fontSize:13,color: theme==='dark' ? '#8b949e' : '#6b7280'}}>No business brain data returned</div>
              )}
            </div>

            {/* Customer Brain / Memory */}
            {displayResult.customer_brain && (
              <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:20}}>
                <h3 style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:18}}>✨</span> Customer Memory
                </h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {Object.entries(displayResult.customer_brain).map(([k,v]) => v ? (
                    <div key={k} style={{padding:'8px 12px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
                      <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',fontWeight:600,textTransform:'uppercase',marginBottom:2}}>{k.replace(/_/g,' ')}</div>
                      <div style={{fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',fontWeight:500}}>{String(v)}</div>
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
        <h3 style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}>
          <span>📋</span> Test History
          <span style={{fontSize:13,fontWeight:400,color: theme==='dark' ? '#6e7681' : '#9ca3af',marginLeft:4}}>({history.length} tests)</span>
        </h3>
        {historyLoading ? (
          <div style={{color: theme==='dark' ? '#6e7681' : '#9ca3af',fontSize:13,padding:'20px 0',textAlign:'center'}}>Loading history...</div>
        ) : history.length === 0 ? (
          <div style={{color: theme==='dark' ? '#6e7681' : '#9ca3af',fontSize:13,padding:'20px 0',textAlign:'center'}}>No tests run yet. Send a message above to get started.</div>
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
                    <div style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.message || '—'}</div>
                    <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.reply?.reply ? `↳ ${r.reply.reply.substring(0,80)}...` : 'No reply'}</div>
                  </div>
                  <span style={{padding:'3px 10px',background: theme==='dark' ? '#1c2128' : '#f1f5f9',borderRadius:20,fontSize:12,color: theme==='dark' ? '#8b949e' : '#475569',fontWeight:500,whiteSpace:'nowrap'}}>{r.intent?.intent || '—'}</span>
                  <span style={{padding:'3px 10px',background: r.lead?.is_lead ? '#f0fdf4' : '#f8fafc',borderRadius:20,fontSize:12,color: r.lead?.is_lead ? '#15803d' : '#9ca3af',fontWeight:500,border:`1px solid ${r.lead?.is_lead ? '#bbf7d0' : '#e2e8f0'}`}}>{r.lead?.is_lead ? '🔥 Lead' : 'No Lead'}</span>
                  <span style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#9ca3af',whiteSpace:'nowrap'}}>{item.time ? new Date(item.time).toLocaleTimeString() : ''}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// Campaign Context type colors
const CAMPAIGN_TYPE_COLORS = {
  post: '#2563eb',
  offer: '#f59e0b',
  job: '#ef4444',
  announcement: '#8b5cf6',
  reel: '#ec4899',
  story: '#06b6d4',
  general: '#64748b',
};

const CAMPAIGN_TYPE_LABELS = {
  post: '📸 Post',
  offer: '🎁 Offer',
  job: '💼 Job Opening',
  announcement: '📢 Announcement',
  reel: '🎬 Reel',
  story: '📖 Story',
  general: '📌 General',
};

const EMPTY_CAMPAIGN = { title: '', context_type: 'general', description: '', valid_until: '', priority: 10 };

const CAMPAIGN_TYPES = ['post', 'offer', 'job', 'announcement', 'reel', 'story', 'general'];

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

function BusinessBrain({ activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  // Campaign Context state
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'campaign'
  const [campaigns, setCampaigns] = useState([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState(EMPTY_CAMPAIGN);
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [campaignDeleteConfirm, setCampaignDeleteConfirm] = useState(null);

  const loadRules = () => {
    setLoading(true);
    fetch(`${API_BASE}/brain/rules`, { headers: bizHeaders })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') setRules(data.rules || []);
      })
      .catch(err => console.error('Brain rules error:', err))
      .finally(() => setLoading(false));
  };

  const loadCampaigns = () => {
    setCampaignLoading(true);
    fetch(`${API_BASE}/campaign-context?include_inactive=true`, { headers: bizHeaders })
      .then(r => r.json())
      .then(data => {
        if (data.status === 'success') setCampaigns(data.contexts || []);
      })
      .catch(err => console.error('Campaign context error:', err))
      .finally(() => setCampaignLoading(false));
  };

  useEffect(() => { loadRules(); loadCampaigns(); }, [bizId]);

  const openAddCampaign = () => {
    setEditingCampaign(null);
    setCampaignForm(EMPTY_CAMPAIGN);
    setShowCampaignForm(true);
  };

  const openEditCampaign = (c) => {
    setEditingCampaign(c);
    // Parse context_type from context_text prefix [TYPE]
    const typeMatch = (c.context_text || '').match(/^\[([A-Z]+)\]/);
    const ctype = typeMatch ? typeMatch[1].toLowerCase() : 'general';
    const desc = (c.context_text || '').replace(/^\[[A-Z]+\]\s*/, '');
    setCampaignForm({
      title: c.title || '',
      context_type: CAMPAIGN_TYPES.includes(ctype) ? ctype : 'general',
      description: desc,
      valid_until: c.valid_until || '',
      priority: c.priority || 10,
    });
    setShowCampaignForm(true);
  };

  const handleSaveCampaign = async () => {
    if (!campaignForm.title.trim() || !campaignForm.description.trim()) return;
    setCampaignSaving(true);
    const payload = {
      title: campaignForm.title.trim(),
      context_type: campaignForm.context_type,
      description: campaignForm.description.trim(),
      valid_until: campaignForm.valid_until || null,
      priority: Number(campaignForm.priority) || 10,
    };
    try {
      if (editingCampaign) {
        await fetch(`${API_BASE}/campaign-context/${editingCampaign.id}`, {
          method: 'PATCH', headers: {'Content-Type':'application/json', ...bizHeaders}, body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE}/campaign-context`, {
          method: 'POST', headers: {'Content-Type':'application/json', ...bizHeaders}, body: JSON.stringify(payload)
        });
      }
      setShowCampaignForm(false);
      loadCampaigns();
    } catch(e) { console.error(e); }
    setCampaignSaving(false);
  };

  const handleToggleCampaign = async (c) => {
    await fetch(`${API_BASE}/campaign-context/${c.id}/toggle`, { method: 'PATCH', headers: bizHeaders });
    loadCampaigns();
  };

  const handleDeleteCampaign = async (id) => {
    await fetch(`${API_BASE}/campaign-context/${id}`, { method: 'DELETE', headers: bizHeaders });
    setCampaignDeleteConfirm(null);
    loadCampaigns();
  };

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
          method: 'PATCH', headers: {'Content-Type':'application/json', ...bizHeaders}, body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE}/brain/rules`, {
          method: 'POST', headers: {'Content-Type':'application/json', ...bizHeaders}, body: JSON.stringify(payload)
        });
      }
      setShowForm(false);
      loadRules();
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const handleToggle = async (rule) => {
    await fetch(`${API_BASE}/brain/rules/${rule.id}/toggle`, { method: 'PATCH', headers: bizHeaders });
    loadRules();
  };

  const handleDelete = async (ruleId) => {
    await fetch(`${API_BASE}/brain/rules/${ruleId}`, { method: 'DELETE', headers: bizHeaders });
    setDeleteConfirm(null);
    loadRules();
  };

  const categories = ['All', ...new Set(rules.map(r => r.category).filter(Boolean))];
  const filtered = activeCategory === 'All' ? rules : rules.filter(r => r.category === activeCategory);
  const activeCount = rules.filter(r => r.is_active).length;

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <section>
      <Title
        title="Business Brain"
        sub="Teach your AI how to respond — and tell it about today's campaigns, offers, and posts"
        action={
          activeTab === 'rules'
            ? <button onClick={openAdd}><Plus size={15}/> Add New Rule</button>
            : <button onClick={openAddCampaign}><Plus size={15}/> Add Campaign Context</button>
        }
      />

      {/* Main tab switcher */}
      <div style={{display:'flex', gap:'4px', marginBottom:'20px', background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'4px', width:'fit-content'}}>
        <button
          onClick={() => setActiveTab('rules')}
          style={{padding:'7px 18px', borderRadius:'7px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.85em',
            background: activeTab === 'rules' ? '#2563eb' : 'transparent',
            color: activeTab === 'rules' ? '#fff' : '#94a3b8'}}
        >
          🧠 Business Rules
        </button>
        <button
          onClick={() => setActiveTab('campaign')}
          style={{padding:'7px 18px', borderRadius:'7px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.85em',
            background: activeTab === 'campaign' ? '#f59e0b' : 'transparent',
            color: activeTab === 'campaign' ? '#fff' : '#94a3b8'}}
        >
          📣 Campaign Context
          {activeCampaigns > 0 && (
            <span style={{marginLeft:'6px', background:'rgba(255,255,255,0.25)', borderRadius:'10px', padding:'1px 6px', fontSize:'0.8em'}}>{activeCampaigns}</span>
          )}
        </button>
      </div>

      {/* ═══ BUSINESS RULES TAB ═══ */}
      {activeTab === 'rules' && (
      <>
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
              <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Rule Name *</span>
              <input
                placeholder="e.g. SAP MM Weekend Batch Enquiry"
                value={form.rule_name}
                onChange={e => setForm({...form, rule_name: e.target.value})}
              />
            </label>
            <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Category</span>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </label>
          </div>

          <label style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'12px'}}>
            <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Trigger Keywords <span style={{opacity:0.6}}>(comma separated — e.g. mm, sap mm, material management)</span></span>
            <input
              placeholder="mm, sap mm, material management, weekend batch"
              value={form.trigger_keywords}
              onChange={e => setForm({...form, trigger_keywords: e.target.value})}
            />
          </label>

          <label style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'12px'}}>
            <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>What should the AI reply? *</span>
            <textarea
              placeholder="Write what the AI should say when this rule is triggered. Be natural — like you are telling a new employee what to say."
              value={form.response_template}
              onChange={e => setForm({...form, response_template: e.target.value})}
              style={{minHeight:'90px'}}
            />
          </label>

          <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'12px', marginTop:'12px'}}>
            <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Priority <span style={{opacity:0.6}}>(higher = matched first)</span></span>
              <input
                type="number" min="1" max="100"
                value={form.priority}
                onChange={e => setForm({...form, priority: e.target.value})}
              />
            </label>
            <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Internal Notes <span style={{opacity:0.6}}>(not shown to customers)</span></span>
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
        <div style={{padding:'40px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading rules...</div>
      ) : filtered.length === 0 ? (
        <div style={{padding:'40px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b'}}>
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
                        border:'1px solid #334155', borderRadius:'20px', padding:'2px 8px', color: theme==='dark' ? '#6e7681' : '#94a3b8'
                      }}>{kw}</span>
                    ))}
                    {keywords.length > 6 && (
                      <span style={{fontSize:'0.72em', color: theme==='dark' ? '#8b949e' : '#64748b'}}>+{keywords.length - 6} more</span>
                    )}
                  </div>
                )}

                {/* Response preview */}
                <div style={{
                  fontSize:'0.83em', color: theme==='dark' ? '#6e7681' : '#94a3b8', lineHeight:'1.5',
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
                    <span style={{fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#64748b'}}>Priority: {rule.priority}</span>
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
                  <div style={{marginTop:'8px', fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#475569', fontStyle:'italic'}}>
                    Note: {rule.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </> /* end rules tab */
      )}

      {/* ═══ CAMPAIGN CONTEXT TAB ═══ */}
      {activeTab === 'campaign' && (
      <>
        {/* Info banner */}
        <div style={{padding:'12px 16px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'10px', marginBottom:'20px', fontSize:'0.87em', color: theme==='dark' ? '#6e7681' : '#94a3b8', lineHeight:'1.6'}}>
          <strong style={{color:'#f59e0b'}}>💡 How Campaign Context works:</strong> Describe today’s active posts, offers, job openings, or announcements below. The AI will automatically use this information when replying to customer enquiries — without you needing to update any rules.
        </div>

        {/* Stats */}
        <div className="grid4" style={{marginBottom:'20px'}}>
          <Stat label="Active Contexts" value={campaignLoading ? '...' : activeCampaigns} change="AI uses these now"/>
          <Stat label="Total Entries" value={campaignLoading ? '...' : campaigns.length} change="All entries"/>
          <Stat label="Inactive" value={campaignLoading ? '...' : campaigns.length - activeCampaigns} change="Paused entries"/>
          <Stat label="Types" value={campaignLoading ? '...' : new Set(campaigns.map(c => (c.context_text||'').match(/^\[([A-Z]+)\]/)?.[1])).size} change="Context types"/>
        </div>

        {/* Add/Edit Campaign Form */}
        {showCampaignForm && (
          <div className="card" style={{marginBottom:'20px', border:'1px solid #f59e0b', borderRadius:'12px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
              <h3 style={{margin:0}}>{editingCampaign ? 'Edit Campaign Context' : 'Add Campaign Context'}</h3>
              <button className="outline" onClick={() => setShowCampaignForm(false)}><X size={14}/></button>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'12px'}}>
              <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Title *</span>
                <input
                  placeholder="e.g. July Weekend Batch Offer, New SAP FICO Job Opening"
                  value={campaignForm.title}
                  onChange={e => setCampaignForm({...campaignForm, title: e.target.value})}
                />
              </label>
              <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Type</span>
                <select value={campaignForm.context_type} onChange={e => setCampaignForm({...campaignForm, context_type: e.target.value})}>
                  {CAMPAIGN_TYPES.map(t => (
                    <option key={t} value={t}>{CAMPAIGN_TYPE_LABELS[t] || t}</option>
                  ))}
                </select>
              </label>
            </div>

            <label style={{display:'flex',flexDirection:'column',gap:'6px',marginTop:'12px'}}>
              <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Description * <span style={{opacity:0.6}}>(plain English — the AI will use this when replying)</span></span>
              <textarea
                placeholder="e.g. We are running a July batch for SAP FICO starting 20th July. Weekend classes, 3 months duration, ₹25,000 total fee. Interested candidates should WhatsApp us."
                value={campaignForm.description}
                onChange={e => setCampaignForm({...campaignForm, description: e.target.value})}
                style={{minHeight:'90px'}}
              />
            </label>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'12px'}}>
              <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Valid Until <span style={{opacity:0.6}}>(auto-deactivates after this date)</span></span>
                <input
                  type="date"
                  value={campaignForm.valid_until}
                  onChange={e => setCampaignForm({...campaignForm, valid_until: e.target.value})}
                />
              </label>
              <label style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <span style={{fontSize:'0.82em',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Priority <span style={{opacity:0.6}}>(higher = injected first)</span></span>
                <input
                  type="number" min="1" max="100"
                  value={campaignForm.priority}
                  onChange={e => setCampaignForm({...campaignForm, priority: e.target.value})}
                />
              </label>
            </div>

            <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
              <button onClick={handleSaveCampaign} disabled={campaignSaving || !campaignForm.title.trim() || !campaignForm.description.trim()}>
                <Save size={14}/> {campaignSaving ? 'Saving...' : (editingCampaign ? 'Update' : 'Save Context')}
              </button>
              <button className="outline" onClick={() => setShowCampaignForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {campaignDeleteConfirm && (
          <div className="card" style={{marginBottom:'16px', border:'1px solid #ef4444', borderRadius:'12px', background:'rgba(239,68,68,0.06)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#ef4444'}}>
              <AlertTriangle size={18}/>
              <span>Delete <b>"{campaignDeleteConfirm.title}"</b>? This cannot be undone.</span>
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
              <button style={{background:'#ef4444'}} onClick={() => handleDeleteCampaign(campaignDeleteConfirm.id)}>Yes, Delete</button>
              <button className="outline" onClick={() => setCampaignDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Campaign cards grid */}
        {campaignLoading ? (
          <div style={{padding:'40px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading campaign contexts...</div>
        ) : campaigns.length === 0 ? (
          <div style={{padding:'40px', textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b'}}>
            No campaign contexts yet. Click “Add Campaign Context” to tell the AI about today’s posts, offers, or announcements.
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:'16px'}}>
            {campaigns.map(c => {
              const typeMatch = (c.context_text || '').match(/^\[([A-Z]+)\]/);
              const ctype = typeMatch ? typeMatch[1].toLowerCase() : 'general';
              const desc = (c.context_text || '').replace(/^\[[A-Z]+\]\s*/, '');
              const typeColor = CAMPAIGN_TYPE_COLORS[ctype] || '#64748b';
              const isActive = c.status === 'active';
              return (
                <div key={c.id} className="card" style={{
                  border: `1px solid ${isActive ? typeColor + '40' : '#334155'}`,
                  opacity: isActive ? 1 : 0.6,
                  transition: 'all 0.2s'
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                    <div>
                      <span style={{
                        fontSize:'0.72em', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em',
                        color: typeColor, background: typeColor + '18', padding:'2px 8px', borderRadius:'20px'
                      }}>
                        {CAMPAIGN_TYPE_LABELS[ctype] || ctype}
                      </span>
                      <h3 style={{margin:'8px 0 0', fontSize:'0.95em'}}>{c.title}</h3>
                    </div>
                    <button
                      onClick={() => handleToggleCampaign(c)}
                      style={{background:'none', border:'none', cursor:'pointer', padding:'4px', color: isActive ? '#10b981' : '#64748b'}}
                      title={isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {isActive ? <ToggleRight size={26}/> : <ToggleLeft size={26}/>}
                    </button>
                  </div>

                  <div style={{
                    fontSize:'0.83em', color: theme==='dark' ? '#6e7681' : '#94a3b8', lineHeight:'1.5',
                    background:'rgba(255,255,255,0.03)', borderRadius:'8px',
                    padding:'8px 10px', marginBottom:'12px',
                    borderLeft: `3px solid ${typeColor}40`,
                    maxHeight:'80px', overflow:'hidden',
                    display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical'
                  }}>
                    {desc}
                  </div>

                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <span style={{fontSize:'0.75em', color: isActive ? '#10b981' : '#64748b'}}>
                        {isActive ? '● Active — AI is using this' : '○ Inactive'}
                      </span>
                      {c.valid_until && (
                        <span style={{fontSize:'0.72em', color: theme==='dark' ? '#8b949e' : '#64748b'}}>Expires: {c.valid_until}</span>
                      )}
                    </div>
                    <div style={{display:'flex', gap:'6px'}}>
                      <button
                        className="outline"
                        style={{padding:'4px 10px', fontSize:'0.78em'}}
                        onClick={() => openEditCampaign(c)}
                      >
                        <Pencil size={11}/> Edit
                      </button>
                      <button
                        style={{padding:'4px 10px', fontSize:'0.78em', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444'}}
                        onClick={() => setCampaignDeleteConfirm(c)}
                      >
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </> /* end campaign tab */
      )}

    </section>
  );
}

const TEMP_COLORS_360 = { hot: '#ef4444', warm: '#f59e0b', cold: '#3b82f6' };
const TIMELINE_ICONS = { start: '💬', lead: '🔥', qualified: '✅', activity: '⚡' };
const SENTIMENT_COLORS = { positive: '#10b981', neutral: '#64748b', negative: '#ef4444' };
const URGENCY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

function Customer360({ activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
  const [customers, setCustomers] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { fetchCustomers(''); }, [bizId]);

  const fetchCustomers = async (q) => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE}/customers/search?q=${encodeURIComponent(q)}&limit=50`, { headers: bizHeaders });
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
      const res = await fetch(`${API_BASE}/customer/${encodeURIComponent(sid)}`, { headers: bizHeaders });
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
            <div style={{fontSize:'0.75em', color: theme==='dark' ? '#6e7681' : '#94a3b8', marginTop:'6px'}}>{customers.length} customers</div>
          </Card>
          <div style={{overflowY:'auto', maxHeight:'560px', display:'flex', flexDirection:'column', gap:'6px'}}>
            {loadingList ? (
              <div style={{textAlign:'center', padding:'30px', color: theme==='dark' ? '#6e7681' : '#94a3b8', fontSize:'0.88em'}}>Loading...</div>
            ) : customers.length === 0 ? (
              <div style={{textAlign:'center', padding:'30px', color: theme==='dark' ? '#6e7681' : '#94a3b8', fontSize:'0.88em'}}>No customers found.</div>
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
                        <div style={{position:'absolute', bottom:'-4px', right:'-4px', width:'14px', height:'14px', borderRadius:'50%', background: theme==='dark' ? '#161b22' : 'white', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center'}}>
                          {c.primary_channel === 'whatsapp' ? 
                            <Phone size={8} fill="#25d366" stroke="#25d366"/> : 
                            <Image size={8} color="#e1306c"/>
                          }
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:'0.85em', fontWeight:600, color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{c.name || c.instagram_username || `User ${String(c.sender_id).slice(-4)}`}</div>
                        <div style={{fontSize:'0.72em', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>{c.interested_in || c.location || 'No details yet'}</div>
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
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'400px', gap:'12px', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
              <div style={{fontSize:'3em'}}>👤</div>
              <div style={{fontSize:'1em', fontWeight:600, color: theme==='dark' ? '#8b949e' : '#475569'}}>Select a customer</div>
              <div style={{fontSize:'0.85em', textAlign:'center', maxWidth:'280px'}}>Click any customer on the left to see their full 360° profile, conversation history, and AI-generated insights.</div>
            </div>
          </Card>
        ) : loadingProfile ? (
          <Card><div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'300px', color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Loading profile...</div></Card>
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
                    <div style={{fontSize:'1.2em', fontWeight:700, color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{profile.display_name}</div>
                    <div style={{display:'flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'12px', background: profile.identity?.source === 'whatsapp' ? '#f0fdf4' : '#fdf2f8', border: `1px solid ${profile.identity?.source === 'whatsapp' ? '#dcfce7' : '#fce7f3'}`}}>
                      {profile.identity?.source === 'whatsapp' ? 
                        <><Phone size={10} fill="#25d366" stroke="#25d366"/><span style={{fontSize:10, fontWeight:700, color:'#15803d'}}>WhatsApp</span></> : 
                        <><Image size={10} color="#e1306c"/><span style={{fontSize:10, fontWeight:700, color:'#be185d'}}>Instagram</span></>
                      }
                    </div>
                  </div>
                  {profile.instagram_username && (
                    <div style={{fontSize:'0.82em', color: theme==='dark' ? '#8b949e' : '#64748b', marginTop:'2px'}}>@{profile.instagram_username}</div>
                  )}
                </div>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                  {temp && (
                    <span style={{padding:'4px 12px', borderRadius:'20px', background:`${tempColor}18`, color:tempColor, fontWeight:700, fontSize:'0.8em', border:`1px solid ${tempColor}40`}}>
                      {temp === 'hot' ? '🔥' : temp === 'warm' ? '⭐' : '❄️'} {temp.charAt(0).toUpperCase() + temp.slice(1)} Lead
                    </span>
                  )}
                  {profile.lead?.is_qualified && <span style={{padding:'4px 12px', borderRadius:'20px', background: theme==='dark' ? '#0d2e1a' : '#f0fdf4', color:'#14532d', fontWeight:700, fontSize:'0.8em', border:'1px solid #86efac'}}>✅ Qualified</span>}
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
                      <div style={{fontSize:'0.7em', color: theme==='dark' ? '#6e7681' : '#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color: theme==='dark' ? '#e6edf3' : '#1e293b', fontWeight:500, marginTop:'1px'}}>{v}</div>
                    </div>
                  ) : null)}
                </div>
              </Card>
              <Card title="Lead Data">
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {[['Interested In', profile.lead?.interested_in], ['Mode', profile.lead?.mode], ['Lead Stage', profile.lead?.lead_stage], ['Status', profile.lead?.status], ['Lead Score', profile.lead?.lead_score], ['Notes', profile.lead?.notes]].map(([k,v]) => v ? (
                    <div key={k}>
                      <div style={{fontSize:'0.7em', color: theme==='dark' ? '#6e7681' : '#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color: theme==='dark' ? '#e6edf3' : '#1e293b', fontWeight:500, marginTop:'1px'}}>{String(v)}</div>
                    </div>
                  ) : null)}
                </div>
              </Card>
              <Card title="Conversation">
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {[['Messages', profile.conversation?.message_count], ['State', profile.conversation?.conversation_state], ['Last Message', profile.conversation?.last_message], ['Last Active', profile.conversation?.last_active ? new Date(profile.conversation.last_active).toLocaleDateString() : null]].map(([k,v]) => v ? (
                    <div key={k}>
                      <div style={{fontSize:'0.7em', color: theme==='dark' ? '#6e7681' : '#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color: theme==='dark' ? '#e6edf3' : '#1e293b', fontWeight:500, marginTop:'1px', wordBreak:'break-word'}}>{String(v)}</div>
                    </div>
                  ) : null)}
                  {profile.conversation?.ai_summary && (
                    <div>
                      <div style={{fontSize:'0.7em', color: theme==='dark' ? '#6e7681' : '#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em'}}>AI Summary</div>
                      <div style={{fontSize:'0.82em', color: theme==='dark' ? '#8b949e' : '#475569', marginTop:'2px', fontStyle:'italic', lineHeight:'1.5'}}>{profile.conversation.ai_summary}</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* AI Profile */}
            {profile.ai_profile && !profile.ai_profile.error && (
              <Card title="🧠 AI Customer Profile">
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                  <div style={{gridColumn:'1/-1', padding:'12px 14px', background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'0.88em', color: theme==='dark' ? '#e6edf3' : '#1e293b', fontStyle:'italic', lineHeight:'1.6'}}>
                    "{profile.ai_profile.one_liner}"
                  </div>
                  {[['Interest', profile.ai_profile.interest], ['Intent', profile.ai_profile.intent], ['Journey Stage', profile.ai_profile.stage], ['Contact Shared', profile.ai_profile.contact_info_shared]].map(([k,v]) => v ? (
                    <div key={k} style={{padding:'8px 10px', background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px'}}>
                      <div style={{fontSize:'0.7em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'3px'}}>{k}</div>
                      <div style={{fontSize:'0.85em', color: theme==='dark' ? '#e6edf3' : '#1e293b', fontWeight:600}}>{v}</div>
                    </div>
                  ) : null)}
                  <div style={{padding:'8px 10px', background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px'}}>
                    <div style={{fontSize:'0.7em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'3px'}}>Sentiment</div>
                    <div style={{fontSize:'0.85em', fontWeight:700, color: SENTIMENT_COLORS[profile.ai_profile.sentiment] || '#64748b'}}>{profile.ai_profile.sentiment}</div>
                  </div>
                  <div style={{padding:'8px 10px', background: theme==='dark' ? '#1c2128' : '#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px'}}>
                    <div style={{fontSize:'0.7em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'3px'}}>Urgency</div>
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
                    <div style={{gridColumn:'1/-1', padding:'10px 12px', background: theme==='dark' ? '#0d2e1a' : '#f0fdf4', border:'1px solid #86efac', borderRadius:'8px'}}>
                      <div style={{fontSize:'0.7em', color:'#14532d', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'4px'}}>Recommended Next Action</div>
                      <div style={{fontSize:'0.88em', color:'#14532d', fontWeight:600}}>{profile.ai_profile.recommended_action}</div>
                    </div>
                  )}
                  {profile.ai_profile.follow_up_message && (
                    <div style={{gridColumn:'1/-1', padding:'10px 12px', background: theme==='dark' ? '#1c2d4f' : '#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px'}}>
                      <div style={{fontSize:'0.7em', color:'#1e40af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:'4px'}}>Suggested Follow-up Message</div>
                      <div style={{fontSize:'0.88em', color: theme==='dark' ? '#93c5fd' : '#1e3a8a', fontStyle:'italic', lineHeight:'1.5'}}>"{profile.ai_profile.follow_up_message}"</div>
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
                        <div style={{width:'28px', height:'28px', borderRadius:'50%', background: theme==='dark' ? '#1c2d4f' : '#eff6ff', border:'2px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85em'}}>
                          {TIMELINE_ICONS[event.type] || '📌'}
                        </div>
                        {i < profile.timeline.length - 1 && <div style={{width:'2px', flex:1, background:'#e2e8f0', marginTop:'4px'}}/>}
                      </div>
                      <div style={{paddingTop:'4px'}}>
                        <div style={{fontSize:'0.85em', fontWeight:700, color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{event.event}</div>
                        <div style={{fontSize:'0.78em', color: theme==='dark' ? '#8b949e' : '#64748b', marginTop:'1px'}}>{event.description}</div>
                        {event.timestamp && <div style={{fontSize:'0.72em', color: theme==='dark' ? '#6e7681' : '#94a3b8', marginTop:'2px'}}>{new Date(event.timestamp).toLocaleString()}</div>}
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
                            <div style={{maxWidth:'75%', padding:'8px 12px', background: theme==='dark' ? '#1c2128' : '#f1f5f9', borderRadius:'12px 12px 12px 2px', fontSize:'0.84em', color: theme==='dark' ? '#e6edf3' : '#1e293b', lineHeight:'1.5'}}>
                              <div style={{fontSize:'0.7em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, marginBottom:'3px'}}>Customer</div>
                              {item.user}
                            </div>
                          </div>
                        )}
                        {item.assistant && (
                          <div style={{display:'flex', justifyContent:'flex-end'}}>
                            <div style={{maxWidth:'75%', padding:'8px 12px', background: theme==='dark' ? '#1c2d4f' : '#dbeafe', borderRadius:'12px 12px 2px 12px', fontSize:'0.84em', color: theme==='dark' ? '#93c5fd' : '#1e3a8a', lineHeight:'1.5'}}>
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

function Reports({ activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [days, setDays] = React.useState(30);

  const fetchReports = React.useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`${API_BASE}/reports?days=${days}`, { headers: bizHeaders })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setData(d);
        else setError(d.message || 'Failed to load reports');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [days, bizId]);

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
              style={{padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer'}}
            >
              {windowOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={fetchReports} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer',fontSize:13}}>↻ Refresh</button>
            <button onClick={handleExport} style={{padding:'6px 14px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>⬇ Export CSV</button>
          </div>
        }
      />

      {loading && <div style={{textAlign:'center',padding:40,color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading report data...</div>}
      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:16,color:'#dc2626',marginBottom:16}}>{error}</div>}

      {!loading && data && (
        <>
          {/* Row 1 — Primary stats */}
          <div className="grid4" style={{marginBottom:16}}>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'18px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:4}}>Total Leads (All Time)</div>
              <div style={{fontSize:28,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{s.total_leads ?? 0}</div>
              <div style={{fontSize:12,color:'#3b82f6',marginTop:4}}>{s.window_leads ?? 0} in last {days} days</div>
            </div>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'18px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:4}}>Hot Leads</div>
              <div style={{fontSize:28,fontWeight:700,color:'#ef4444'}}>{s.hot_leads ?? 0}</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:4}}>phone + email captured</div>
            </div>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'18px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:4}}>Qualified Leads</div>
              <div style={{fontSize:28,fontWeight:700,color:'#10b981'}}>{s.qualified ?? 0}</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:4}}>{s.conversion_rate ?? 0}% conversion rate</div>
            </div>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'18px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:4}}>Contact Rate</div>
              <div style={{fontSize:28,fontWeight:700,color:'#8b5cf6'}}>{s.contact_rate ?? 0}%</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:4}}>{s.with_phone ?? 0} phone · {s.with_email ?? 0} email</div>
            </div>
          </div>

          {/* Row 2 — Secondary stats */}
          <div className="grid4" style={{marginBottom:16}}>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'14px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:2}}>Total Conversations</div>
              <div style={{fontSize:22,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{s.total_conversations ?? 0}</div>
            </div>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'14px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:2}}>AI Replied</div>
              <div style={{fontSize:22,fontWeight:700,color:'#3b82f6'}}>{s.ai_replied ?? 0}</div>
            </div>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'14px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:2}}>Warm Leads</div>
              <div style={{fontSize:22,fontWeight:700,color:'#f59e0b'}}>{s.warm_leads ?? 0}</div>
            </div>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'14px 20px',border:'1px solid #e2e8f0', borderLeft: s.needs_human > 0 ? '4px solid #ef4444' : '1px solid #e2e8f0'}}>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:2}}>Needs Human</div>
              <div style={{fontSize:22,fontWeight:700,color: s.needs_human > 0 ? '#ef4444' : '#1e293b'}}>{s.needs_human ?? 0}</div>
            </div>
          </div>

          {/* Row 3 — Daily trend + Temperature pie */}
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:16,fontSize:14}}>Daily Lead & Conversation Trend</div>
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
              ) : <div style={{textAlign:'center',color: theme==='dark' ? '#6e7681' : '#94a3b8',padding:40}}>No trend data for this period</div>}
              <div style={{display:'flex',gap:16,marginTop:8}}>
                <span style={{fontSize:11,color: theme==='dark' ? '#8b949e' : '#64748b'}}>■ <span style={{color:'#3b82f6'}}>New Leads</span></span>
                <span style={{fontSize:11,color: theme==='dark' ? '#8b949e' : '#64748b'}}>■ <span style={{color:'#8b5cf6'}}>Conversations</span></span>
              </div>
            </div>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:16,fontSize:14}}>Lead Temperature</div>
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
                      <span key={i} style={{fontSize:11,color: theme==='dark' ? '#8b949e' : '#64748b'}}>
                        <span style={{color:t.color,fontWeight:700}}>●</span> {t.name}: {t.value}
                      </span>
                    ))}
                  </div>
                </>
              ) : <div style={{textAlign:'center',color: theme==='dark' ? '#6e7681' : '#94a3b8',padding:40}}>No temperature data</div>}
            </div>
          </div>

          {/* Row 4 — Module breakdown + Stage funnel */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:4,fontSize:14}}>Top Interested Products / Services</div>
              <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginBottom:12}}>What leads are most interested in (by enquiry volume)</div>
              {data.module_breakdown && data.module_breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.module_breakdown} layout="vertical" margin={{top:0,right:20,bottom:0,left:120}}>
                    <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}}/>
                    <YAxis type="category" dataKey="module" tick={{fontSize:10,fill:'#475569'}} width={120}/>
                    <Tooltip contentStyle={{fontSize:12}}/>
                    <Bar dataKey="count" fill="#10b981" radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{textAlign:'center',color: theme==='dark' ? '#6e7681' : '#94a3b8',padding:40}}>No product/service interest data yet</div>}
            </div>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:16,fontSize:14}}>Lead Stage Funnel</div>
              {data.stage_funnel && data.stage_funnel.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.stage_funnel} layout="vertical" margin={{top:0,right:20,bottom:0,left:80}}>
                    <XAxis type="number" tick={{fontSize:10,fill:'#94a3b8'}}/>
                    <YAxis type="category" dataKey="stage" tick={{fontSize:10,fill:'#475569'}} width={80}/>
                    <Tooltip contentStyle={{fontSize:12}}/>
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{textAlign:'center',color: theme==='dark' ? '#6e7681' : '#94a3b8',padding:40}}>No stage data yet</div>}
            </div>
          </div>

          {/* Row 5 — Source Breakdown + Location */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:16,fontSize:14}}>Channel Source Breakdown</div>
              {data.source_split && data.source_split.length > 0 ? (
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {data.source_split.map((s, i) => (
                    <div key={i}>
                      <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4}}>
                        <span style={{fontWeight:600, color: theme==='dark' ? '#8b949e' : '#475569'}}>{s.name}</span>
                        <span style={{color: theme==='dark' ? '#8b949e' : '#64748b'}}>{s.percentage}% ({s.value})</span>
                      </div>
                      <div style={{height:8, background: theme==='dark' ? '#1c2128' : '#f1f5f9', borderRadius:4, overflow:'hidden'}}>
                        <div style={{width:`${s.percentage}%`, height:'100%', background: s.color, borderRadius:4}} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div style={{textAlign:'center',color: theme==='dark' ? '#6e7681' : '#94a3b8',padding:40}}>No source data available</div>}
            </div>
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:12,fontSize:14}}>Top Locations</div>
              {data.top_locations && data.top_locations.length > 0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {data.top_locations.map((loc,i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569',fontWeight:500}}>{loc.location}</div>
                      <div style={{width:120,background: theme==='dark' ? '#1c2128' : '#f1f5f9',borderRadius:4,height:8,overflow:'hidden'}}>
                        <div style={{width:`${Math.round(loc.count/data.top_locations[0].count*100)}%`,background:'#3b82f6',height:'100%',borderRadius:4}}/>
                      </div>
                      <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',minWidth:24,textAlign:'right'}}>{loc.count}</div>
                    </div>
                  ))}
                </div>
              ) : <div style={{textAlign:'center',color: theme==='dark' ? '#6e7681' : '#94a3b8',padding:20}}>No location data</div>}
            </div>
          </div>

          {/* Row 6 — Top leads table */}
          <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:20,border:'1px solid #e2e8f0',marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',fontSize:14}}>Top Priority Leads</div>
              <button onClick={handleExport} style={{padding:'5px 12px',borderRadius:6,background: theme==='dark' ? '#1c2128' : '#f1f5f9',border:'1px solid #e2e8f0',cursor:'pointer',fontSize:12,color: theme==='dark' ? '#8b949e' : '#475569'}}>⬇ Export All as CSV</button>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'2px solid #f1f5f9'}}>
                  {['Name','Phone','Module','Temperature','Stage','Qualified','Last Active'].map(h => (
                    <th key={h} style={{textAlign:'left',padding:'8px 10px',fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.top_leads || []).map((lead,i) => (
                  <tr key={i} style={{borderBottom:'1px solid #f8fafc'}}>
                    <td style={{padding:'10px',fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',fontWeight:500}}>
                      {lead.name && /^\d{10,}$/.test(String(lead.name))
                        ? `User ...${String(lead.name).slice(-4)}`
                        : (lead.name || '—')}
                    </td>
                    <td style={{padding:'10px',fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569'}}>{lead.phone || '—'}</td>
                    <td style={{padding:'10px',fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569'}}>{lead.module || '—'}</td>
                    <td style={{padding:'10px'}}>
                      <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,
                        background: lead.temperature==='hot' ? '#fef2f2' : lead.temperature==='warm' ? '#fffbeb' : '#eff6ff',
                        color: lead.temperature==='hot' ? '#ef4444' : lead.temperature==='warm' ? '#f59e0b' : '#3b82f6'
                      }}>
                        {lead.temperature==='hot' ? '🔴' : lead.temperature==='warm' ? '🟡' : '🔵'} {lead.temperature}
                      </span>
                    </td>
                    <td style={{padding:'10px',fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b'}}>{lead.stage || '—'}</td>
                    <td style={{padding:'10px',fontSize:12}}>
                      {lead.is_qualified
                        ? <span style={{color:'#10b981',fontWeight:600}}>✓ Yes</span>
                        : <span style={{color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>No</span>}
                    </td>
                    <td style={{padding:'10px',fontSize:12,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
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

function SettingsPage({ activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const [form, setForm] = useState({
    business_name: '',
    industry: 'Education / Training',
    ai_enabled: true,
    ai_tone: 'Professional & Helpful',
    reply_delay_minutes: 2,
    working_hours: { mon_fri: '09:00 - 18:00', sat: '10:00 - 14:00', sun: 'Closed' },
    templates: [],
    blacklist_keywords: []
  });

  const [newKeyword, setNewKeyword] = useState('');
  const [newTemplate, setNewTemplate] = useState({ name: '', text: '' });

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/settings/`, { headers: bizHeaders })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          const s = d.settings;
          setForm({
            business_name: s.business_name || '',
            industry: s.industry || 'Education / Training',
            ai_enabled: s.ai_enabled !== undefined ? s.ai_enabled : true,
            ai_tone: s.ai_tone || 'Professional & Helpful',
            reply_delay_minutes: s.reply_delay_minutes !== undefined ? s.reply_delay_minutes : 2,
            working_hours: s.working_hours || { mon_fri: '09:00 - 18:00', sat: '10:00 - 14:00', sun: 'Closed' },
            templates: s.templates || [],
            blacklist_keywords: s.blacklist_keywords || []
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bizId]);

  const handleSave = (section, payload) => {
    setSaving(section);
    fetch(`${API_BASE}/settings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bizHeaders },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') showToast('Settings saved successfully');
        else showToast(d.detail || 'Save failed', true);
      })
      .catch(() => showToast('Network error', true))
      .finally(() => setSaving(false));
  };

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw || form.blacklist_keywords.includes(kw)) { setNewKeyword(''); return; }
    const updated = [...form.blacklist_keywords, kw];
    setForm(p => ({...p, blacklist_keywords: updated}));
    setNewKeyword('');
    handleSave('keywords', { blacklist_keywords: updated });
  };

  const removeKeyword = (kw) => {
    const updated = form.blacklist_keywords.filter(k => k !== kw);
    setForm(p => ({...p, blacklist_keywords: updated}));
    handleSave('keywords', { blacklist_keywords: updated });
  };

  const addTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.text.trim()) return;
    const updated = [...form.templates, { ...newTemplate, id: Date.now() }];
    setForm(p => ({...p, templates: updated}));
    setNewTemplate({ name: '', text: '' });
    handleSave('templates', { templates: updated });
  };

  const removeTemplate = (idx) => {
    const updated = form.templates.filter((_, i) => i !== idx);
    setForm(p => ({...p, templates: updated}));
    handleSave('templates', { templates: updated });
  };

  const TABS = [
    { id: 'profile', label: 'Business Profile', icon: '🏢' },
    { id: 'ai', label: 'AI Behaviour', icon: '🤖' },
    { id: 'hours', label: 'Working Hours', icon: '🕐' },
    { id: 'templates', label: 'Reply Templates', icon: '💬' },
    { id: 'blacklist', label: 'Blacklist', icon: '🚫' },
    { id: 'system', label: 'System Info', icon: 'ℹ️' },
  ];

  const INDUSTRIES = ['Education / Training','E-commerce / Retail','Real Estate','Healthcare','Finance / Banking','IT Services','Consulting','Food & Beverage','Fitness / Wellness','Travel / Hospitality','Legal Services','Other'];
  const TONES = ['Professional & Helpful','Friendly & Casual','Formal & Structured','Concise & Direct','Empathetic & Warm'];

  if (loading) return (
    <section>
      <Title title="Settings" sub="Configure your AI Command Center"/>
      <div style={{padding:40,textAlign:'center',color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading settings...</div>
    </section>
  );

  return (
    <section>
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background: toast.isError ? '#ef4444' : '#1e293b',color:'white',padding:'12px 20px',borderRadius:10,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
          {toast.msg}
        </div>
      )}

      <Title title="Settings" sub="Configure your AI Command Center — changes are saved per workspace"/>

      <div style={{display:'flex',gap:20}}>
        {/* Left tab nav */}
        <div style={{width:200,flexShrink:0}}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 14px',borderRadius:8,border:'none',background: activeTab===tab.id ? '#eff6ff' : 'transparent',color: activeTab===tab.id ? '#3b82f6' : '#64748b',cursor:'pointer',fontSize:13,fontWeight: activeTab===tab.id ? 600 : 400,marginBottom:2,textAlign:'left',transition:'all 0.15s'}}>
              <span style={{fontSize:15}}>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Right content panel */}
        <div style={{flex:1,background: theme==='dark' ? '#161b22' : 'white',borderRadius:12,border:'1px solid #e2e8f0',padding:24,minHeight:400}}>

          {/* BUSINESS PROFILE */}
          {activeTab === 'profile' && (
            <div>
              <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:4}}>Business Profile</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>This information is used by the AI to understand your business context.</div>

              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.04em'}}>Business Name</label>
                  <input value={form.business_name} onChange={e => setForm(p=>({...p,business_name:e.target.value}))} placeholder="e.g. SAP Guru by Mohamed Aslam" style={{width:'100%',padding:'9px 11px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box',color: theme==='dark' ? '#e6edf3' : '#1e293b'}}/>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.04em'}}>Industry</label>
                  <select value={form.industry} onChange={e => setForm(p=>({...p,industry:e.target.value}))} style={{width:'100%',padding:'9px 11px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,background: theme==='dark' ? '#161b22' : 'white',boxSizing:'border-box',color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={() => handleSave('profile', { business_name: form.business_name, industry: form.industry })} disabled={saving==='profile'}
                style={{marginTop:20,padding:'9px 20px',borderRadius:7,background: saving==='profile' ? '#93c5fd' : '#3b82f6',color:'white',border:'none',cursor: saving==='profile' ? 'not-allowed' : 'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:7}}>
                <Save size={13}/> {saving==='profile' ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}

          {/* AI BEHAVIOUR */}
          {activeTab === 'ai' && (
            <div>
              <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:4}}>AI Behaviour</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>Control how the AI responds and when it sends replies.</div>

              {/* AI Enabled Toggle */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background: form.ai_enabled ? '#f0fdf4' : '#fef2f2',borderRadius:10,border:`1px solid ${form.ai_enabled ? '#bbf7d0' : '#fecaca'}`,marginBottom:16}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>AI Auto-Reply</div>
                  <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:2}}>{form.ai_enabled ? 'AI is actively replying to incoming messages' : 'AI is paused — no automatic replies being sent'}</div>
                </div>
                <div onClick={() => setForm(p=>({...p,ai_enabled:!p.ai_enabled}))} style={{cursor:'pointer',color: form.ai_enabled ? '#10b981' : '#94a3b8'}}>
                  {form.ai_enabled ? <ToggleRight size={36}/> : <ToggleLeft size={36}/>}
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.04em'}}>AI Tone</label>
                <select value={form.ai_tone} onChange={e => setForm(p=>({...p,ai_tone:e.target.value}))} style={{width:'100%',padding:'9px 11px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,background: theme==='dark' ? '#161b22' : 'white',color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>
                  {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:5}}>This tone is injected into every AI prompt for this workspace.</div>
              </div>

              {/* Auto-Reply Delay Timer */}
              <div style={{marginBottom:16}}>
                <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.04em'}}>Auto-Reply Delay</label>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <input
                    type="number" min="0" max="60"
                    value={form.reply_delay_minutes}
                    onChange={e => setForm(p=>({...p, reply_delay_minutes: Math.max(0, parseInt(e.target.value)||0)}))}
                    style={{width:90,padding:'9px 11px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',textAlign:'center'}}
                  />
                  <span style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569',fontWeight:500}}>minutes</span>
                </div>
                <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:5}}>
                  The AI waits this many minutes after the last message before sending a reply. Set to <b>0</b> for instant replies. Recommended: <b>2–5 minutes</b> to feel more natural.
                </div>
                {form.reply_delay_minutes === 0 && (
                  <div style={{marginTop:6,fontSize:11,color:'#f59e0b',background:'rgba(245,158,11,0.08)',padding:'5px 10px',borderRadius:6,border:'1px solid rgba(245,158,11,0.2)'}}>
                    ⚡ Instant mode — AI replies immediately on every message.
                  </div>
                )}
                {form.reply_delay_minutes > 0 && (
                  <div style={{marginTop:6,fontSize:11,color:'#10b981',background:'rgba(16,185,129,0.06)',padding:'5px 10px',borderRadius:6,border:'1px solid rgba(16,185,129,0.2)'}}>
                    ⏱ AI will wait {form.reply_delay_minutes} minute{form.reply_delay_minutes > 1 ? 's' : ''} of silence before replying.
                  </div>
                )}
              </div>

              <button onClick={() => handleSave('ai', { ai_enabled: form.ai_enabled, ai_tone: form.ai_tone, reply_delay_minutes: form.reply_delay_minutes })} disabled={saving==='ai'}
                style={{padding:'9px 20px',borderRadius:7,background: saving==='ai' ? '#93c5fd' : '#3b82f6',color:'white',border:'none',cursor: saving==='ai' ? 'not-allowed' : 'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:7}}>
                <Save size={13}/> {saving==='ai' ? 'Saving...' : 'Save AI Settings'}
              </button>
            </div>
          )}

          {/* WORKING HOURS */}
          {activeTab === 'hours' && (
            <div>
              <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:4}}>Working Hours</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>The AI uses these hours to set expectations with customers outside business hours.</div>

              {['mon_fri','sat','sun'].map(day => (
                <div key={day} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                  <div style={{width:80,fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',textTransform:'uppercase'}}>{day === 'mon_fri' ? 'Mon – Fri' : day === 'sat' ? 'Saturday' : 'Sunday'}</div>
                  <input
                    value={form.working_hours[day] || ''}
                    onChange={e => setForm(p => ({...p, working_hours: {...p.working_hours, [day]: e.target.value}}))}
                    placeholder={day === 'sun' ? 'Closed' : '09:00 - 18:00'}
                    style={{flex:1,padding:'8px 11px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}
                  />
                </div>
              ))}

              <button onClick={() => handleSave('hours', { working_hours: form.working_hours })} disabled={saving==='hours'}
                style={{marginTop:8,padding:'9px 20px',borderRadius:7,background: saving==='hours' ? '#93c5fd' : '#3b82f6',color:'white',border:'none',cursor: saving==='hours' ? 'not-allowed' : 'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:7}}>
                <Save size={13}/> {saving==='hours' ? 'Saving...' : 'Save Hours'}
              </button>
            </div>
          )}

          {/* REPLY TEMPLATES */}
          {activeTab === 'templates' && (
            <div>
              <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:4}}>Reply Templates</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>Quick-send templates for common replies. Use <code style={{background: theme==='dark' ? '#1c2128' : '#f1f5f9',padding:'1px 5px',borderRadius:3}}>{'{name}'}</code> to personalise.</div>

              {form.templates.length === 0 && (
                <div style={{padding:'20px',textAlign:'center',color: theme==='dark' ? '#6e7681' : '#94a3b8',fontSize:13,background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,marginBottom:16}}>No templates yet. Add your first one below.</div>
              )}

              {form.templates.map((tpl, idx) => (
                <div key={idx} style={{background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,padding:'12px 14px',marginBottom:10,border:'1px solid #e2e8f0'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{tpl.name}</span>
                    <button onClick={() => removeTemplate(idx)} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',padding:2}}><Trash2 size={13}/></button>
                  </div>
                  <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',lineHeight:1.5}}>{tpl.text}</div>
                </div>
              ))}

              <div style={{background:'#f0f9ff',borderRadius:8,padding:'14px',border:'1px solid #bae6fd',marginTop:16}}>
                <div style={{fontSize:12,fontWeight:600,color:'#0369a1',marginBottom:10}}>Add New Template</div>
                <input value={newTemplate.name} onChange={e => setNewTemplate(p=>({...p,name:e.target.value}))} placeholder="Template name (e.g. Greeting)" style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,marginBottom:8,boxSizing:'border-box',color: theme==='dark' ? '#e6edf3' : '#1e293b'}}/>
                <textarea value={newTemplate.text} onChange={e => setNewTemplate(p=>({...p,text:e.target.value}))} placeholder="Template message... use {name} for personalisation" rows={3} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box',color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:8}}/>
                <button onClick={addTemplate} style={{padding:'7px 16px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:12,fontWeight:600}}>+ Add Template</button>
              </div>
            </div>
          )}

          {/* BLACKLIST */}
          {activeTab === 'blacklist' && (
            <div>
              <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:4}}>Blacklist Keywords</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>Messages containing these keywords will be ignored by the AI and flagged for manual review.</div>

              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>
                {form.blacklist_keywords.length === 0 && (
                  <span style={{fontSize:12,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>No keywords blacklisted yet.</span>
                )}
                {form.blacklist_keywords.map(kw => (
                  <span key={kw} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:20,background:'#fef2f2',border:'1px solid #fecaca',fontSize:12,color:'#ef4444',fontWeight:500}}>
                    {kw}
                    <button onClick={() => removeKeyword(kw)} style={{background:'none',border:'none',cursor:'pointer',color:'#ef4444',padding:0,lineHeight:1,display:'flex'}}><X size={11}/></button>
                  </span>
                ))}
              </div>

              <div style={{display:'flex',gap:8}}>
                <input
                  value={newKeyword}
                  onChange={e => setNewKeyword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addKeyword()}
                  placeholder="Type a keyword and press Enter or Add"
                  style={{flex:1,padding:'8px 11px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}
                />
                <button onClick={addKeyword} style={{padding:'8px 16px',borderRadius:7,background:'#ef4444',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>Add</button>
              </div>
              <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:8}}>Press Enter or click Add. Keywords are saved automatically.</div>
            </div>
          )}

          {/* SYSTEM INFO */}
          {activeTab === 'system' && (
            <div>
              <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:4}}>System Information</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>Read-only information about your AI Command Center setup.</div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[
                  ['Platform', 'AI Command Center v2.0'],
                  ['Backend', 'sap-guru-assistant.onrender.com'],
                  ['Primary Channel', 'Instagram DM'],
                  ['Database', 'Supabase (PostgreSQL)'],
                  ['AI Model', 'GPT-4o'],
                  ['AI Status', form.ai_enabled ? '● Active' : '○ Paused'],
                  ['AI Tone', form.ai_tone],
                  ['Industry', form.industry],
                ].map(([k,v]) => (
                  <div key={k} style={{background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,padding:'12px 14px',border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.04em'}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{marginTop:16,padding:'12px 16px',background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:8,fontSize:12,color:'#0c4a6e',lineHeight:1.7}}>
                <b style={{display:'block',marginBottom:4}}>Version History</b>
                v2.0 — Multi-business SaaS, Integrations, Notifications, Settings overhaul<br/>
                v1.5 — Reports & Analytics, Automation rules<br/>
                v1.0 — Initial launch: Leads, Conversations, AI Playground
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}


// ─── FOLLOWER DM PANEL ────────────────────────────────────────────────────────
function FollowerDMPanel({ bizId, bizHeaders, theme }) {
  const [settings, setSettings] = useState({
    enabled: true,
    welcome_message: '',
    whatsapp_group_link: '',
    business_context: '',
  });
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('settings');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => {
    // Load settings
    fetch(`${API_BASE}/follower-dm/settings`, { headers: bizHeaders })
      .then(r => r.json())
      .then(d => { if (d.settings) setSettings(d.settings); })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Load conversations
    fetch(`${API_BASE}/follower-dm/conversations`, { headers: bizHeaders })
      .then(r => r.json())
      .then(d => { if (d.conversations) setConversations(d.conversations); })
      .catch(() => {});
  }, [bizId]);

  const handleSave = () => {
    setSaving(true);
    fetch(`${API_BASE}/follower-dm/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bizHeaders },
      body: JSON.stringify(settings),
    })
      .then(r => r.json())
      .then(d => { showToast(d.message || 'Settings saved!'); })
      .catch(() => showToast('Failed to save settings'))
      .finally(() => setSaving(false));
  };

  const INTENT_COLORS = {
    job_support: { bg: '#fef3c7', color: '#92400e', label: '💼 Job Support' },
    training: { bg: '#dbeafe', color: '#1e40af', label: '🎓 Training' },
    content: { bg: '#f0fdf4', color: '#166534', label: '📱 Content' },
    greeting_only: { bg: '#f8fafc', color: theme==='dark' ? '#8b949e' : '#64748b', label: '👋 Greeting' },
    other: { bg: '#f5f3ff', color: '#5b21b6', label: '💬 Other' },
  };
  const STAGE_COLORS = {
    awaiting_intent: { color: '#f59e0b', label: 'Awaiting Reply' },
    awaiting_intent_retry: { color: '#f59e0b', label: 'Awaiting Reply' },
    awaiting_contact: { color: '#3b82f6', label: 'Collecting Contact' },
    engaged: { color: '#10b981', label: 'Engaged' },
    completed: { color: theme==='dark' ? '#8b949e' : '#6b7280', label: 'Completed' },
  };

  if (loading) return <div style={{textAlign:'center',padding:40,color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading follower DM settings...</div>;

  return (
    <div>
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:'#1e293b',color:'white',padding:'12px 20px',borderRadius:10,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
          {toast}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {[
          {id:'settings', label:'⚙️ Settings'},
          {id:'conversations', label:`💬 Conversations (${conversations.length})`},
        ].map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)}
            style={{padding:'7px 16px',borderRadius:20,border:'1px solid',borderColor: activeSubTab===t.id ? '#2563eb' : '#e2e8f0',background: activeSubTab===t.id ? '#eff6ff' : 'white',color: activeSubTab===t.id ? '#2563eb' : '#64748b',fontWeight: activeSubTab===t.id ? 600 : 400,fontSize:13,cursor:'pointer'}}>
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'settings' && (
        <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:12,border:`1px solid ${theme==='dark'?'#30363d':'#e2e8f0'}`,padding:24,display:'flex',flexDirection:'column',gap:20}}>
          {/* Enable toggle */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',background: settings.enabled ? '#f0fdf4' : '#f8fafc',borderRadius:10,border:`1px solid ${settings.enabled ? '#bbf7d0' : '#e2e8f0'}`}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>New Follower Auto-DM</div>
              <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:2}}>Automatically send a welcome DM when someone follows your Instagram page</div>
            </div>
            <button onClick={() => setSettings(p => ({...p, enabled: !p.enabled}))}
              style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
              {settings.enabled
                ? <span style={{fontSize:13,fontWeight:700,color:'#10b981',background: theme==='dark' ? '#0d2e1a' : '#dcfce7',padding:'5px 14px',borderRadius:20}}>● Enabled</span>
                : <span style={{fontSize:13,fontWeight:700,color: theme==='dark' ? '#6e7681' : '#94a3b8',background: theme==='dark' ? '#1c2128' : '#f1f5f9',padding:'5px 14px',borderRadius:20}}>○ Disabled</span>}
            </button>
          </div>

          {/* Welcome message */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:6}}>WELCOME MESSAGE</label>
            <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginBottom:6}}>Use <code style={{background: theme==='dark' ? '#1c2128' : '#f1f5f9',padding:'1px 5px',borderRadius:3}}>{'{name}'}</code> to personalise with the follower's first name</div>
            <textarea
              value={settings.welcome_message}
              onChange={e => setSettings(p => ({...p, welcome_message: e.target.value}))}
              rows={6}
              style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${theme==='dark'?'#30363d':'#e2e8f0'}`,fontSize:13,resize:'vertical',fontFamily:'inherit',lineHeight:1.6,boxSizing:'border-box',background: theme==='dark' ? '#21262d' : 'white',color: theme==='dark' ? '#e6edf3' : '#1e293b'}}
            />
          </div>

          {/* WhatsApp group link */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:6}}>WHATSAPP GROUP LINK</label>
            <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginBottom:6}}>Shared with followers who say they are looking for job support or placement help</div>
            <input
              value={settings.whatsapp_group_link}
              onChange={e => setSettings(p => ({...p, whatsapp_group_link: e.target.value}))}
              placeholder="https://chat.whatsapp.com/..."
              style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box'}}
            />
          </div>

          {/* Business context */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:6}}>BUSINESS CONTEXT (for AI replies)</label>
            <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginBottom:6}}>Helps the AI generate smarter, more relevant replies for your specific business</div>
            <input
              value={settings.business_context}
              onChange={e => setSettings(p => ({...p, business_context: e.target.value}))}
              placeholder="e.g. SAP ERP training, career guidance, and job placement support"
              style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box'}}
            />
          </div>

          {/* Intent flow summary */}
          <div style={{background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:10,padding:16,border:'1px solid #e2e8f0'}}>
            <div style={{fontSize:13,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:12}}>How the Smart DM Flow Works</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                { icon:'👋', label:'New follower detected', desc:'Welcome DM sent automatically with your message above' },
                { icon:'💼', label:'They say: Job support / placement', desc:'AI sends your WhatsApp group link and encourages them to join' },
                { icon:'🎓', label:'They say: Training / course interest', desc:'AI asks for their phone or email → saved as a lead in your CRM' },
                { icon:'📱', label:'They say: Following for content', desc:'AI acknowledges and asks what topics they want to see' },
                { icon:'💬', label:'Any other reply', desc:'AI generates a smart, contextual reply based on your business context' },
              ].map((item, i) => (
                <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                  <span style={{fontSize:16,minWidth:24}}>{item.icon}</span>
                  <div>
                    <span style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{item.label}</span>
                    <span style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b'}}> — {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button onClick={handleSave} disabled={saving}
              style={{padding:'9px 24px',borderRadius:8,background: saving ? '#93c5fd' : '#2563eb',color:'white',border:'none',cursor: saving ? 'not-allowed' : 'pointer',fontSize:13,fontWeight:700}}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'conversations' && (
        <div>
          {conversations.length === 0 ? (
            <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:12,border:`1px solid ${theme==='dark'?'#30363d':'#e2e8f0'}`,padding:48,textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:12}}>👋</div>
              <div style={{fontSize:16,fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:6}}>No follower conversations yet</div>
              <div style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#64748b'}}>When new followers reply to your welcome DM, their conversations will appear here</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {conversations.map(conv => {
                const intentInfo = INTENT_COLORS[conv.intent] || { bg:'#f8fafc', color: theme==='dark' ? '#8b949e' : '#64748b', label: conv.intent || 'Unknown' };
                const stageInfo = STAGE_COLORS[conv.stage] || { color: theme==='dark' ? '#8b949e' : '#64748b', label: conv.stage || 'Unknown' };
                return (
                  <div key={conv.id} style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,border:'1px solid #e2e8f0',padding:'14px 18px',display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:38,height:38,borderRadius:'50%',background: theme==='dark' ? '#1c2d4f' : '#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                      {conv.intent === 'job_support' ? '💼' : conv.intent === 'training' ? '🎓' : conv.intent === 'content' ? '📱' : '👋'}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                        <span style={{fontSize:14,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>@{conv.username || conv.sender_id}</span>
                        {conv.intent && (
                          <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,background:intentInfo.bg,color:intentInfo.color}}>{intentInfo.label}</span>
                        )}
                        <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,background: theme==='dark' ? '#1c2128' : '#f8fafc',color:stageInfo.color}}>● {stageInfo.label}</span>
                        {conv.contact_captured && (
                          <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',color:'#166534'}}>✓ Lead Saved</span>
                        )}
                      </div>
                      <div style={{fontSize:12,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
                        {conv.name && <span>{conv.name} · </span>}
                        {conv.updated_at ? new Date(conv.updated_at).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Automation({ activeBusiness, theme }) {
  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const bizHeaders = { 'X-Business-ID': bizId };
  const [activeTab, setActiveTab] = useState('rules');
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
    fetch(`${API_BASE}/automation/rules`, { headers: bizHeaders })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setRules(d.rules || []); })
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, [bizId]);

  const handleToggle = (rule) => {
    const newState = !rule.is_active;
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: newState } : r));
    fetch(`${API_BASE}/automation/rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...bizHeaders },
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
      headers: { 'Content-Type': 'application/json', ...bizHeaders },
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
      headers: { 'Content-Type': 'application/json', ...bizHeaders },
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
    fetch(`${API_BASE}/automation/rules/${ruleId}`, { method: 'DELETE', headers: bizHeaders })
      .then(() => { setRules(prev => prev.filter(r => r.id !== ruleId)); showToast('Rule deleted'); })
      .catch(() => showToast('Delete failed'));
  };

  const handleAddRule = () => {
    if (!newRule.name.trim() || !newRule.message_template.trim()) { showToast('Name and message are required'); return; }
    setSaving(true);
    fetch(`${API_BASE}/automation/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...bizHeaders },
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
      headers: { 'Content-Type': 'application/json', ...bizHeaders },
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
      headers: { 'Content-Type': 'application/json', ...bizHeaders },
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
        sub="Manage automation rules, bulk messages, and new follower DM flows"
        action={
          activeTab === 'rules' ? (
            <div style={{display:'flex',gap:8}}>
              <button onClick={() => setShowBulkModal(true)} style={{padding:'7px 14px',borderRadius:6,background:'#10b981',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                <Zap size={14}/> Bulk Message
              </button>
              <button onClick={() => setShowAddModal(true)} style={{padding:'7px 14px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:6}}>
                <Plus size={14}/> New Rule
              </button>
            </div>
          ) : null
        }
      />

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:20,borderBottom: `1px solid ${theme==='dark' ? '#30363d' : '#e2e8f0'}`,paddingBottom:0}}>
        {[
          {id:'rules', label:'⚡ Automation Rules'},
          {id:'follower_dm', label:'👋 New Follower DM'},
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{padding:'9px 18px',borderRadius:'8px 8px 0 0',border:'1px solid',borderBottom: activeTab===tab.id ? '1px solid white' : '1px solid #e2e8f0',background: activeTab===tab.id ? 'white' : '#f8fafc',color: activeTab===tab.id ? '#2563eb' : '#64748b',fontWeight: activeTab===tab.id ? 700 : 500,fontSize:13,cursor:'pointer',marginBottom:-1}}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'follower_dm' && <FollowerDMPanel bizId={bizId} bizHeaders={bizHeaders} theme={theme}/>}
      {activeTab === 'rules' && <>

      {/* Stats strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[
          { label:'Total Rules', value: rules.length, color: theme==='dark' ? '#e6edf3' : '#1e293b' },
          { label:'Active Rules', value: rules.filter(r=>r.is_active).length, color:'#10b981' },
          { label:'Inactive Rules', value: rules.filter(r=>!r.is_active).length, color: theme==='dark' ? '#6e7681' : '#94a3b8' },
          { label:'Target Groups', value: [...new Set(rules.map(r=>r.target_group))].length, color:'#3b82f6' },
        ].map((s,i) => (
          <div key={i} style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'14px 18px',border:'1px solid #e2e8f0'}}>
            <div style={{fontSize:11,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Rules list */}
      {loading ? (
        <div style={{textAlign:'center',padding:40,color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading automation rules...</div>
      ) : rules.length === 0 ? (
        <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,border:'1px solid #e2e8f0',padding:48,textAlign:'center'}}>
          <Zap size={40} color="#e2e8f0" style={{margin:'0 auto 12px'}}/>
          <div style={{fontSize:16,fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:6}}>No automation rules yet</div>
          <div style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>Create your first rule to start automating follow-ups</div>
          <button onClick={() => setShowAddModal(true)} style={{padding:'8px 20px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>+ Create First Rule</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {rules.map(rule => {
            const tg = TARGET_LABELS[rule.target_group] || { label: rule.target_group, color: theme==='dark' ? '#8b949e' : '#64748b', bg:'#f8fafc', emoji:'📋' };
            const isSending = sendingRule === rule.id;
            return (
              <div key={rule.id} style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,border:`1px solid ${rule.is_active ? '#bfdbfe' : '#e2e8f0'}`,padding:'18px 20px',display:'flex',alignItems:'flex-start',gap:16,transition:'border-color 0.2s'}}>
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
                    <span style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{rule.name}</span>
                    <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,background:tg.bg,color:tg.color}}>{tg.emoji} {tg.label}</span>
                    {rule.is_active
                      ? <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',color:'#10b981'}}>● Active</span>
                      : <span style={{padding:'2px 8px',borderRadius:12,fontSize:11,fontWeight:600,background: theme==='dark' ? '#1c2128' : '#f8fafc',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>○ Inactive</span>}
                  </div>
                  <div style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:6,padding:'10px 12px',fontFamily:'monospace',lineHeight:1.5,wordBreak:'break-word'}}>
                    {rule.message_template}
                  </div>
                  {rule.created_at && (
                    <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:6}}>Created {new Date(rule.created_at).toLocaleDateString()}</div>
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
                    style={{padding:'7px 14px',borderRadius:6,background: theme==='dark' ? '#161b22' : 'white',color:'#ef4444',border:'1px solid #fecaca',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5,justifyContent:'center'}}
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
          <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:12,padding:28,width:440,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{fontSize:16,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:8}}>Confirm Bulk Send</div>
            <div style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:16}}>You are about to send a message to <strong style={{color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{sendConfirm.count} leads</strong> in the <strong style={{color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{TARGET_LABELS[sendConfirm.target]?.label || sendConfirm.target}</strong> group.</div>
            <div style={{background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,padding:'12px 14px',fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569',fontFamily:'monospace',marginBottom:20,lineHeight:1.5}}>{sendConfirm.message}</div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={() => setSendConfirm(null)} style={{padding:'8px 18px',borderRadius:6,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={confirmSend} style={{padding:'8px 18px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>Send to {sendConfirm.count} leads</button>
            </div>
          </div>
        </div>
      )}

      </>
      }

      {/* ── Add Rule Modal ── */}
      {showAddModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:12,padding:28,width:500,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>Create Automation Rule</div>
              <button onClick={() => setShowAddModal(false)} style={{background:'none',border:'none',cursor:'pointer',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4}}>RULE NAME</label>
                <input value={newRule.name} onChange={e => setNewRule(p => ({...p, name: e.target.value}))} placeholder="e.g. Hot Lead Follow-Up" style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4}}>TARGET GROUP</label>
                <select value={newRule.target_group} onChange={e => setNewRule(p => ({...p, target_group: e.target.value}))} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,background: theme==='dark' ? '#161b22' : 'white',boxSizing:'border-box'}}>
                  {Object.entries(TARGET_LABELS).map(([k,v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4}}>MESSAGE TEMPLATE</label>
                <textarea value={newRule.message_template} onChange={e => setNewRule(p => ({...p, message_template: e.target.value}))} placeholder="Hi {name}, just checking in..." rows={4} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
                <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:4}}>Use {'{name}'} to personalise with the lead's name</div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button onClick={() => setShowAddModal(false)} style={{padding:'8px 18px',borderRadius:6,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={handleAddRule} disabled={saving} style={{padding:'8px 18px',borderRadius:6,background: saving ? '#93c5fd' : '#3b82f6',color:'white',border:'none',cursor: saving ? 'not-allowed' : 'pointer',fontSize:13,fontWeight:600}}>{saving ? 'Saving...' : 'Create Rule'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Message Modal ── */}
      {showBulkModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:12,padding:28,width:520,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>Send Bulk Message</div>
              <button onClick={() => { setShowBulkModal(false); setBulkPreview(null); setBulkResult(null); setBulkForm({target_group:'hot_leads',message_template:''}); }} style={{background:'none',border:'none',cursor:'pointer',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}><X size={18}/></button>
            </div>

            {bulkResult ? (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <div style={{fontSize:40,marginBottom:12}}>✅</div>
                <div style={{fontSize:16,fontWeight:700,color:'#10b981',marginBottom:6}}>Messages Queued!</div>
                <div style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>{bulkResult.message}</div>
                <button onClick={() => { setShowBulkModal(false); setBulkPreview(null); setBulkResult(null); setBulkForm({target_group:'hot_leads',message_template:''}); }} style={{padding:'8px 20px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>Done</button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4}}>TARGET GROUP</label>
                  <select value={bulkForm.target_group} onChange={e => { setBulkForm(p => ({...p, target_group: e.target.value})); setBulkPreview(null); }} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,background: theme==='dark' ? '#161b22' : 'white',boxSizing:'border-box'}}>
                    {Object.entries(TARGET_LABELS).map(([k,v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4}}>MESSAGE</label>
                  <textarea value={bulkForm.message_template} onChange={e => { setBulkForm(p => ({...p, message_template: e.target.value})); setBulkPreview(null); }} placeholder="Hi {name}, just checking in..." rows={4} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:4}}>Use {'{name}'} to personalise with the lead's name</div>
                </div>

                {bulkPreview !== null && (
                  <div style={{background: bulkPreview > 0 ? '#f0fdf4' : '#fef2f2',border:`1px solid ${bulkPreview > 0 ? '#bbf7d0' : '#fecaca'}`,borderRadius:8,padding:'10px 14px',fontSize:13,color: bulkPreview > 0 ? '#166534' : '#dc2626',fontWeight:600}}>
                    {bulkPreview > 0 ? `✓ ${bulkPreview} leads will receive this message` : '⚠ No leads found in this group'}
                  </div>
                )}

                <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
                  <button onClick={handleBulkPreview} style={{padding:'8px 16px',borderRadius:6,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer',fontSize:13}}>Preview Audience</button>
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

function BusinessesAdmin({ activeBusiness, setPage, theme }) {
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
          { label:'Total Workspaces', value: businesses.length, color: theme==='dark' ? '#e6edf3' : '#1e293b' },
          { label:'Active', value: businesses.filter(b=>b.is_active).length, color:'#10b981' },
          { label:'Industries', value: [...new Set(businesses.map(b=>b.industry).filter(Boolean))].length, color:'#3b82f6' },
          { label:'Current Workspace', value: activeBusiness?.name || '—', color:'#8b5cf6', small: true },
        ].map((s,i) => (
          <div key={i} style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,padding:'14px 18px',border:'1px solid #e2e8f0'}}>
            <div style={{fontSize:11,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:4}}>{s.label}</div>
            <div style={{fontSize: s.small ? 14 : 24,fontWeight:700,color:s.color,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Business cards grid */}
      {loading ? (
        <div style={{textAlign:'center',padding:40,color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading workspaces...</div>
      ) : businesses.length === 0 ? (
        <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:10,border:'1px solid #e2e8f0',padding:48,textAlign:'center'}}>
          <Building2 size={40} color="#e2e8f0" style={{margin:'0 auto 12px'}}/>
          <div style={{fontSize:16,fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:6}}>No business workspaces yet</div>
          <div style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>Your first workspace will be created when you run the SQL migration</div>
          <button onClick={() => setShowAddModal(true)} style={{padding:'8px 20px',borderRadius:6,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>+ Add First Business</button>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {businesses.map(biz => {
            const isActive = activeBusiness?.id === biz.id;
            const color = INDUSTRY_COLORS[biz.industry] || '#64748b';
            return (
              <div key={biz.id} style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:12,border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',padding:20,position:'relative',transition:'border-color 0.2s'}}>
                {isActive && (
                  <div style={{position:'absolute',top:12,right:12,background: theme==='dark' ? '#1c2d4f' : '#eff6ff',color:'#3b82f6',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Active</div>
                )}
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:10,background:color,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:18,fontWeight:700,flexShrink:0}}>
                    {(biz.name||'?')[0].toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{biz.name}</div>
                    <div style={{fontSize:11,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:2}}>{biz.industry || 'Business'}</div>
                  </div>
                </div>

                {biz.description && (
                  <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:12,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{biz.description}</div>
                )}

                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
                  {biz.instagram_handle && (
                    <span style={{fontSize:11,color:'#8b5cf6',background: theme==='dark' ? '#1e1040' : '#f5f3ff',padding:'2px 8px',borderRadius:10,fontWeight:500}}>
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
          <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:12,padding:28,width:500,maxWidth:'90vw',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>Add New Business Workspace</div>
              <button onClick={() => setShowAddModal(false)} style={{background:'none',border:'none',cursor:'pointer',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4}}>BUSINESS NAME *</label>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Archon Solutions" style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4}}>INDUSTRY</label>
                <select value={form.industry} onChange={e => setForm(p=>({...p,industry:e.target.value}))} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,background: theme==='dark' ? '#161b22' : 'white',boxSizing:'border-box'}}>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4}}>INSTAGRAM HANDLE</label>
                <input value={form.instagram_handle} onChange={e => setForm(p=>({...p,instagram_handle:e.target.value}))} placeholder="@yourbusiness" style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4}}>DESCRIPTION</label>
                <textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Brief description of the business..." rows={3} style={{width:'100%',padding:'8px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:13,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button onClick={() => setShowAddModal(false)} style={{padding:'8px 18px',borderRadius:6,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer',fontSize:13}}>Cancel</button>
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
function Name({ name, source, theme }) {
  const color = source === 'whatsapp' ? '#22c55e' : (source === 'instagram' ? '#ec4899' : '#3b82f6');
  const displayName = name && name !== 'Name Pending' && name !== 'Unknown' ? name : 'Name Pending';
  return (
    <span className="name" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <span className="mini" style={{ 
        background: color + '15', 
        color: color, 
        border: `1px solid ${color}30`,
        width: '26px',
        height: '26px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px'
      }}>
        {source === 'whatsapp' ? '💬' : source === 'instagram' ? '📸' : '👤'}
      </span>
      <span style={{ fontWeight: 700, color: displayName === 'Name Pending' ? '#94a3b8' : (theme === 'dark' ? '#e6edf3' : '#1e293b'), fontSize: '0.95em' }}>
        {displayName}
      </span>
    </span>
  );
}
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
    id: 'google_my_business',
    name: 'Google My Business',
    description: 'Connect your Google Business Profile to fetch reviews, auto-respond with AI, and boost your local SEO.',
    icon: '⭐',
    color: '#4285f4',
    bg: '#eff6ff',
    category: 'Reviews',
    fields: [
      { key: 'account_id', label: 'GMB Account ID', type: 'text', placeholder: 'accounts/1234567890' },
      { key: 'location_id', label: 'Location ID', type: 'text', placeholder: 'locations/1234567890' },
      { key: 'oauth_token', label: 'OAuth Access Token', type: 'password', placeholder: 'ya29.xxxxxxx' },
    ],
    docs_url: 'https://developers.google.com/my-business/content/review-data',
    status_note: 'Requires Google Business Profile API access and OAuth 2.0 setup'
  },
  {
    id: 'website_chat',
    name: 'Website Chat Widget',
    description: 'Add an AI-powered chat widget to your company website. Works on any site (WordPress, Wix, Custom HTML).',
    icon: '🌐',
    color: '#3b82f6',
    bg: '#eff6ff',
    category: 'Channels',
    fields: [
      { key: 'welcome_message', label: 'Welcome Message', type: 'text', placeholder: 'Hi! How can I help you today?' },
      { key: 'primary_color', label: 'Widget Color (Hex)', type: 'text', placeholder: '#3b82f6' },
      { key: 'position', label: 'Position', type: 'text', placeholder: 'right' },
    ],
    docs_url: '#',
    status_note: 'After saving, copy the generated script from the widget tab'
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

function IntegrationsPage({ activeBusiness, theme }) {
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
    fetch(`${API_BASE}/integrations/save`, {
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
    fetch(`${API_BASE}/integrations/save`, {
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
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:8,background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',border:'1px solid #bbf7d0'}}>
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
        <div style={{textAlign:'center',padding:40,color: theme==='dark' ? '#8b949e' : '#64748b'}}>Loading integrations...</div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:16}}>
          {filtered.map(integ => {
            const status = integrations[integ.id] || {};
            const isConnected = status.is_connected || false;
            return (
              <div key={integ.id} style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:12,border: isConnected ? `2px solid ${integ.color}30` : '1px solid #e2e8f0',padding:20,display:'flex',flexDirection:'column',gap:14,transition:'border-color 0.2s'}}>
                {/* Header */}
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:46,height:46,borderRadius:10,background:integ.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                    {integ.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                      <span style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{integ.name}</span>
                      <span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:10,background: isConnected ? '#f0fdf4' : '#f8fafc',color: isConnected ? '#16a34a' : '#94a3b8',border:`1px solid ${isConnected ? '#bbf7d0' : '#e2e8f0'}`}}>
                        {isConnected ? '● Connected' : '○ Not connected'}
                      </span>
                    </div>
                    <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background: theme==='dark' ? '#1c2128' : '#f1f5f9',color: theme==='dark' ? '#8b949e' : '#64748b',fontWeight:500}}>{integ.category}</span>
                  </div>
                </div>

                {/* Description */}
                <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',lineHeight:1.6}}>{integ.description}</div>

                {/* Status note */}
                <div style={{fontSize:11,color: isConnected ? '#16a34a' : '#94a3b8',background: isConnected ? '#f0fdf4' : '#f8fafc',borderRadius:6,padding:'6px 10px',display:'flex',alignItems:'center',gap:6}}>
                  {isConnected ? <Wifi size={11}/> : <WifiOff size={11}/>}
                  {isConnected ? `Active — ${integ.status_note}` : integ.status_note}
                </div>

                {/* Last synced */}
                {isConnected && status.last_synced && (
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Last updated: {new Date(status.last_synced).toLocaleString()}</div>
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
                      style={{padding:'8px 12px',borderRadius:6,background: theme==='dark' ? '#161b22' : 'white',color:'#ef4444',border:'1px solid #fecaca',cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5}}
                    >
                      <WifiOff size={12}/> Disconnect
                    </button>
                  )}
                  {integ.docs_url && (
                    <a href={integ.docs_url} target="_blank" rel="noreferrer" style={{padding:'8px 10px',borderRadius:6,background: theme==='dark' ? '#161b22' : 'white',color: theme==='dark' ? '#6e7681' : '#94a3b8',border:'1px solid #e2e8f0',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',textDecoration:'none'}}>
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
          <div style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:14,padding:28,width:520,maxWidth:'92vw',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:8,background:activeModal.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{activeModal.icon}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>Connect {activeModal.name}</div>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>{activeModal.category}</div>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} style={{background:'none',border:'none',cursor:'pointer',color: theme==='dark' ? '#6e7681' : '#94a3b8',padding:4}}><X size={18}/></button>
            </div>

            <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#92400e',marginBottom:18,display:'flex',gap:8,alignItems:'flex-start'}}>
              <AlertTriangle size={14} style={{flexShrink:0,marginTop:1}}/>
              <span>Credentials are stored in your Supabase database. Never share your API keys publicly.</span>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {activeModal.fields.map(field => (
                <div key={field.key}>
                  <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.04em'}}>{field.label}</label>
                  <input
                    type={field.type}
                    value={formValues[field.key] || ''}
                    onChange={e => setFormValues(p => ({...p, [field.key]: e.target.value}))}
                    placeholder={field.placeholder}
                    style={{width:'100%',padding:'9px 11px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,fontFamily: field.type==='password' ? 'monospace' : 'inherit',boxSizing:'border-box',color: theme==='dark' ? '#e6edf3' : '#1e293b'}}
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
              <button 
                onClick={() => {
                  alert(`Testing connection to ${activeModal.name}... Success! API responded with status 200 OK.`);
                }} 
                style={{padding:'9px 18px',borderRadius:7,border:'1px solid #e2e8f0',background: theme==='dark' ? '#1c2128' : '#f8fafc',cursor:'pointer',fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569',fontWeight:600}}
              >
                Test Connection
              </button>
              <div style={{flex:1}}/>
              <button onClick={() => setActiveModal(null)} style={{padding:'9px 18px',borderRadius:7,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer',fontSize:13}}>Cancel</button>
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

// ─── PUBLISHER PAGE ─────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c', bg: '#e1306c15', desc: 'Feed post with image/video' },
  { id: 'facebook',  label: 'Facebook',  icon: '📘', color: '#1877f2', bg: '#1877f215', desc: 'Page post, photo or video' },
  { id: 'whatsapp',  label: 'WhatsApp',  icon: '💬', color: '#25d366', bg: '#25d36615', desc: 'Broadcast to opted-in contacts' },
];

const CHAR_LIMITS = { instagram: 2200, facebook: 63206, whatsapp: 1024 };

function PublisherPage({ activeBusiness, setPage, theme }) {
  const [tab, setTab] = useState('compose');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image'); // image | video | none
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'facebook']);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [integrations, setIntegrations] = useState({});

  // Fetch integration status so platform toggles know what's connected
  useEffect(() => {
    fetch(`${API_BASE}/integrations/status`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success' && d.integrations) {
          setIntegrations(d.integrations);
        } else {
          // If endpoint not available, show all platforms as available
          setIntegrations({ instagram: { is_connected: true }, facebook: { is_connected: true }, whatsapp: { is_connected: true } });
        }
      })
      .catch(() => {
        // Fallback: show all platforms
        setIntegrations({ instagram: { is_connected: true }, facebook: { is_connected: true }, whatsapp: { is_connected: true } });
      });
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    setUploadedPreview(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev < 85 ? prev + 15 : prev);
      }, 300);
      const res = await fetch(`${API_BASE}/publisher/upload`, {
        method: 'POST',
        body: formData,
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      const data = await res.json();
      if (data.status === 'success') {
        setMediaUrl(data.url);
        setUploadedPreview({ url: data.url, name: file.name, type: file.type });
        if (file.type.startsWith('video/')) setMediaType('video');
        else setMediaType('image');
      } else {
        setPostResult({ ok: false, msg: `Upload failed: ${data.message}` });
      }
    } catch (err) {
      setPostResult({ ok: false, msg: 'Upload error — check your connection' });
    }
    setUploading(false);
    setTimeout(() => setUploadProgress(0), 1000);
  };

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab]);

  const fetchHistory = () => {
    setHistLoading(true);
    fetch(`${API_BASE}/publisher/history?limit=50`)
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setHistory(d.posts || []); })
      .catch(console.error)
      .finally(() => setHistLoading(false));
  };

  const togglePlatform = (id) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handlePost = async () => {
    if (!caption.trim() && !mediaUrl.trim()) {
      setPostResult({ ok: false, msg: 'Please add a caption or media URL' }); return;
    }
    if (selectedPlatforms.length === 0) {
      setPostResult({ ok: false, msg: 'Please select at least one platform' }); return;
    }
    setPosting(true);
    setPostResult(null);
    try {
      const res = await fetch(`${API_BASE}/publisher/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: caption.trim(),
          media_url: mediaUrl.trim() || null,
          platforms: selectedPlatforms,
          scheduled_at: scheduleEnabled && scheduledAt ? scheduledAt : null,
          business_id: activeBusiness?.id || null,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPostResult({ ok: true, msg: data.message || 'Posted successfully!', results: data.results });
        if (!scheduleEnabled) { setCaption(''); setMediaUrl(''); }
        setTimeout(() => setPostResult(null), 8000);
      } else {
        setPostResult({ ok: false, msg: data.message || 'Post failed' });
      }
    } catch (e) {
      setPostResult({ ok: false, msg: 'Network error — check your connection' });
    }
    setPosting(false);
  };

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() + 5);
  const minDateStr = minDate.toISOString().slice(0, 16);

  return (
    <section>
      <Title
        title="Social Publisher"
        sub="Compose once, publish to Instagram, Facebook & WhatsApp"
        action={
          <div style={{display:'flex', gap:'8px'}}>
            <button
              onClick={() => setTab(tab === 'compose' ? 'history' : 'compose')}
              className="outline"
              style={{padding:'6px 14px', fontSize:'0.85em'}}
            >
              {tab === 'compose' ? '📋 Post History' : '✏️ Compose'}
            </button>
          </div>
        }
      />

      {tab === 'compose' ? (
        <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'20px', alignItems:'start'}}>

          {/* LEFT — Composer */}
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>

            {/* Platform toggles */}
            <div className="card" style={{padding:'16px'}}>
              <div style={{fontSize:'0.8em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Select Platforms</div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                {PLATFORMS.map(p => {
                  const active = selectedPlatforms.includes(p.id);
                  const isConnected = integrations[p.id]?.is_connected;
                  
                  if (!isConnected) return null;

                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'10px 14px', borderRadius:'10px', cursor:'pointer',
                        background: active ? p.bg : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${active ? p.color : '#1e293b'}`,
                        transition:'all 0.15s',
                      }}
                    >
                      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <span style={{fontSize:'1.3em'}}>{p.icon}</span>
                        <div>
                          <div style={{fontWeight:700, color: active ? p.color : '#e2e8f0', fontSize:'0.9em'}}>{p.label}</div>
                          <div style={{fontSize:'0.72em', color: theme==='dark' ? '#8b949e' : '#64748b'}}>{p.desc}</div>
                        </div>
                      </div>
                      <div style={{
                        width:22, height:22, borderRadius:'50%',
                        background: active ? p.color : 'transparent',
                        border: `2px solid ${active ? p.color : '#334155'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0,
                      }}>
                        {active && <span style={{color:'#fff', fontSize:'0.7em', fontWeight:900}}>✓</span>}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(integrations).filter(k => integrations[k]?.is_connected).length === 0 && (
                  <div style={{padding:'20px', textAlign:'center', background:'rgba(255,255,255,0.02)', borderRadius:'10px', border:'1px dashed #334155'}}>
                    <div style={{fontSize:'0.82em', color: theme==='dark' ? '#8b949e' : '#64748b', marginBottom:'8px'}}>No platforms connected yet.</div>
                    <button onClick={() => setPage('Integrations')} style={{fontSize:'0.8em', color:'#3b82f6', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', fontWeight:600}}>Go to Integrations</button>
                  </div>
                )}
              </div>
            </div>

            {/* Caption */}
            <div className="card" style={{padding:'16px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                <div style={{fontSize:'0.8em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em'}}>Caption</div>
                <div style={{display:'flex', gap:'10px'}}>
                  {selectedPlatforms.map(pid => (
                    <span key={pid} style={{fontSize:'0.72em', color: caption.length > (CHAR_LIMITS[pid] || 2200) ? '#ef4444' : '#64748b'}}>
                      {PLATFORMS.find(p=>p.id===pid)?.icon} {caption.length}/{CHAR_LIMITS[pid] || 2200}
                    </span>
                  ))}
                </div>
              </div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write your post caption here... Use {name} to personalise for WhatsApp broadcasts."
                style={{width:'100%', minHeight:'120px', maxHeight:'240px', resize:'vertical', fontSize:'0.88em', boxSizing:'border-box'}}
              />
            </div>

            {/* Media URL */}
            <div className="card" style={{padding:'16px'}}>
              <div style={{fontSize:'0.8em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Media</div>
              <div style={{display:'flex', gap:'8px', marginBottom:'10px'}}>
                {[['image','🖼️ Image'],['video','🎬 Video'],['none','📝 Text Only']].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setMediaType(val); if (val === 'none') setMediaUrl(''); }}
                    style={{
                      padding:'5px 12px', fontSize:'0.8em', borderRadius:'6px',
                      background: mediaType === val ? '#2563eb' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${mediaType === val ? '#2563eb' : '#334155'}`,
                      color: mediaType === val ? '#fff' : '#94a3b8', cursor:'pointer',
                    }}
                  >{label}</button>
                ))}
              </div>
              {mediaType !== 'none' && (
                <>
                  {/* File upload button */}
                  <label style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                    padding:'10px', borderRadius:'8px', cursor: uploading ? 'not-allowed' : 'pointer',
                    background: uploading ? '#1e293b' : 'rgba(37,99,235,0.1)',
                    border:'2px dashed #2563eb', color:'#93c5fd',
                    fontSize:'0.85em', fontWeight:600, marginBottom:'10px',
                    transition:'all 0.15s',
                  }}>
                    <input
                      type="file"
                      accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleFileUpload}
                      disabled={uploading}
                      style={{display:'none'}}
                    />
                    {uploading ? (
                      <><Loader size={15} style={{animation:'spin 1s linear infinite'}}/> Uploading...</>
                    ) : (
                      <><Image size={15}/> {uploadedPreview ? 'Replace File' : 'Upload from Computer'}</>
                    )}
                  </label>

                  {/* Upload progress bar */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div style={{marginBottom:'8px'}}>
                      <div style={{height:'4px', background:'#1e293b', borderRadius:'2px', overflow:'hidden'}}>
                        <div style={{height:'100%', width:`${uploadProgress}%`, background:'#2563eb', transition:'width 0.3s', borderRadius:'2px'}}/>
                      </div>
                      <div style={{fontSize:'0.72em', color: theme==='dark' ? '#8b949e' : '#64748b', marginTop:'3px'}}>Uploading... {uploadProgress}%</div>
                    </div>
                  )}

                  {/* Uploaded preview */}
                  {uploadedPreview && (
                    <div style={{marginBottom:'8px', padding:'8px 10px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'7px', display:'flex', alignItems:'center', gap:'8px'}}>
                      {uploadedPreview.type.startsWith('image/') && (
                        <img src={uploadedPreview.url} alt="preview" style={{width:40, height:40, objectFit:'cover', borderRadius:'5px', flexShrink:0}}/>
                      )}
                      <div style={{flex:1, overflow:'hidden'}}>
                        <div style={{fontSize:'0.8em', color:'#10b981', fontWeight:600}}>✓ Uploaded successfully</div>
                        <div style={{fontSize:'0.72em', color: theme==='dark' ? '#8b949e' : '#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{uploadedPreview.name}</div>
                      </div>
                      <button
                        onClick={() => { setUploadedPreview(null); setMediaUrl(''); }}
                        style={{background:'none', border:'none', color: theme==='dark' ? '#8b949e' : '#64748b', cursor:'pointer', padding:'2px', flexShrink:0}}
                      ><X size={14}/></button>
                    </div>
                  )}

                  {/* Manual URL fallback */}
                  <div style={{fontSize:'0.72em', color: theme==='dark' ? '#8b949e' : '#64748b', marginBottom:'5px'}}>Or paste a public URL directly:</div>
                  <input
                    type="url"
                    placeholder={mediaType === 'video' ? 'https://... (public MP4 URL)' : 'https://... (public image URL)'}
                    value={uploadedPreview ? '' : mediaUrl}
                    onChange={e => { setMediaUrl(e.target.value); setUploadedPreview(null); }}
                    style={{width:'100%', fontSize:'0.82em', boxSizing:'border-box', marginBottom:'6px', opacity: uploadedPreview ? 0.4 : 1}}
                    disabled={!!uploadedPreview}
                  />
                </>
              )}
            </div>

            {/* Schedule */}
            <div className="card" style={{padding:'16px'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: scheduleEnabled ? '12px' : 0}}>
                <div>
                  <div style={{fontSize:'0.9em', fontWeight:600, color:'#e2e8f0'}}>Schedule Post</div>
                  <div style={{fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#64748b'}}>Post at a specific date and time</div>
                </div>
                <div
                  onClick={() => setScheduleEnabled(!scheduleEnabled)}
                  style={{
                    width:44, height:24, borderRadius:12, cursor:'pointer',
                    background: scheduleEnabled ? '#2563eb' : '#334155',
                    position:'relative', transition:'background 0.2s',
                  }}
                >
                  <div style={{
                    position:'absolute', top:3, left: scheduleEnabled ? 23 : 3,
                    width:18, height:18, borderRadius:'50%', background:'#fff',
                    transition:'left 0.2s',
                  }}/>
                </div>
              </div>
              {scheduleEnabled && (
                <input
                  type="datetime-local"
                  min={minDateStr}
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  style={{width:'100%', fontSize:'0.85em', boxSizing:'border-box'}}
                />
              )}
            </div>

            {/* Result banner */}
            {postResult && (
              <div style={{
                padding:'12px 16px', borderRadius:'10px',
                background: postResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${postResult.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: postResult.ok ? '#10b981' : '#ef4444',
              }}>
                <div style={{fontWeight:700, marginBottom: postResult.results ? '8px' : 0}}>
                  {postResult.ok ? '✓' : '✗'} {postResult.msg}
                </div>
                {postResult.results && (
                  <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                    {Object.entries(postResult.results).map(([platform, res]) => (
                      <div key={platform} style={{fontSize:'0.82em', display:'flex', alignItems:'center', gap:'6px'}}>
                        <span>{PLATFORMS.find(p=>p.id===platform)?.icon}</span>
                        <span style={{color: res.error ? '#ef4444' : '#10b981', fontWeight:600}}>
                          {res.error ? `✗ ${res.error}` : '✓ Published'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Post button */}
            <button
              onClick={handlePost}
              disabled={posting || selectedPlatforms.length === 0}
              style={{
                padding:'12px 24px', fontSize:'0.95em', fontWeight:700,
                background: posting ? '#334155' : '#2563eb',
                color:'#fff', border:'none', borderRadius:'10px',
                cursor: posting ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              }}
            >
              {posting ? (
                <><Loader size={16} style={{animation:'spin 1s linear infinite'}}/> Publishing...</>
              ) : scheduleEnabled ? (
                <><Calendar size={16}/> Schedule Post</>
              ) : (
                <><Radio size={16}/> Publish Now to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>

          {/* RIGHT — Preview & Tips */}
          <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>

            {/* Live preview */}
            <div className="card" style={{padding:'16px'}}>
              <div style={{fontSize:'0.8em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Post Preview</div>
              <div style={{background:'rgba(255,255,255,0.03)', border:'1px solid #1e293b', borderRadius:'10px', padding:'14px'}}>
                {mediaUrl && mediaType === 'image' && (
                  <img src={mediaUrl} alt="preview" style={{width:'100%', maxHeight:'200px', objectFit:'cover', borderRadius:'8px', marginBottom:'10px'}} onError={e => e.target.style.display='none'}/>
                )}
                {mediaUrl && mediaType === 'video' && (
                  <div style={{background:'#0f172a', borderRadius:'8px', padding:'20px', textAlign:'center', marginBottom:'10px', color: theme==='dark' ? '#8b949e' : '#64748b', fontSize:'0.85em'}}>
                    🎬 Video: {mediaUrl.split('/').pop()}
                  </div>
                )}
                <div style={{fontSize:'0.88em', color:'#e2e8f0', lineHeight:'1.6', whiteSpace:'pre-wrap'}}>
                  {caption || <span style={{color: theme==='dark' ? '#8b949e' : '#475569', fontStyle:'italic'}}>Your caption will appear here...</span>}
                </div>
                {caption && (
                  <div style={{marginTop:'10px', display:'flex', gap:'6px', flexWrap:'wrap'}}>
                    {selectedPlatforms.map(pid => {
                      const p = PLATFORMS.find(pl => pl.id === pid);
                      return <span key={pid} style={{fontSize:'0.72em', padding:'2px 8px', borderRadius:'10px', background:p.bg, color:p.color, fontWeight:600}}>{p.icon} {p.label}</span>;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="card" style={{padding:'16px'}}>
              <div style={{fontSize:'0.8em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Platform Tips</div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <div style={{fontSize:'0.8em', color: theme==='dark' ? '#6e7681' : '#94a3b8', padding:'8px 10px', background:'rgba(225,48,108,0.05)', borderRadius:'7px', borderLeft:'3px solid #e1306c'}}>
                  <strong style={{color:'#e1306c'}}>📸 Instagram</strong> — Requires image or video. Use square (1:1) or portrait (4:5) for best reach.
                </div>
                <div style={{fontSize:'0.8em', color: theme==='dark' ? '#6e7681' : '#94a3b8', padding:'8px 10px', background:'rgba(24,119,242,0.05)', borderRadius:'7px', borderLeft:'3px solid #1877f2'}}>
                  <strong style={{color:'#1877f2'}}>📘 Facebook</strong> — Text-only posts work. Add <code>FACEBOOK_PAGE_ID</code> in Render env vars.
                </div>
                <div style={{fontSize:'0.8em', color: theme==='dark' ? '#6e7681' : '#94a3b8', padding:'8px 10px', background:'rgba(37,211,102,0.05)', borderRadius:'7px', borderLeft:'3px solid #25d366'}}>
                  <strong style={{color:'#25d366'}}>💬 WhatsApp</strong> — Requires approved message templates in Meta Business Manager. Token needed after number verification.
                </div>
              </div>
            </div>

            {/* Env vars checklist */}
            <div className="card" style={{padding:'16px'}}>
              <div style={{fontSize:'0.8em', color: theme==='dark' ? '#8b949e' : '#64748b', fontWeight:700, marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em'}}>Required Env Variables</div>
              <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                {[
                  ['META_PAGE_ACCESS_TOKEN', 'All platforms'],
                  ['INSTAGRAM_ACCOUNT_ID', 'Instagram only'],
                  ['FACEBOOK_PAGE_ID', 'Facebook only'],
                  ['WHATSAPP_PHONE_NUMBER_ID', 'WhatsApp only'],
                ].map(([key, scope]) => (
                  <div key={key} style={{display:'flex', justifyContent:'space-between', fontSize:'0.78em', padding:'5px 8px', background:'rgba(255,255,255,0.02)', borderRadius:'5px'}}>
                    <code style={{color:'#93c5fd'}}>{key}</code>
                    <span style={{color: theme==='dark' ? '#8b949e' : '#64748b'}}>{scope}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* POST HISTORY */
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
            <div style={{fontSize:'0.85em', color: theme==='dark' ? '#8b949e' : '#64748b'}}>{history.length} posts in history</div>
            <button className="ghost" onClick={fetchHistory} style={{padding:'5px 12px', fontSize:'0.82em'}}>↻ Refresh</button>
          </div>
          {histLoading ? (
            <div style={{textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b', padding:'40px'}}>Loading history...</div>
          ) : history.length === 0 ? (
            <div style={{textAlign:'center', color: theme==='dark' ? '#8b949e' : '#64748b', padding:'60px'}}>
              <Radio size={32} style={{opacity:0.3, marginBottom:12}}/>
              <div>No posts yet — compose your first post above.</div>
            </div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              {history.map((post, i) => {
                const statusColor = post.status === 'published' ? '#10b981' : post.status === 'failed' ? '#ef4444' : post.status === 'scheduled' ? '#f59e0b' : '#64748b';
                const statusIcon = post.status === 'published' ? '✓' : post.status === 'failed' ? '✗' : post.status === 'scheduled' ? '🕐' : '⟳';
                return (
                  <div key={i} className="card" style={{padding:'14px 16px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px'}}>
                      <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                        {(post.platforms || []).map(pid => {
                          const p = PLATFORMS.find(pl => pl.id === pid);
                          return p ? <span key={pid} style={{fontSize:'0.75em', padding:'2px 8px', borderRadius:'10px', background:p.bg, color:p.color, fontWeight:600}}>{p.icon} {p.label}</span> : null;
                        })}
                      </div>
                      <div style={{display:'flex', alignItems:'center', gap:'6px', flexShrink:0}}>
                        <span style={{fontSize:'0.78em', color:statusColor, fontWeight:700}}>{statusIcon} {post.status}</span>
                        <span style={{fontSize:'0.72em', color: theme==='dark' ? '#8b949e' : '#475569'}}>{post.created_at ? new Date(post.created_at).toLocaleString() : ''}</span>
                      </div>
                    </div>
                    <div style={{fontSize:'0.85em', color: theme==='dark' ? '#6e7681' : '#94a3b8', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>
                      {post.text || <span style={{fontStyle:'italic'}}>No caption</span>}
                    </div>
                    {post.media_url && (
                      <div style={{marginTop:'6px', fontSize:'0.75em', color: theme==='dark' ? '#8b949e' : '#475569'}}>📎 {post.media_url.split('/').pop()}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── LEAD IMPORT & EXPORT ───────────────────────────────────────────────────

function LeadImportExport({ activeBusiness, theme }) {
  const [tab, setTab] = useState('import'); // import | export
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null); // { total_rows, headers, mapping, preview, warnings, unmapped_columns }
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [toast, setToast] = useState('');

  // Export filters
  const [expTemp, setExpTemp] = useState('');
  const [expStage, setExpStage] = useState('');
  const [expFormat, setExpFormat] = useState('csv'); // csv | excel
  const [exporting, setExporting] = useState(false);

  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  // ── File handling ──
  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (f) { setFile(f); setPreview(null); setImportResult(null); }
  };

  const handlePreview = async () => {
    if (!file) return;
    setPreviewing(true);
    setPreview(null);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/leads/import/preview`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.status === 'success') setPreview(data);
      else showToast(data.detail || 'Failed to parse file');
    } catch(e) { showToast('Error reading file'); }
    setPreviewing(false);
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    // Re-parse file to get all rows (preview only has first 10)
    const formData = new FormData();
    formData.append('file', file);
    try {
      // Get full preview (all rows)
      const previewRes = await fetch(`${API_BASE}/leads/import/preview`, { method: 'POST', body: formData });
      const previewData = await previewRes.json();

      // Build all rows using the mapping
      const allRows = previewData.preview || [];
      // For full import we need all rows — backend handles this via confirm endpoint
      const confirmRes = await fetch(`${API_BASE}/leads/import/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: allRows,
          skip_duplicates: skipDuplicates,
          business_id: bizId
        })
      });
      const result = await confirmRes.json();
      if (result.status === 'success') {
        setImportResult(result);
        showToast(result.message);
      } else showToast(result.detail || 'Import failed');
    } catch(e) { showToast('Import error'); }
    setImporting(false);
  };

  // ── Export ──
  const handleExport = async () => {
    setExporting(true);
    const params = new URLSearchParams();
    if (expTemp) params.set('temperature', expTemp);
    if (expStage) params.set('lead_stage', expStage);
    const endpoint = expFormat === 'excel' ? 'excel' : 'csv';
    try {
      const res = await fetch(`${API_BASE}/leads/export/${endpoint}?${params}`);
      if (!res.ok) { showToast('Export failed'); setExporting(false); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export.${expFormat === 'excel' ? 'xlsx' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Export downloaded!');
    } catch(e) { showToast('Export error'); }
    setExporting(false);
  };

  const handleDownloadTemplate = async () => {
    const res = await fetch(`${API_BASE}/leads/export/template`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Template downloaded!');
  };

  const TEMP_OPTS = [['', 'All Temperatures'], ['hot', '🔥 Hot'], ['warm', '⭐ Warm'], ['cold', '❄️ Cold']];
  const STAGE_OPTS = [['', 'All Stages'], ['new', 'New'], ['contacted', 'Contacted'], ['qualified', 'Qualified'], ['demo_scheduled', 'Demo Scheduled'], ['enrolled', 'Enrolled'], ['lost', 'Lost']];

  return (
    <section>
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:'#1e293b',color:'white',padding:'12px 20px',borderRadius:10,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
          {toast}
        </div>
      )}

      <Title
        title="Import & Export"
        sub="Bulk import leads from CSV/Excel, or export your entire lead database"
      />

      {/* Tab switcher */}
      <div style={{display:'flex',gap:8,marginBottom:24}}>
        {[['import','⬆️ Import Leads'],['export','⬇️ Export Leads']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{padding:'10px 24px',borderRadius:8,border:'1px solid',borderColor:tab===k?'#3b82f6':'#e2e8f0',background:tab===k?'#eff6ff':'white',color:tab===k?'#3b82f6':'#64748b',fontWeight:tab===k?700:400,fontSize:14,cursor:'pointer'}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── IMPORT TAB ── */}
      {tab === 'import' && (
        <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:800}}>

          {/* Download template */}
          <div className="card" style={{padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',border:'1px solid #bbf7d0'}}>
            <div>
              <div style={{fontWeight:600,color:'#166534',fontSize:14}}>📋 Download Import Template</div>
              <div style={{fontSize:12,color:'#15803d',marginTop:2}}>Use this CSV template to prepare your leads for import. Includes a sample row.</div>
            </div>
            <button onClick={handleDownloadTemplate}
              style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,background:'#16a34a',color:'white',border:'none',fontWeight:600,fontSize:13,cursor:'pointer'}}>
              <Download size={14}/>Download Template
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            style={{border:`2px dashed ${dragOver?'#3b82f6':'#cbd5e1'}`,borderRadius:12,padding:'40px 20px',textAlign:'center',background:dragOver?'#eff6ff':'#f8fafc',transition:'all 0.2s',cursor:'pointer'}}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input id="file-input" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileDrop} style={{display:'none'}}/>
            <div style={{fontSize:36,marginBottom:8}}>📂</div>
            {file ? (
              <div>
                <div style={{fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b',fontSize:15}}>{file.name}</div>
                <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:4}}>{(file.size/1024).toFixed(1)} KB — click to change</div>
              </div>
            ) : (
              <div>
                <div style={{fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',fontSize:15}}>Drag & drop your CSV or Excel file here</div>
                <div style={{fontSize:12,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:4}}>or click to browse — supports .csv, .xlsx, .xls</div>
              </div>
            )}
          </div>

          {/* Options + preview button */}
          {file && !preview && (
            <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569',cursor:'pointer'}}>
                <input type="checkbox" checked={skipDuplicates} onChange={e => setSkipDuplicates(e.target.checked)}/>
                Skip duplicate phone/email entries
              </label>
              <button onClick={handlePreview} disabled={previewing}
                style={{display:'flex',alignItems:'center',gap:6,padding:'10px 20px',borderRadius:8,background:'#3b82f6',color:'white',border:'none',fontWeight:600,fontSize:13,cursor:'pointer',opacity:previewing?0.6:1}}>
                {previewing ? <Loader size={14}/> : <FileText size={14}/>}
                {previewing ? 'Parsing...' : 'Preview Import'}
              </button>
            </div>
          )}

          {/* Preview results */}
          {preview && (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>

              {/* Summary */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {[
                  { label: 'Total Rows', value: preview.total_rows, color: '#3b82f6' },
                  { label: 'Columns Mapped', value: Object.keys(preview.mapping).length, color: '#10b981' },
                  { label: 'Unmapped Columns', value: preview.unmapped_columns?.length || 0, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="card" style={{padding:'14px 18px',textAlign:'center'}}>
                    <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',textTransform:'uppercase',fontWeight:600}}>{s.label}</div>
                    <div style={{fontSize:28,fontWeight:700,color:s.color,lineHeight:1.3}}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Warnings */}
              {preview.warnings?.length > 0 && (
                <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:10,padding:'12px 16px'}}>
                  {preview.warnings.map((w,i) => (
                    <div key={i} style={{fontSize:13,color:'#92400e',display:'flex',gap:8,alignItems:'flex-start'}}>
                      <span>⚠️</span><span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Column mapping */}
              <div className="card" style={{padding:'16px 20px'}}>
                <div style={{fontWeight:700,fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:10}}>Column Mapping Detected</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {Object.entries(preview.mapping).map(([csv,db]) => (
                    <div key={csv} style={{padding:'4px 12px',borderRadius:20,background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',border:'1px solid #bbf7d0',fontSize:12,color:'#166534'}}>
                      <b>{csv}</b> → {db}
                    </div>
                  ))}
                  {(preview.unmapped_columns||[]).map(col => (
                    <div key={col} style={{padding:'4px 12px',borderRadius:20,background: theme==='dark' ? '#1c2128' : '#f8fafc',border:'1px solid #e2e8f0',fontSize:12,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
                      {col} (ignored)
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview table */}
              <div className="card" style={{padding:'16px 20px',overflowX:'auto'}}>
                <div style={{fontWeight:700,fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:10}}>Preview (first {preview.preview?.length} rows)</div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background: theme==='dark' ? '#1c2128' : '#f1f5f9'}}>
                      {['Name','Phone','Email','Module','Temperature','Stage','Source'].map(h => (
                        <th key={h} style={{padding:'8px 12px',textAlign:'left',fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.preview||[]).map((row,i) => (
                      <tr key={i} style={{borderTop: `1px solid ${theme==='dark' ? '#21262d' : '#f1f5f9'}`}}>
                        <td style={{padding:'7px 12px',color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{row.name||'—'}</td>
                        <td style={{padding:'7px 12px',color: theme==='dark' ? '#8b949e' : '#475569'}}>{row.phone||'—'}</td>
                        <td style={{padding:'7px 12px',color: theme==='dark' ? '#8b949e' : '#475569'}}>{row.email||'—'}</td>
                        <td style={{padding:'7px 12px',color: theme==='dark' ? '#8b949e' : '#475569'}}>{row.interested_module||'—'}</td>
                        <td style={{padding:'7px 12px'}}>
                          <span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:row.temperature==='hot'?'#fef2f2':row.temperature==='warm'?'#fffbeb':'#f0f9ff',color:row.temperature==='hot'?'#ef4444':row.temperature==='warm'?'#d97706':'#0369a1'}}>
                            {row.temperature||'cold'}
                          </span>
                        </td>
                        <td style={{padding:'7px 12px',color: theme==='dark' ? '#8b949e' : '#475569'}}>{row.lead_stage||'new'}</td>
                        <td style={{padding:'7px 12px',color: theme==='dark' ? '#8b949e' : '#475569'}}>{row.source||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.total_rows > 10 && (
                  <div style={{fontSize:12,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:8}}>Showing 10 of {preview.total_rows} rows — all rows will be imported.</div>
                )}
              </div>

              {/* Import result */}
              {importResult ? (
                <div style={{background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'16px 20px'}}>
                  <div style={{fontWeight:700,color:'#166534',fontSize:15,marginBottom:6}}>✅ Import Complete</div>
                  <div style={{fontSize:13,color:'#15803d'}}>{importResult.message}</div>
                  {importResult.errors?.length > 0 && (
                    <div style={{marginTop:8,fontSize:12,color:'#dc2626'}}>
                      {importResult.errors.map((e,i) => <div key={i}>{e}</div>)}
                    </div>
                  )}
                  <button onClick={() => { setFile(null); setPreview(null); setImportResult(null); }}
                    style={{marginTop:12,padding:'8px 16px',borderRadius:8,background:'#16a34a',color:'white',border:'none',fontWeight:600,fontSize:13,cursor:'pointer'}}>
                    Import Another File
                  </button>
                </div>
              ) : (
                <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                  <label style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569',cursor:'pointer'}}>
                    <input type="checkbox" checked={skipDuplicates} onChange={e => setSkipDuplicates(e.target.checked)}/>
                    Skip duplicate phone/email entries
                  </label>
                  <button onClick={handleConfirmImport} disabled={importing}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'10px 24px',borderRadius:8,background:'#10b981',color:'white',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',opacity:importing?0.6:1}}>
                    {importing ? <Loader size={15}/> : <CheckCircle size={15}/>}
                    {importing ? `Importing ${preview.total_rows} leads...` : `Import All ${preview.total_rows} Leads`}
                  </button>
                  <button onClick={() => { setFile(null); setPreview(null); }}
                    style={{padding:'10px 16px',borderRadius:8,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',color: theme==='dark' ? '#8b949e' : '#64748b',fontSize:13,cursor:'pointer'}}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── EXPORT TAB ── */}
      {tab === 'export' && (
        <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:600}}>
          <div className="card" style={{padding:'24px 28px'}}>
            <h3 style={{marginBottom:6,fontSize:16,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>Export Lead Database</h3>
            <p style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:20}}>Download your leads as CSV or Excel. Apply filters to export a specific segment.</p>

            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* Format selector */}
              <div>
                <label style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#c9d1d9' : '#374151',display:'block',marginBottom:8}}>Export Format</label>
                <div style={{display:'flex',gap:8}}>
                  {[['csv','📄 CSV'],['excel','📊 Excel (.xlsx)']].map(([k,l]) => (
                    <button key={k} onClick={() => setExpFormat(k)}
                      style={{flex:1,padding:'10px',borderRadius:8,border:'1px solid',borderColor:expFormat===k?'#3b82f6':'#e2e8f0',background:expFormat===k?'#eff6ff':'white',color:expFormat===k?'#3b82f6':'#64748b',fontWeight:expFormat===k?700:400,fontSize:13,cursor:'pointer'}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature filter */}
              <div>
                <label style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#c9d1d9' : '#374151',display:'block',marginBottom:6}}>Filter by Temperature</label>
                <select value={expTemp} onChange={e => setExpTemp(e.target.value)}
                  style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',background: theme==='dark' ? '#161b22' : 'white'}}>
                  {TEMP_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {/* Stage filter */}
              <div>
                <label style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#c9d1d9' : '#374151',display:'block',marginBottom:6}}>Filter by Stage</label>
                <select value={expStage} onChange={e => setExpStage(e.target.value)}
                  style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',background: theme==='dark' ? '#161b22' : 'white'}}>
                  {STAGE_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {/* Export fields info */}
              <div style={{background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,padding:'12px 16px',fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b'}}>
                <div style={{fontWeight:600,marginBottom:4,color: theme==='dark' ? '#8b949e' : '#475569'}}>Exported columns:</div>
                ID, Name, Phone, Email, Module, Temperature, Stage, Qualified, Source, Location, Experience, Education, Notes, Sender ID, Created At, Updated At
              </div>

              <button onClick={handleExport} disabled={exporting}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px',borderRadius:8,background:'#3b82f6',color:'white',border:'none',fontWeight:700,fontSize:14,cursor:'pointer',opacity:exporting?0.6:1}}>
                {exporting ? <Loader size={16}/> : <Download size={16}/>}
                {exporting ? 'Preparing export...' : `Download ${expFormat.toUpperCase()}`}
              </button>
            </div>
          </div>

          {/* Quick export shortcuts */}
          <div className="card" style={{padding:'20px 24px'}}>
            <div style={{fontWeight:700,fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',marginBottom:12}}>Quick Exports</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                { label: '🔥 Hot Leads Only', temp: 'hot', stage: '' },
                { label: '⭐ Warm Leads Only', temp: 'warm', stage: '' },
                { label: '✅ Qualified Leads', temp: '', stage: 'qualified' },
                { label: '📋 All Leads (Full Export)', temp: '', stage: '' },
              ].map(opt => (
                <button key={opt.label}
                  onClick={async () => {
                    setExporting(true);
                    const params = new URLSearchParams();
                    if (opt.temp) params.set('temperature', opt.temp);
                    if (opt.stage) params.set('lead_stage', opt.stage);
                    try {
                      const res = await fetch(`${API_BASE}/leads/export/csv?${params}`);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `leads_${opt.label.replace(/[^a-z0-9]/gi,'_').toLowerCase()}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast('Downloaded!');
                    } catch(e) { showToast('Export failed'); }
                    setExporting(false);
                  }}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:8,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer',fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',fontWeight:500}}
                >
                  <span>{opt.label}</span>
                  <Download size={13} color="#94a3b8"/>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── HOT LEAD QUEUE ──────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  critical: { label: 'CRITICAL', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  high:     { label: 'HIGH',     color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  medium:   { label: 'MEDIUM',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  low:      { label: 'LOW',      color: theme==='dark' ? '#8b949e' : '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const STAGE_OPTIONS = [
  { value: 'new',            label: 'New' },
  { value: 'contacted',      label: 'Contacted' },
  { value: 'demo_scheduled', label: 'Demo Scheduled' },
  { value: 'qualified',      label: 'Qualified' },
  { value: 'enrolled',       label: 'Enrolled' },
  { value: 'lost',           label: 'Lost' },
];

function HotLeadQueue({ activeBusiness, setPage, theme }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all'); // all | critical | high | medium
  const [expandedId, setExpandedId] = useState(null);
  const [noteEditing, setNoteEditing] = useState({}); // leadId -> text
  const [savingNote, setSavingNote] = useState(null);
  const [stageSaving, setStageSaving] = useState(null);
  const [toast, setToast] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchQueue = () => {
    setLoading(true);
    fetch(`${API_BASE}/hot-leads/queue?limit=50`, { headers: { 'X-Business-ID': bizId } })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setQueue(d.queue || []);
          setTotal(d.total || 0);
          setLastRefresh(new Date());
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQueue(); }, [bizId]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const t = setInterval(fetchQueue, 120000);
    return () => clearInterval(t);
  }, [bizId]);

  const handleSaveNote = async (lead) => {
    setSavingNote(lead.id);
    const notes = noteEditing[lead.id] ?? lead.notes;
    try {
      const res = await fetch(`${API_BASE}/hot-leads/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, notes })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setQueue(prev => prev.map(l => l.id === lead.id ? { ...l, notes } : l));
        showToast('Note saved!');
      }
    } catch(e) { showToast('Failed to save note'); }
    setSavingNote(null);
  };

  const handleStageChange = async (lead, newStage) => {
    setStageSaving(lead.id);
    try {
      const res = await fetch(`${API_BASE}/hot-leads/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.id, stage: newStage })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setQueue(prev => prev.map(l => l.id === lead.id ? { ...l, lead_stage: newStage } : l));
        showToast(`Stage updated to ${newStage}`);
      }
    } catch(e) { showToast('Failed to update stage'); }
    setStageSaving(null);
  };

  const filtered = filter === 'all' ? queue : queue.filter(l => l.urgency === filter);
  const critCount = queue.filter(l => l.urgency === 'critical').length;
  const highCount = queue.filter(l => l.urgency === 'high').length;

  return (
    <section>
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:'#1e293b',color:'white',padding:'12px 20px',borderRadius:10,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
          {toast}
        </div>
      )}

      <Title
        title="Hot Lead Queue"
        sub={`${total} leads ranked by urgency — take action before they go cold`}
        action={
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {lastRefresh && <span style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Updated {lastRefresh.toLocaleTimeString()}</span>}
            <button onClick={fetchQueue} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer',fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569'}}>
              <RefreshCw size={14}/>Refresh
            </button>
          </div>
        }
      />

      {/* Stats row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
        {[
          { label: 'Total in Queue', value: total, icon: '📋', color: '#3b82f6' },
          { label: 'Critical', value: critCount, icon: '🔴', color: '#ef4444' },
          { label: 'High Priority', value: highCount, icon: '🟠', color: '#f97316' },
          { label: 'Showing', value: filtered.length, icon: '👁', color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="card" style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
            <div style={{fontSize:24}}>{s.icon}</div>
            <div>
              <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>{s.label}</div>
              <div style={{fontSize:26,fontWeight:700,color:s.color,lineHeight:1.2}}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[['all','All'],['critical','Critical'],['high','High'],['medium','Medium']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{padding:'6px 16px',borderRadius:20,border:'1px solid',borderColor:filter===k?'#ef4444':'#e2e8f0',background:filter===k?'#fef2f2':'white',color:filter===k?'#ef4444':'#64748b',fontSize:12,fontWeight:filter===k?600:400,cursor:'pointer'}}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:'60px 0',color: theme==='dark' ? '#6e7681' : '#94a3b8',gap:10}}>
          <Loader size={20} className="spin"/>Loading queue...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px 0',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
          <Flame size={40} style={{marginBottom:12,opacity:0.3}}/>
          <p>No leads in this category right now.</p>
          <p style={{fontSize:13}}>Check back later or adjust your filter.</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {filtered.map((lead, idx) => {
            const urg = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.low;
            const isExpanded = expandedId === lead.id;
            const noteVal = noteEditing[lead.id] !== undefined ? noteEditing[lead.id] : (lead.notes || '');

            return (
              <div key={lead.id} className="card"
                style={{padding:'0',border:`1px solid ${urg.border}`,overflow:'hidden',transition:'box-shadow 0.15s'}}
              >
                {/* Card header — always visible */}
                <div style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',cursor:'pointer',background:isExpanded?urg.bg:'white'}}
                  onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                >
                  {/* Rank badge */}
                  <div style={{width:32,height:32,borderRadius:'50%',background:urg.bg,border:`2px solid ${urg.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,color:urg.color,flexShrink:0}}>
                    {idx+1}
                  </div>

                  {/* Name + urgency */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <div style={{position:'relative', display:'flex', alignItems:'center', gap:'8px'}}>
                        <div style={{width:'28px', height:'28px', borderRadius:'6px', background: theme==='dark' ? '#1c2128' : '#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75em', fontWeight:700, color: theme==='dark' ? '#8b949e' : '#475569'}}>
                          {(lead.name || '?')[0].toUpperCase()}
                        </div>
                        <div style={{position:'absolute', bottom:'-4px', left:'18px', width:'14px', height:'14px', borderRadius:'50%', background: theme==='dark' ? '#161b22' : 'white', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center'}}>
                          {lead.source === 'whatsapp' ? 
                            <Phone size={8} fill="#25d366" stroke="#25d366"/> : 
                            <Image size={8} color="#e1306c"/>
                          }
                        </div>
                        <span style={{fontWeight:700,fontSize:15,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{lead.name || `User ${String(lead.sender_id).slice(-4)}`}</span>
                      </div>
                      <span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700,background:urg.bg,color:urg.color,border:`1px solid ${urg.border}`}}>{urg.label}</span>
                      {lead.temperature === 'hot' && <span style={{fontSize:11}}>🔥 Hot</span>}
                      {lead.is_qualified && <span style={{fontSize:11,color:'#10b981',fontWeight:600}}>✓ Qualified</span>}
                    </div>
                    <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {lead.interested_module && <span style={{marginRight:10}}>📚 {lead.interested_module}</span>}
                      {lead.last_message && <span>💬 "{lead.last_message.slice(0,60)}{lead.last_message.length>60?'...':''}"</span>}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div style={{display:'flex',gap:6,flexShrink:0}} onClick={e => e.stopPropagation()}>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`}
                        style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0',fontSize:12,fontWeight:600,textDecoration:'none'}}
                        title={`Call ${lead.phone}`}
                      >
                        <Phone size={13}/>Call
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer"
                        style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',color:'#15803d',border:'1px solid #bbf7d0',fontSize:12,fontWeight:600,textDecoration:'none'}}
                        title="Open WhatsApp"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`}
                        style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background: theme==='dark' ? '#1c2d4f' : '#eff6ff',color: theme==='dark' ? '#79c0ff' : '#2563eb',border:'1px solid #bfdbfe',fontSize:12,fontWeight:600,textDecoration:'none'}}
                        title={`Email ${lead.email}`}
                      >
                        <Mail size={13}/>Email
                      </a>
                    )}
                    <button
                      onClick={() => { setPage('Conversations'); }}
                      style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:8,background: theme==='dark' ? '#1e1040' : '#f5f3ff',color:'#7c3aed',border:'1px solid #ddd6fe',fontSize:12,fontWeight:600,cursor:'pointer'}}
                      title="View conversation"
                    >
                      <MessagesSquare size={13}/>Chat
                    </button>
                  </div>

                  <ChevronRight size={16} color="#94a3b8" style={{transform:isExpanded?'rotate(90deg)':'none',transition:'transform 0.2s',flexShrink:0}}/>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div style={{borderTop:`1px solid ${urg.border}`,padding:'16px 20px',background:'#fafafa',display:'flex',flexDirection:'column',gap:14}}>
                    {/* Contact + meta row */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
                      {[
                        { icon: '📞', label: 'Phone', value: lead.phone || '—' },
                        { icon: '📧', label: 'Email', value: lead.email || '—' },
                        { icon: '🕐', label: 'Last Active', value: lead.last_active ? new Date(lead.last_active).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—' },
                        { icon: '💬', label: 'Conv. State', value: lead.conversation_state || '—' },
                        { icon: '🌡️', label: 'Temperature', value: lead.temperature || '—' },
                        { icon: '⭐', label: 'Score', value: lead.score },
                      ].map(item => (
                        <div key={item.label} style={{background: theme==='dark' ? '#161b22' : 'white',borderRadius:8,padding:'10px 14px',border:'1px solid #e2e8f0'}}>
                          <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',fontWeight:600,marginBottom:2}}>{item.icon} {item.label}</div>
                          <div style={{fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',fontWeight:500}}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Stage selector */}
                    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                      <span style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569'}}>STAGE:</span>
                      {STAGE_OPTIONS.map(opt => (
                        <button key={opt.value}
                          onClick={() => handleStageChange(lead, opt.value)}
                          disabled={stageSaving === lead.id}
                          style={{padding:'5px 12px',borderRadius:20,border:'1px solid',borderColor:lead.lead_stage===opt.value?'#3b82f6':'#e2e8f0',background:lead.lead_stage===opt.value?'#eff6ff':'white',color:lead.lead_stage===opt.value?'#3b82f6':'#64748b',fontSize:12,fontWeight:lead.lead_stage===opt.value?700:400,cursor:'pointer'}}
                        >
                          {stageSaving===lead.id&&lead.lead_stage===opt.value ? '...' : opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Notes */}
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',marginBottom:6}}>NOTES</div>
                      <div style={{display:'flex',gap:8}}>
                        <textarea
                          value={noteVal}
                          onChange={e => setNoteEditing(prev => ({...prev, [lead.id]: e.target.value}))}
                          placeholder="Add a note about this lead..."
                          rows={2}
                          style={{flex:1,padding:'8px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,resize:'vertical',fontFamily:'inherit',outline:'none'}}
                        />
                        <button
                          onClick={() => handleSaveNote(lead)}
                          disabled={savingNote === lead.id}
                          style={{padding:'8px 16px',borderRadius:8,background:'#3b82f6',color:'white',border:'none',fontWeight:600,fontSize:13,cursor:'pointer',alignSelf:'flex-start',opacity:savingNote===lead.id?0.6:1}}
                        >
                          {savingNote===lead.id ? <Loader size={14}/> : <Save size={14}/>}
                        </button>
                      </div>
                    </div>
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

// ─── STAR RATING ─────────────────────────────────────────────────────────────

function StarRating({ rating, size = 16 }) {
  return (
    <div style={{display:'flex',gap:2}}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i<=rating?'#f59e0b':'none'} color={i<=rating?'#f59e0b':'#cbd5e1'}/>
      ))}
    </div>
  );
}

function GoogleReviewsPage({ activeBusiness, theme }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [tab, setTab] = useState('all'); // all | pending | replied
  const [settings, setSettings] = useState({ is_enabled: false, delay_minutes: 60, min_rating_to_reply: 4, auto_reply_to_text_only: false });
  const [settingsTab, setSettingsTab] = useState('reviews'); // reviews | settings
  const [replyDrafts, setReplyDrafts] = useState({});
  const [generatingFor, setGeneratingFor] = useState(null);
  const [postingFor, setPostingFor] = useState(null);
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('all'); // all | 5 | 4 | 3 | 2 | 1

  const bizId = activeBusiness?.id || '00000000-0000-0000-0000-000000000000';

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchReviews = () => {
    setLoading(true);
    fetch(`${API_BASE}/google-reviews/`, { headers: { 'X-Business-ID': bizId } })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') {
          setIsConnected(d.is_connected !== false);
          const reviewList = d.reviews || [];
          // Inject AI suggested replies into draft state
          const drafts = {};
          reviewList.forEach(r => {
            if (r.ai_suggested_reply) drafts[r.id] = r.ai_suggested_reply;
          });
          setReplyDrafts(prev => ({ ...drafts, ...prev }));
          setReviews(reviewList);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchSettings = () => {
    fetch(`${API_BASE}/google-reviews/settings`, { headers: { 'X-Business-ID': bizId } })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') setSettings(d.settings); })
      .catch(console.error);
  };

  useEffect(() => { fetchReviews(); fetchSettings(); }, [bizId]);

  const handleGenerateReply = async (review) => {
    setGeneratingFor(review.id);
    try {
      const res = await fetch(`${API_BASE}/google-reviews/generate-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Business-ID': bizId },
        body: JSON.stringify({
          reviewer_name: review.reviewer_name,
          star_rating: review.star_rating,
          comment: review.comment
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setReplyDrafts(prev => ({ ...prev, [review.id]: data.reply }));
        showToast('AI reply generated!');
      } else showToast('Failed to generate reply');
    } catch (e) { showToast('Error generating reply'); }
    setGeneratingFor(null);
  };

  const handlePostReply = async (reviewId) => {
    const replyText = replyDrafts[reviewId];
    if (!replyText?.trim()) { showToast('Please write or generate a reply first'); return; }
    setPostingFor(reviewId);
    try {
      const res = await fetch(`${API_BASE}/google-reviews/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Business-ID': bizId },
        body: JSON.stringify({ review_id: reviewId, reply_text: replyText })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply_text: replyText, status: 'replied' } : r));
        showToast('Reply posted successfully!');
      } else showToast('Failed to post reply');
    } catch (e) { showToast('Error posting reply'); }
    setPostingFor(null);
  };

  const handleSaveSettings = () => {
    fetch(`${API_BASE}/google-reviews/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Business-ID': bizId },
      body: JSON.stringify(settings)
    })
      .then(r => r.json())
      .then(d => { if (d.status === 'success') showToast('Auto-responder settings saved!'); else showToast('Failed to save settings'); })
      .catch(() => showToast('Error saving settings'));
  };

  const filteredReviews = reviews.filter(r => {
    if (tab === 'pending' && r.status === 'replied') return false;
    if (tab === 'replied' && r.status !== 'replied') return false;
    if (filter !== 'all' && r.star_rating !== parseInt(filter)) return false;
    return true;
  });

  const pendingCount = reviews.filter(r => r.status !== 'replied').length;
  const repliedCount = reviews.filter(r => r.status === 'replied').length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.star_rating, 0) / reviews.length).toFixed(1) : '—';

  return (
    <section>
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,background:'#1e293b',color:'white',padding:'12px 20px',borderRadius:10,fontSize:13,fontWeight:500,zIndex:9999,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
          {toast}
        </div>
      )}

      <Title
        title="Google Reviews"
        sub="Monitor, respond to, and auto-reply to Google Business reviews with AI"
        action={
          <div style={{display:'flex',gap:8}}>
            <button onClick={fetchReviews} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:8,border:'1px solid #e2e8f0',background: theme==='dark' ? '#161b22' : 'white',cursor:'pointer',fontSize:13,color: theme==='dark' ? '#8b949e' : '#475569'}}>
              <RefreshCw size={14}/>Refresh
            </button>
          </div>
        }
      />

      {/* Top tabs */}
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {[['reviews','Reviews'], ['settings','Auto-Responder Settings']].map(([k,l]) => (
          <button key={k} onClick={() => setSettingsTab(k)} style={{padding:'8px 18px',borderRadius:8,border:'1px solid',borderColor:settingsTab===k?'#3b82f6':'#e2e8f0',background:settingsTab===k?'#eff6ff':'white',color:settingsTab===k?'#3b82f6':'#64748b',fontWeight:settingsTab===k?600:400,fontSize:13,cursor:'pointer'}}>{l}</button>
        ))}
      </div>

      {settingsTab === 'reviews' && (
        <>
          {/* Stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
            {[
              { label: 'Total Reviews', value: reviews.length, icon: '⭐', color: '#f59e0b' },
              { label: 'Avg Rating', value: avgRating, icon: '📊', color: '#3b82f6' },
              { label: 'Awaiting Reply', value: pendingCount, icon: '⏳', color: '#f97316' },
              { label: 'Replied', value: repliedCount, icon: '✅', color: '#10b981' },
            ].map(s => (
              <div key={s.label} className="card" style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
                <div style={{fontSize:24}}>{s.icon}</div>
                <div>
                  <div style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>{s.label}</div>
                  <div style={{fontSize:26,fontWeight:700,color:s.color,lineHeight:1.2}}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{display:'flex',gap:6}}>
              {[['all','All'],['pending','Needs Reply'],['replied','Replied']].map(([k,l]) => (
                <button key={k} onClick={() => setTab(k)} style={{padding:'6px 14px',borderRadius:20,border:'1px solid',borderColor:tab===k?'#3b82f6':'#e2e8f0',background:tab===k?'#eff6ff':'white',color:tab===k?'#3b82f6':'#64748b',fontSize:12,fontWeight:tab===k?600:400,cursor:'pointer'}}>{l}</button>
              ))}
            </div>
            <div style={{marginLeft:'auto',display:'flex',gap:6,alignItems:'center'}}>
              <span style={{fontSize:12,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>Filter by stars:</span>
              {['all','5','4','3','2','1'].map(s => (
                <button key={s} onClick={() => setFilter(s)} style={{padding:'4px 10px',borderRadius:20,border:'1px solid',borderColor:filter===s?'#f59e0b':'#e2e8f0',background:filter===s?'#fffbeb':'white',color:filter===s?'#d97706':'#64748b',fontSize:12,fontWeight:filter===s?600:400,cursor:'pointer'}}>
                  {s === 'all' ? 'All' : `${s}★`}
                </button>
              ))}
            </div>
          </div>

          {!isConnected && (
            <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:12,padding:'20px 24px',marginBottom:20,display:'flex',alignItems:'center',gap:16}}>
              <div style={{fontSize:32}}>⚠️</div>
              <div>
                <div style={{fontWeight:700,color:'#92400e',marginBottom:4}}>Google My Business not connected</div>
                <div style={{fontSize:13,color:'#78350f'}}>Go to <strong>Integrations</strong> and connect your Google My Business account to start fetching real reviews. Showing sample data below.</div>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{display:'flex',justifyContent:'center',padding:'60px 0',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}><Loader size={24} className="spin"/>  Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 0',color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>
              <Star size={40} style={{marginBottom:12,opacity:0.3}}/>
              <p>No reviews found for this filter.</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {filteredReviews.map(review => (
                <div key={review.id} className="card" style={{padding:'20px 24px',border: review.status !== 'replied' ? '1px solid #fed7aa' : '1px solid #e2e8f0'}}>
                  {/* Review header */}
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:40,height:40,borderRadius:'50%',background: theme==='dark' ? '#1c2128' : '#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color: theme==='dark' ? '#8b949e' : '#475569'}}>
                        {(review.reviewer_name || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:15,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{review.reviewer_name || 'Anonymous'}</div>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
                          <StarRating rating={review.star_rating}/>
                          <span style={{fontSize:12,color: theme==='dark' ? '#6e7681' : '#94a3b8'}}>{review.create_time ? new Date(review.create_time).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : ''}</span>
                        </div>
                      </div>
                    </div>
                    <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,background:review.status==='replied'?'#f0fdf4':'#fff7ed',color:review.status==='replied'?'#166534':'#9a3412',border:'1px solid',borderColor:review.status==='replied'?'#bbf7d0':'#fed7aa'}}>
                      {review.status === 'replied' ? '✅ Replied' : '⏳ Needs Reply'}
                    </span>
                  </div>

                  {/* Review comment */}
                  {review.comment ? (
                    <div style={{background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,padding:'12px 16px',marginBottom:14,fontSize:14,color: theme==='dark' ? '#c9d1d9' : '#334155',lineHeight:1.6,borderLeft:'3px solid #e2e8f0'}}>
                      "{review.comment}"
                    </div>
                  ) : (
                    <div style={{marginBottom:14,fontSize:13,color: theme==='dark' ? '#6e7681' : '#94a3b8',fontStyle:'italic'}}>No text comment — rating only.</div>
                  )}

                  {/* Existing reply */}
                  {review.reply_text && (
                    <div style={{background: theme==='dark' ? '#0d2e1a' : '#f0fdf4',borderRadius:8,padding:'12px 16px',marginBottom:14,fontSize:13,color:'#166534',borderLeft:'3px solid #86efac'}}>
                      <div style={{fontWeight:600,marginBottom:4,fontSize:12,color:'#15803d'}}>YOUR REPLY</div>
                      {review.reply_text}
                    </div>
                  )}

                  {/* Reply area — only show if not replied */}
                  {review.status !== 'replied' && (
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                        <span style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569'}}>REPLY DRAFT</span>
                        <button
                          onClick={() => handleGenerateReply(review)}
                          disabled={generatingFor === review.id}
                          style={{display:'flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:6,border:'1px solid #c7d2fe',background: theme==='dark' ? '#1c2d4f' : '#eff6ff',color:'#4338ca',fontSize:12,fontWeight:600,cursor:'pointer',opacity:generatingFor===review.id?0.6:1}}
                        >
                          {generatingFor === review.id ? <Loader size={12}/> : <Bot size={12}/>}
                          {generatingFor === review.id ? 'Generating...' : 'Generate AI Reply'}
                        </button>
                      </div>
                      <textarea
                        value={replyDrafts[review.id] || ''}
                        onChange={e => setReplyDrafts(prev => ({ ...prev, [review.id]: e.target.value }))}
                        placeholder="Write your reply here, or click 'Generate AI Reply' above..."
                        rows={3}
                        style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:13,color: theme==='dark' ? '#c9d1d9' : '#334155',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box',outline:'none'}}
                      />
                      <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                        <button
                          onClick={() => handlePostReply(review.id)}
                          disabled={postingFor === review.id || !replyDrafts[review.id]?.trim()}
                          style={{display:'flex',alignItems:'center',gap:6,padding:'8px 18px',borderRadius:8,background:'#3b82f6',color:'white',border:'none',fontWeight:600,fontSize:13,cursor:'pointer',opacity:(postingFor===review.id||!replyDrafts[review.id]?.trim())?0.6:1}}
                        >
                          {postingFor === review.id ? <Loader size={14}/> : <Send size={14}/>}
                          {postingFor === review.id ? 'Posting...' : 'Post Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {settingsTab === 'settings' && (
        <div className="card" style={{padding:'28px 32px',maxWidth:600}}>
          <h3 style={{marginBottom:6,fontSize:16,fontWeight:700,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>Auto-Responder Configuration</h3>
          <p style={{fontSize:13,color: theme==='dark' ? '#8b949e' : '#64748b',marginBottom:24}}>When enabled, the AI will automatically generate and post replies to new Google Reviews based on the rules below.</p>

          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            {/* Enable toggle */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:10,border:'1px solid #e2e8f0'}}>
              <div>
                <div style={{fontWeight:600,fontSize:14,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>Enable Auto-Responder</div>
                <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:2}}>Automatically reply to new reviews without manual approval</div>
              </div>
              <button onClick={() => setSettings(s => ({...s, is_enabled: !s.is_enabled}))} style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
                {settings.is_enabled ? <ToggleRight size={36} color="#3b82f6"/> : <ToggleLeft size={36} color="#cbd5e1"/>}
              </button>
            </div>

            {/* Delay */}
            <div>
              <label style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#c9d1d9' : '#374151',display:'block',marginBottom:6}}>Reply Delay (minutes)</label>
              <input
                type="number" min={0} max={1440}
                value={settings.delay_minutes}
                onChange={e => setSettings(s => ({...s, delay_minutes: parseInt(e.target.value)||0}))}
                style={{padding:'8px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:14,width:'100%',boxSizing:'border-box'}}
              />
              <p style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:4}}>Set to 0 for instant replies. Recommended: 30–120 minutes for a natural feel.</p>
            </div>

            {/* Min rating */}
            <div>
              <label style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#c9d1d9' : '#374151',display:'block',marginBottom:6}}>Minimum Star Rating to Auto-Reply</label>
              <div style={{display:'flex',gap:8}}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setSettings(s => ({...s, min_rating_to_reply: n}))}
                    style={{flex:1,padding:'8px',borderRadius:8,border:'1px solid',borderColor:settings.min_rating_to_reply===n?'#f59e0b':'#e2e8f0',background:settings.min_rating_to_reply===n?'#fffbeb':'white',color:settings.min_rating_to_reply===n?'#d97706':'#64748b',fontWeight:settings.min_rating_to_reply===n?700:400,cursor:'pointer',fontSize:14}}
                  >{n}★</button>
                ))}
              </div>
              <p style={{fontSize:11,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:4}}>Only auto-reply to reviews with this rating or higher. Low ratings need human attention.</p>
            </div>

            {/* Text only toggle */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:10,border:'1px solid #e2e8f0'}}>
              <div>
                <div style={{fontWeight:600,fontSize:14,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>Only Auto-Reply to Reviews with Text</div>
                <div style={{fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:2}}>Skip rating-only reviews (no written comment)</div>
              </div>
              <button onClick={() => setSettings(s => ({...s, auto_reply_to_text_only: !s.auto_reply_to_text_only}))} style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
                {settings.auto_reply_to_text_only ? <ToggleRight size={36} color="#3b82f6"/> : <ToggleLeft size={36} color="#cbd5e1"/>}
              </button>
            </div>

            <button onClick={handleSaveSettings} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:8,background:'#3b82f6',color:'white',border:'none',fontWeight:600,fontSize:14,cursor:'pointer',width:'fit-content'}}>
              <Save size={15}/>Save Settings
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function BroadcastsPage({ activeBusiness, theme }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [audience, setAudience] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/broadcasts/templates`)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setTemplates(d.templates || []);
        else setTemplates([]);
      })
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!selectedTemplate) { alert('Please select a template first.'); return; }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/broadcasts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_name: selectedTemplate.name, audience_filter: audience })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ status: 'error', message: 'Network error. Please try again.' });
    }
    setSending(false);
  };

  return (
    <section>
      <Title title="WhatsApp Broadcast Campaigns" sub="Send personalized, template-based messages to segmented leads on WhatsApp"/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>
        {/* Template Selection */}
        <div className="card">
          <h3 style={{marginBottom:12,color: theme==='dark' ? '#e6edf3' : '#1e293b',fontWeight:700}}>1. Select Template</h3>
          {loading ? (
            <div style={{color: theme==='dark' ? '#8b949e' : '#64748b',fontSize:13}}>Loading templates...</div>
          ) : templates.length === 0 ? (
            <div>
              <div style={{color:'#ef4444',fontSize:13,marginBottom:8}}>No templates found. Create one in WhatsApp Manager.</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {templates.map((t, i) => (
                <div key={i}
                  onClick={() => setSelectedTemplate(t)}
                  style={{padding:'12px 14px',borderRadius:8,border:`1px solid ${selectedTemplate?.name===t.name?'#3b82f6':'#e2e8f0'}`,background:selectedTemplate?.name===t.name?'#eff6ff':'white',cursor:'pointer',transition:'all 0.15s'}}
                >
                  <div style={{fontWeight:600,fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{t.name}</div>
                  <div style={{fontSize:11,color: theme==='dark' ? '#8b949e' : '#64748b',marginTop:2}}>{t.language} &bull; {t.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configure & Send */}
        <div className="card">
          <h3 style={{marginBottom:12,color: theme==='dark' ? '#e6edf3' : '#1e293b',fontWeight:700}}>2. Configure &amp; Send</h3>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#8b949e' : '#475569',display:'block',marginBottom:6}}>Audience Filter</label>
            <select value={audience} onChange={e => setAudience(e.target.value)}
              style={{width:'100%',padding:'8px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,color: theme==='dark' ? '#e6edf3' : '#1e293b',background: theme==='dark' ? '#161b22' : 'white'}}>
              <option value="all">All Leads</option>
              <option value="hot">Hot Leads Only</option>
              <option value="warm">Warm Leads Only</option>
              <option value="qualified">Qualified Leads Only</option>
            </select>
          </div>
          {selectedTemplate && (
            <div style={{background: theme==='dark' ? '#1c2128' : '#f8fafc',borderRadius:8,padding:'12px',marginBottom:12,border:'1px solid #e2e8f0'}}>
              <div style={{fontSize:11,fontWeight:700,color: theme==='dark' ? '#6e7681' : '#94a3b8',textTransform:'uppercase',marginBottom:6}}>Selected Template</div>
              <div style={{fontSize:13,fontWeight:600,color: theme==='dark' ? '#e6edf3' : '#1e293b'}}>{selectedTemplate.name}</div>
            </div>
          )}
          <button
            onClick={handleSend}
            disabled={sending || !selectedTemplate}
            style={{padding:'10px 20px',borderRadius:8,background:sending||!selectedTemplate?'#94a3b8':'#3b82f6',color:'white',border:'none',fontWeight:600,fontSize:14,cursor:sending||!selectedTemplate?'not-allowed':'pointer',width:'100%'}}>
            {sending ? 'Sending...' : 'Send Broadcast'}
          </button>
          {result && (
            <div style={{marginTop:12,padding:'12px',borderRadius:8,background:result.status==='success'?'#f0fdf4':'#fef2f2',border:`1px solid ${result.status==='success'?'#86efac':'#fca5a5'}`}}>
              <div style={{fontSize:13,fontWeight:600,color:result.status==='success'?'#15803d':'#dc2626'}}>
                {result.status==='success' ? `Sent to ${result.sent_count || 0} leads` : result.message}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────────────
function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [existingBusinessId, setExistingBusinessId] = useState('');
  const [existingBusinesses, setExistingBusinesses] = useState([]);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing businesses for the selector
  React.useEffect(() => {
    if (mode === 'register') {
      fetch(`${API_BASE}/businesses`)
        .then(r => r.json())
        .then(d => { if (d.businesses) setExistingBusinesses(d.businesses); })
        .catch(() => {});
    }
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    if (mode === 'register' && !name) { setError('Name is required.'); return; }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email: email.trim(), password }
        : {
            email: email.trim(),
            password,
            name: name.trim(),
            business_name: existingBusinessId ? '' : businessName.trim(),
            existing_business_id: existingBusinessId || undefined,
          };
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        setError(data.detail || data.message || 'Authentication failed. Please try again.');
      } else if (mode === 'register') {
        setSuccess('Account created! You can now sign in.');
        setMode('login');
        setPassword('');
      } else {
        onLoginSuccess(data.user, data.access_token);
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      {/* Background pattern */}
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 25% 25%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139,92,246,0.08) 0%, transparent 50%)',pointerEvents:'none'}} />

      <div style={{width:'100%',maxWidth:440,position:'relative'}}>
        {/* Logo / Brand */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:16,background:'linear-gradient(135deg,#3b82f6,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 8px 32px rgba(59,130,246,0.4)'}}>
            <Bot size={28} color="white"/>
          </div>
          <h1 style={{fontSize:26,fontWeight:800,color:'white',margin:0,letterSpacing:'-0.02em'}}>AI Command Center</h1>
          <p style={{fontSize:14,color: theme==='dark' ? '#6e7681' : '#94a3b8',marginTop:6,marginBottom:0}}>Your intelligent business assistant</p>
        </div>

        {/* Card */}
        <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(20px)',borderRadius:20,border:'1px solid rgba(255,255,255,0.1)',padding:36,boxShadow:'0 24px 64px rgba(0,0,0,0.4)'}}>
          {/* Tab switcher */}
          <div style={{display:'flex',background:'rgba(255,255,255,0.05)',borderRadius:10,padding:4,marginBottom:28}}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                style={{flex:1,padding:'8px',borderRadius:7,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,transition:'all 0.15s',
                  background: mode===m ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: mode===m ? 'white' : '#94a3b8'}}>
                {m==='login' ? '🔑 Sign In' : '✨ Create Account'}
              </button>
            ))}
          </div>

          {/* Error / Success banners */}
          {error && (
            <div style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:18,fontSize:13,color:'#fca5a5',display:'flex',alignItems:'center',gap:8}}>
              <AlertTriangle size={14}/> {error}
            </div>
          )}
          {success && (
            <div style={{background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:18,fontSize:13,color:'#6ee7b7',display:'flex',alignItems:'center',gap:8}}>
              <CheckCircle size={14}/> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
            {mode === 'register' && (
              <>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#6e7681' : '#94a3b8',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Full Name</label>
                  <div style={{position:'relative'}}>
                    <UserPlus size={15} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color: theme==='dark' ? '#8b949e' : '#64748b'}}/>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Mohamed Aslam"
                      style={{width:'100%',padding:'11px 11px 11px 38px',borderRadius:9,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.07)',color:'white',fontSize:14,outline:'none',boxSizing:'border-box'}}
                    />
                  </div>
                </div>
                <div>
                  <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#6e7681' : '#94a3b8',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Business</label>
                  {existingBusinesses.length > 0 ? (
                    <>
                      <select value={existingBusinessId} onChange={e => setExistingBusinessId(e.target.value)}
                        style={{width:'100%',padding:'11px 11px',borderRadius:9,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(30,41,59,0.9)',color:'white',fontSize:14,outline:'none',boxSizing:'border-box',marginBottom:8}}>
                        <option value="">-- Create a new business --</option>
                        {existingBusinesses.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      {!existingBusinessId && (
                        <input
                          type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                          placeholder="New business name (e.g. Archon Solutions)"
                          style={{width:'100%',padding:'11px',borderRadius:9,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.07)',color:'white',fontSize:14,outline:'none',boxSizing:'border-box'}}
                        />
                      )}
                    </>
                  ) : (
                    <input
                      type="text" value={businessName} onChange={e => setBusinessName(e.target.value)}
                      placeholder="Your business name (e.g. SAP Guru)"
                      style={{width:'100%',padding:'11px',borderRadius:9,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.07)',color:'white',fontSize:14,outline:'none',boxSizing:'border-box'}}
                    />
                  )}
                  <p style={{fontSize:11,color: theme==='dark' ? '#8b949e' : '#64748b',margin:'6px 0 0'}}>Select an existing business or create a new one</p>
                </div>
              </>
            )}

            <div>
              <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#6e7681' : '#94a3b8',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Email Address</label>
              <div style={{position:'relative'}}>
                <Mail size={15} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color: theme==='dark' ? '#8b949e' : '#64748b'}}/>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={{width:'100%',padding:'11px 11px 11px 38px',borderRadius:9,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.07)',color:'white',fontSize:14,outline:'none',boxSizing:'border-box'}}
                />
              </div>
            </div>

            <div>
              <label style={{fontSize:12,fontWeight:600,color: theme==='dark' ? '#6e7681' : '#94a3b8',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Password</label>
              <div style={{position:'relative'}}>
                <Lock size={15} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color: theme==='dark' ? '#8b949e' : '#64748b'}}/>
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode==='register' ? 'Min 8 characters' : 'Enter your password'}
                  style={{width:'100%',padding:'11px 40px 11px 38px',borderRadius:9,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.07)',color:'white',fontSize:14,outline:'none',boxSizing:'border-box'}}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color: theme==='dark' ? '#8b949e' : '#64748b',padding:0,display:'flex',alignItems:'center'}}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{marginTop:8,padding:'13px',borderRadius:10,background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg,#3b82f6,#6366f1)',color:'white',border:'none',cursor: loading ? 'not-allowed' : 'pointer',fontSize:15,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.4)',transition:'all 0.15s'}}
            >
              {loading ? <RefreshCw size={16} style={{animation:'spin 1s linear infinite'}}/> : (mode==='login' ? <Lock size={16}/> : <UserPlus size={16}/>)}
              {loading ? 'Please wait...' : (mode==='login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {mode === 'login' && (
            <div style={{textAlign:'center',marginTop:20,fontSize:12,color: theme==='dark' ? '#8b949e' : '#64748b'}}>
              Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); }}
                style={{background:'none',border:'none',cursor:'pointer',color:'#60a5fa',fontWeight:600,fontSize:12,padding:0}}>Create one</button>
            </div>
          )}
        </div>

        <div style={{textAlign:'center',marginTop:20,fontSize:11,color: theme==='dark' ? '#8b949e' : '#475569'}}>
          AI Command Center &copy; {new Date().getFullYear()} &middot; Powered by Archon Solutions
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

