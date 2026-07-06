import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, HelpCircle, Search, Settings, LayoutDashboard, MessagesSquare, Users, Bug, Bot, Brain, UserRound, BarChart3, Workflow, Plus, Download, Filter, Play } from 'lucide-react';
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
      {page==='Leads'&&<Leads dashboard={dashboard}/>}
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

function Overview({dashboard}) {
  const counts = dashboard?.counts || {};

  return (
    <section>
      <Title title="Dashboard Overview" sub="Real-time performance at a glance" action={<button className="ghost">Live Backend Data</button>}/>

      <div className="grid4">
        <Stat label="Total Conversations" value={counts.total_conversations ?? "Loading..."} change="From conversations table"/>
        <Stat label="Total Leads" value={counts.total_leads ?? "Loading..."} change="From leads table"/>
        <Stat label="Qualified Leads" value={counts.qualified_leads ?? "Loading..."} change="Qualified only"/>
        <Stat label="Needs Human" value={counts.needs_human ?? "Loading..."} change="Waiting for manual review"/>
      </div>

      <div className="grid2">
        <Card title="Conversations Over Time"><LineBlock/></Card>
        <Card title="Intent Distribution"><PieBlock data={intents}/></Card>
      </div>

      <div className="grid5">
        <Stat label="Lead Collection" value={counts.lead_collection ?? "Loading..."} change="Leads being collected"/>
        <Stat label="Recent Conversations" value={counts.recent_conversations ?? "Loading..."} change="Latest records"/>
        <Stat label="Response Rate" value="Coming soon" change="Needs calculation"/>
        <Stat label="Avg Response Time" value="Coming soon" change="Needs timing data"/>
        <Stat label="Active Campaigns" value="Coming soon" change="Business Brain"/>
      </div>
    </section>
  );
}

function Conversations({dashboard}) {
  const rows = dashboard?.recent_conversations || [];
  const [selectedConversation, setSelectedConversation] = useState(null);

  const displayName = (row) =>
    row.customer_name ||
    row.instagram_username ||
    (row.sender_id ? `User ${String(row.sender_id).slice(-4)}` : "Unknown");

  const getLastMessage = (row) => {
    const history = row.history || [];
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]?.user) return history[i].user;
      if (history[i]?.assistant) return history[i].assistant;
    }
    return row.last_question || row.summary || "No message";
  };

  const tableRows = rows.map((row) => {
    const lastMessage = getLastMessage(row);
    const status = row.needs_human ? "Needs Human" : row.conversation_state || "Active";
    const updated = row.updated_at ? new Date(row.updated_at).toLocaleString() : "-";

    return [
      <Name name={displayName(row)} />,
      <span className="ig">IG</span>,
      String(lastMessage).slice(0, 80),
      <b className="blue">{row.category || "general"}</b>,
      <Badge text={status}/>,
      updated,
      <button
        type="button"
        className="outline"
        onClick={() => setSelectedConversation(row)}
      >
        Open
      </button>
    ];
  });

  return (
    <section>
      <Title title="Conversations" sub="Live conversations from backend" action={<button><Download size={15}/> Export</button>}/>
      <Tabs tabs={['All','Needs Human','Pending Reply','AI Replied','Manual Replied']}/>
      <div className="toolbar">
        <div className="search wide"><Search size={15}/><input placeholder="Search by sender or message..."/></div>
        <button className="icon"><Filter size={15}/></button>
      </div>

      <div style={{display: "grid", gridTemplateColumns: selectedConversation ? "1.5fr 1fr" : "1fr", gap: "16px", alignItems: "start"}}>
        <Table
          heads={['Customer','Channel','Last Message','Category','Status','Updated','Action']}
          rows={tableRows.length ? tableRows : [["Loading...", "-", "Fetching live conversations...", "-", "-", "-", "-"]]}
        />

        {selectedConversation && (
          <ConversationPanel
            conversation={selectedConversation}
            onClose={() => setSelectedConversation(null)}
          />
        )}
      </div>
    </section>
  );
}
function ConversationPanel({ conversation, onClose }) {
  const history = conversation.history || [];
  const title = conversation.sender_id ? `User ${String(conversation.sender_id).slice(-4)}` : "Unknown User";
  const status = conversation.needs_human ? "Needs Human" : conversation.conversation_state || "Active";

  return (
    <Card title="Conversation Details">
      <div style={{display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px"}}>
        <div>
          <h2 style={{margin: 0}}>{title}</h2>
          <p style={{margin: "4px 0 0", color: "#64748b"}}>Instagram Conversation</p>
        </div>
        <button type="button" className="outline" onClick={onClose}>Close</button>
      </div>

      <KeyVals
        data={{
          Sender: conversation.sender_id || "-",
          Status: status,
          Category: conversation.category || "general",
          "Needs Human": conversation.needs_human ? "Yes" : "No",
          Updated: conversation.updated_at
            ? new Date(conversation.updated_at).toLocaleString()
            : "-",
        }}
      />

      <h3 style={{marginTop: "18px"}}>Messages</h3>

      <div style={{display: "flex", flexDirection: "column", gap: "10px", maxHeight: "420px", overflowY: "auto", paddingRight: "6px"}}>
        {history.length ? history.map((item, index) => (
          <React.Fragment key={index}>
            {item.user && (
              <div style={{background: "#eef2ff", padding: "10px 12px", borderRadius: "12px", alignSelf: "flex-start", maxWidth: "90%"}}>
                <b>User</b>
                <p style={{margin: "6px 0 0"}}>{item.user}</p>
              </div>
            )}

            {item.assistant && (
              <div style={{background: "#ecfdf5", padding: "10px 12px", borderRadius: "12px", alignSelf: "flex-end", maxWidth: "90%"}}>
                <b>AI / Assistant</b>
                <p style={{margin: "6px 0 0"}}>{item.assistant}</p>
              </div>
            )}
          </React.Fragment>
        )) : (
          <p>No message history found for this conversation.</p>
        )}
      </div>

      <div style={{marginTop: "18px"}}>
        <textarea placeholder="Type manual reply..." style={{width: "100%", minHeight: "90px"}} />
        <button type="button" style={{marginTop: "10px"}}>Send Reply</button>
      </div>
    </Card>
  );
}

function Leads({dashboard}) {
  const qualified = dashboard?.qualified_leads || [];

  const rows = qualified.map((lead) => [
    <Name
      name={
           lead.customer_name ||
           lead.instagram_username ||
           lead.name ||
           (lead.sender_id ? `User ${String(lead.sender_id).slice(-4)}` : "Unknown")
           }
/>,
    lead.phone || lead.email || "-",
    lead.location || "-",
    lead.interested_module || "-",
    lead.lead_score || "-",
    lead.lead_stage || "-",
    <Badge text={lead.status || "qualified"}/>,
    "Aslam",
    lead.updated_at ? new Date(lead.updated_at).toLocaleString() : "-"
  ]);

  return (
    <section>
      <Title title="Leads Management" sub="Track and manage all your leads" action={<button><Plus size={15}/> Add Lead</button>}/>
      <Tabs tabs={['All Leads','New','Warm','Hot','Qualified','Converted']}/>
      <div className="toolbar">
        <select><option>Lead Stage: All</option></select>
        <select><option>Status: All</option></select>
        <div className="search wide"><Search size={15}/><input placeholder="Search by name, phone or email..."/></div>
        <button className="icon"><Filter size={15}/></button>
      </div>
      <Table
        heads={['Name','Contact','Location','Interested In','Lead Score','Stage','Status','Assigned To','Updated']}
        rows={rows.length ? rows : [["Loading...","-","-","-","-","-","-","-","-"]]}
      />
    </section>
  );
}

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

function BusinessBrain() {
  return (
    <section>
      <Title title="Business Brain" sub="AI understands your business" action={<button><Plus size={15}/> Create Campaign</button>}/>
      <Tabs tabs={['Campaigns','Promotions','Jobs','Courses','Resources','FAQs']}/>
      <Table heads={['Campaign Name','Type','Target Audience','Status','Active','Responses','Updated']} rows={[['SAP FICO Course May 2025','Course','New Learners',<Badge text="Active"/>,'🔵',128,'2h ago'],['SAP Jobs Dubai','Job','Job Seekers',<Badge text="Active"/>,'🔵',96,'3h ago'],['SAP S/4HANA Training','Course','Professionals',<Badge text="Paused"/>,'⚪',64,'5h ago'],['Career in SAP Webinar','Event','All',<Badge text="Active"/>,'🔵',52,'1d ago']]}/>
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
  return (
    <section>
      <Title title="Settings" sub="Configure your AI Command Center"/>
      <div className="settings">
        <Card title="General Settings"><label>Business Name<input defaultValue="SAP Guru Assistant"/></label><label>Timezone<select><option>Australia/Sydney</option></select></label><label>Language<select><option>English</option></select></label><label>Date Format<select><option>DD MMM YYYY</option></select></label><button>Save Changes</button></Card>
        <Card title="AI Behavior"><label>Creativity <input type="range" defaultValue="70"/></label><label>Reply Length <input type="range" defaultValue="60"/></label><label>Empathy Level <input type="range" defaultValue="60"/></label><label>Auto Reply Delay<select><option>15 minutes</option></select></label></Card>
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

function Card({title,children}) { return <div className="card">{title&&<h3>{title}</h3>}{children}</div>; }
function Tabs({tabs}) { return <div className="tabs">{tabs.map((t,i)=><button className={i===0?'active':''} key={t}>{t}</button>)}</div>; }
function Table({heads,rows}) { return <div className="table"><table><thead><tr>{heads.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>; }
function Name({name}) { return <span className="name"><span className="mini">{String(name || "?")[0]}</span>{name}</span>; }
function Badge({text}) { return <span className={'badge '+String(text).toLowerCase().replaceAll(' ','-')}>{text}</span>; }
function KeyVals({data}) { return <div className="kv">{Object.entries(data).map(([k,v])=><React.Fragment key={k}><span>{k}</span><b>{v}</b></React.Fragment>)}</div>; }
function LineBlock() { return <ResponsiveContainer height={240}><LineChart data={conversationData}><XAxis dataKey="day"/><YAxis/><Tooltip/><Line dataKey="total" strokeWidth={3}/><Line dataKey="ai" strokeWidth={3}/></LineChart></ResponsiveContainer>; }
function PieBlock({data}) { return <div className="pie"><ResponsiveContainer height={230}><PieChart><Pie data={data} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={2}>{data.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div>{data.map((d,i)=><p key={d.name}><i style={{background:colors[i%colors.length]}}/> {d.name} <b>{d.value}%</b></p>)}</div></div>; }

createRoot(document.getElementById('root')).render(<App />);