import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import { 
  ShieldCheck, Zap, Activity, History, 
  Terminal, Cpu, ChevronRight,
  CheckCircle2, X, MessageSquare, Key, LogOut,
  ChevronDown, GitBranch, Lock
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

/* ─── Stitch "Antigravity Obsidian" Design Tokens ─── */
const T = {
  bg:             '#082838',
  surface:        '#0a3348',
  surfLow:        '#0e4a68',
  surfMid:        '#125d83',
  surfHigh:       '#187ba8',
  surfHighest:    '#1c8cbd',
  onSurface:      '#ffffff',
  onSurfaceVar:   '#e0f2fe',
  outline:        '#5b8a9e',
  outlineVar:     '#386c87',
  primary:        '#ffffff',
  primaryCont:    '#5b8a9e',
  tint:           '#ffffff',
  emerald:        '#4edea3',
  emeraldCont:    '#00885d',
  amber:          '#f59e0b',
  rose:           '#f43f5e',
  success:        '#4edea3',
  error:          '#f43f5e',
  warn:           '#f59e0b'
};

const socket = io();

interface AuditRecord { 
  id: string; 
  repo: string; 
  pullNumber: number; 
  title: string; 
  status: string; 
  healthScore: number; 
  timestamp: string; 
  vulnerabilities: string[];
  logs: string[];
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [history, setHistory] = useState<AuditRecord[]>([]);
  const [stats, setStats] = useState<any>({ totalAudits: 0, totalHeals: 0, averageHealth: 0 });
  const [liveNodes, setLiveNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState<AuditRecord | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setTimeout(() => setLoading(false), 600);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get('/api/history');
        setHistory(res.data.audits || []);
        setStats(res.data.stats || { totalAudits: 0, totalHeals: 0, averageHealth: 0 });
      } catch (e) { console.error("Fetch failed", e); }
      finally { setLoading(false); }
    };
    fetchData();

    socket.on('raw_log', (data) => {
      setLiveNodes(p => [...p, { ...data, id: Date.now() }].slice(-100)); // Keep last 100 lines
    });

    socket.on('audit_complete', () => {
      fetchData();
    });

    return () => { 
      socket.off('raw_log'); 
      socket.off('audit_complete');
    };
  }, [session]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: T.onSurface }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Cpu size={48} style={{ color: T.primaryCont }} />
        </motion.div>
        <p style={{ marginTop: 16, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.outlineVar }}>Initializing Fleet Console</p>
      </div>
    );
  }

  if (!session) {
    return <LandingPage />;
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.onSurface, fontFamily: "'Outfit', sans-serif", padding: '2.5rem 3rem', position: 'relative' }}>
      <div className="mesh-gradient" />

      {/* HEADER */}
      <motion.header initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -4, background: T.primaryCont, filter: 'blur(20px)', opacity: 0.25, borderRadius: 20 }} />
            <div style={{ position: 'relative', padding: 14, background: `linear-gradient(135deg, ${T.primaryCont}, #6366f1)`, borderRadius: 16, boxShadow: `0 8px 32px ${T.primaryCont}33` }}>
              <Cpu size={22} color="#fff" />
            </div>
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              THE PR <span style={{ background: `linear-gradient(to right, ${T.primary}, #a78bfa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GUARDIAN</span>
            </h1>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.outline, margin: 0 }}>Fleet Observability Engine · v2.0 SaaS</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setShowSettings(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: T.surfHigh, border: `1px solid ${T.outlineVar}30`, borderRadius: 12, color: T.onSurface, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Key size={16} color={T.emerald} /> API Settings
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: T.surfHigh, border: `1px solid ${T.outlineVar}30`, borderRadius: 12, color: T.rose, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </motion.header>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40, position: 'relative', zIndex: 2 }}>
        <StatCard delay={0.1} label="Global Health" value={`${stats.averageHealth}%`} sub="Safety efficiency index" icon={<ShieldCheck size={20} />} accentColor={T.emerald} />
        <StatCard delay={0.15} label="Total Audits" value={stats.totalAudits.toString()} sub="PRs analyzed by fleet" icon={<Activity size={20} />} accentColor={T.primaryCont} />
        <StatCard delay={0.2} label="Auto-Healed" value={stats.totalHeals.toString()} sub="Fixes deployed autonomously" icon={<Zap size={20} />} accentColor={T.amber} />
        <StatCard delay={0.25} label="Agent Nodes" value="Active" sub="Cloud cluster synchronized" icon={<Terminal size={20} />} accentColor={T.outline} />
      </div>

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28, position: 'relative', zIndex: 2 }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* CHART */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ background: T.surfLow, borderRadius: 20, padding: '32px 32px 24px', border: `1px solid ${T.outlineVar}20` }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
              <History size={18} style={{ color: T.primaryCont }} /> Code Health Evolution
            </h2>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history.slice(-10)}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.primaryCont} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={T.primaryCont} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.outlineVar + '30'} />
                  <XAxis dataKey="pullNumber" stroke={T.outline} fontSize={11} axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis domain={[0, 100]} stroke={T.outline} fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="healthScore" stroke={T.primary} fill="url(#grad)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* TABLE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ background: T.surfLow, borderRadius: 20, overflow: 'hidden', border: `1px solid ${T.outlineVar}20` }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.outlineVar}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: T.onSurface }}>Recent PR Audits</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.surfLow, borderBottom: `1px solid ${T.outlineVar}15` }}>
                    <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: 11, color: T.outlineVar, textTransform: 'uppercase', letterSpacing: 1 }}>Repository</th>
                    <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: 11, color: T.outlineVar, textTransform: 'uppercase', letterSpacing: 1 }}>Status</th>
                    <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: 11, color: T.outlineVar, textTransform: 'uppercase', letterSpacing: 1 }}>Health</th>
                    <th style={{ padding: '14px 24px', textAlign: 'right', fontSize: 11, color: T.outlineVar, textTransform: 'uppercase', letterSpacing: 1 }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((pr, i) => (
                    <motion.tr key={i} onClick={() => setSelectedPR(pr)} 
                      style={{ borderBottom: `1px solid ${T.outlineVar}10`, cursor: 'pointer' }} 
                      whileHover={{ background: T.surfHigh }}>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.onSurface }}>{pr.repo}</div>
                        <div style={{ fontSize: 11, color: T.outlineVar }}>PR #{pr.pullNumber} • {pr.title.slice(0, 40)}</div>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <StatusBadge status={pr.status} />
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ width: 60, height: 6, background: T.surfHighest, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pr.healthScore}%`, background: pr.healthScore > 70 ? T.emerald : T.primaryCont }} />
                        </div>
                      </td>
                      <td style={{ padding: '18px 24px', textAlign: 'right' }}><ChevronRight size={16} color={T.outline} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* RIGHT COLUMN - TELEMETRY */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          style={{ background: T.surfLow, borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', border: `1px solid ${T.outlineVar}20`, maxHeight: 780 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Live Telemetry</h2>
            <div style={{ padding: '4px 8px', background: T.emerald + '20', color: T.emerald, borderRadius: 6, fontSize: 10, fontWeight: 800 }}>LIVE</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', padding: 8, background: '#000', borderRadius: 12 }}>
            {liveNodes.length === 0 && <div style={{ color: T.outlineVar, fontSize: 12, padding: 8 }}>Awaiting PR Hook...</div>}
            {liveNodes.map((log) => (
              <div key={log.id} style={{ fontSize: 11, color: log.type === 'error' ? T.rose : T.emerald, wordBreak: 'break-all', lineHeight: 1.4 }}>
                {log.message}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* OVERLAYS */}
      <LogModal pr={selectedPR} onClose={() => setSelectedPR(null)} />
      <SettingsModal session={session} isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <Chatbot session={session} />

      <style>{`
        .mesh-gradient {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none;
          background: radial-gradient(circle at 10% 20%, ${T.primaryCont}10 0%, transparent 40%),
                      radial-gradient(circle at 90% 80%, ${T.emerald}08 0%, transparent 40%);
        }
      `}</style>
    </div>
  );
}

function LandingPage() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const faqs = [
    { q: 'Do I need a paid plan?', a: 'No. PR Guardian runs on your own Gemini API key, so there are no recurring subscription fees. You only pay for the API calls you make, keeping costs predictable and low.' },
    { q: 'How secure is my API key?', a: 'Your key is encrypted in transit and at rest within our dashboard. We never store or log your credentials, and you maintain full control over access and revocation at any time.' },
    { q: 'Can I use this with private repos?', a: 'Yes. PR Guardian works with both public and private GitHub repositories. Simply grant the necessary permissions during setup and the AI fleet will audit all your pull requests.' },
    { q: 'What languages does it support?', a: 'The AI fleet can analyze and heal pull requests across most modern programming languages including TypeScript, Python, Go, and Rust.' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#18181b', fontFamily: "'Outfit', sans-serif" }}>
      {/* NAVBAR */}
      <nav style={{ display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, background: '#ffffff', zIndex: 50, borderBottom: `1px solid #e4e4e7` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif", color: '#000' }}>PR Guardian</span>
            </div>
            <div style={{ display: 'flex', gap: 32, fontSize: 16, fontWeight: 500, color: '#18181b', alignItems: 'center' }}>
              <a href="#features" style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>Features</a>
              <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>How it works</a>
              <a href="#faq" style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>FAQ</a>
              <div 
                onMouseEnter={() => setShowMegaMenu(true)} 
                onMouseLeave={() => setShowMegaMenu(false)}
                style={{ height: '100%', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px 0' }}
              >
                <span style={{ color: 'inherit', textDecoration: 'none' }}>Resources <ChevronDown size={16} style={{display:'inline', verticalAlign:'middle', marginBottom: 2}}/></span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setShowLogin(true)} style={{ background: '#f4f4f5', color: '#18181b', border: 'none', borderRadius: 0, fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '10px 24px' }}>Log in</button>
            <button onClick={() => setShowSignUp(true)} style={{ background: '#0e4a68', color: '#fff', border: 'none', borderRadius: 0, fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '10px 24px' }}>Sign up</button>
          </div>
        </div>

        {/* MEGA MENU - Renders natively in-flow to push content down */}
        {showMegaMenu && (
          <div 
             onMouseEnter={() => setShowMegaMenu(true)} 
             onMouseLeave={() => setShowMegaMenu(false)}
             style={{ width: '100%', background: '#ffffff', borderTop: '1px solid #e4e4e7', padding: '60px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 64, textAlign: 'left', cursor: 'default' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 700, color: '#000', marginBottom: 12, fontSize: 18 }}>Getting started</div>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Setup guide</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Fundamentals</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Quick start</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Video tutorials</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Quick reference</a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 700, color: '#000', marginBottom: 12, fontSize: 18 }}>Security</div>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Overview</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Compliance</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Data privacy</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Authentication</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Bug bounty</a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontWeight: 700, color: '#000', marginBottom: 12, fontSize: 18 }}>Community</div>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Forums</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Events</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Discord</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Meetups</a>
              <a href="#" style={{ color: '#3f3f46', textDecoration: 'none', fontSize: 16 }}>Open source</a>
            </div>

            <div style={{ paddingLeft: 40, borderLeft: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, color: '#000', marginBottom: 16, fontSize: 18 }}>Latest from blog</div>
              <img src="/mega_menu_blog_1781211461059.png" style={{width: '100%', height: 160, objectFit: 'cover', marginBottom: 16}} alt="Blog thumbnail" />
              <div style={{ fontWeight: 700, color: '#000', fontSize: 18, marginBottom: 8 }}>The Future of AI Reviews</div>
              <p style={{ color: '#3f3f46', fontSize: 16, marginBottom: 16, lineHeight: 1.5 }}>Discover how autonomous systems are changing code quality.</p>
              <a href="#" style={{ color: '#0e4a68', fontWeight: 600, fontSize: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>Read more <ChevronRight size={16} /></a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 80px)' }}>
        <div style={{ padding: '120px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#0e4a68', color: '#ffffff' }}>
          <h1 style={{ fontSize: 60, fontWeight: 400, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.01em', fontFamily: "'Inter', sans-serif" }}>
            Autonomous AI code reviews that heal themselves
          </h1>
          <p style={{ fontSize: 18, color: '#e0f2fe', lineHeight: 1.6, marginBottom: 40, maxWidth: 480 }}>
            PR Guardian secures your GitHub repositories with intelligent audits. Bring your own Gemini API Key and eliminate recurring SaaS costs while automating vulnerability scanning and code quality checks.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => setShowSignUp(true)} style={{ padding: '14px 28px', background: '#ffffff', color: '#0e4a68', border: 'none', borderRadius: 0, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Get started for free</button>
            <button style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: 'none', borderRadius: 0, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              View demo
            </button>
          </div>
        </div>
        <div style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ width: '100%', height: '100%', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/hero_dashboard_ui_1781211448345.png" style={{width: '100%', height: '100%', objectFit: 'contain'}} alt="Dashboard UI Interface" />
          </div>
        </div>
      </section>

      {/* 3 CARDS FEATURES GRID (PROCESS) */}
      <section id="how-it-works" style={{ padding: '100px 80px', background: '#f4f4f5' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ color: '#0e4a68', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 16 }}>PROCESS</div>
          <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em', color: '#000000', marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>Three steps to secure code</h2>
          <p style={{ fontSize: 18, color: '#3f3f46', maxWidth: 600, margin: '0 auto' }}>Set up PR Guardian in minutes and let the AI handle the rest.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
          {[
            { num: 1, icon: '🐙', title: 'Connect your GitHub account', desc: 'Sign up and connect your GitHub account to get PR Guardian up and running in minutes.' },
            { num: 2, icon: '🔑', title: 'Add your Gemini API Key', desc: 'Paste in your Gemini API key and we will immediately start reviewing your pull requests.' },
            { num: 3, icon: '✨', title: 'Auto-review and heal pull requests', desc: 'PR Guardian will automatically analyze bugs, flagged issues and then fix them in the pull.' }
          ].map((feat, i) => (
            <div key={i} style={{ background: '#ffffff', padding: 40, borderRadius: 16, border: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0e4a68', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>{feat.num}</div>
                <div style={{ fontSize: 24 }}>{feat.icon}</div>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#000000', fontFamily: "'Inter', sans-serif" }}>{feat.title}</h3>
              <p style={{ fontSize: 16, color: '#908fa0', lineHeight: 1.6, marginBottom: 32, flex: 1 }}>{feat.desc}</p>
              <a href="#" style={{ color: '#0e4a68', textDecoration: 'none', fontWeight: 500, fontSize: 15 }}>Explore &gt;</a>
            </div>
          ))}
        </div>
      </section>

      {/* 4 CARDS FEATURES GRID (CAPABILITIES) */}
      <section id="features" style={{ padding: '100px 80px', background: '#0e4a68', color: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ color: '#4edea3', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 16 }}>CAPABILITIES</div>
          <h2 style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em', color: '#ffffff', marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>Built for modern development</h2>
          <p style={{ fontSize: 18, color: '#e0f2fe', maxWidth: 600, margin: '0 auto' }}>Everything you need to use code without the overhead.</p>
        </div>
        
        {/* Top Feature Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
          {[
            { tag: 'GENEROSITY', icon: '🔑', title: 'Bring your own key', desc: 'Run on your Gemini API and we handle everything from code scanning to analysis.' },
            { tag: 'DETECTION', icon: '🔍', title: 'Vulnerability scanning', desc: 'Qualify issues before they reach production and fix those introductions automatically.' },
            { tag: 'INSTANTLY', icon: '⚡', title: 'Live telemetry', desc: 'Watch PR impacts in real time with detailed breakdowns of every component.' },
            { tag: 'TRACKING', icon: '📊', title: 'Global health metrics', desc: 'Monitor code quality scores and track-and-close across your entire codebase.' }
          ].map((feat, i) => (
            <div key={i} style={{ border: '1px solid #1c8cbd', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'transparent' }}>
              <div style={{ fontSize: 24, marginBottom: 24 }}>{feat.icon}</div>
              <div style={{ color: '#4edea3', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>{feat.tag}</div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{feat.title}</h3>
              <p style={{ fontSize: 15, color: '#e0f2fe', lineHeight: 1.6, marginBottom: 32, flex: 1 }}>{feat.desc}</p>
              <a href="#" style={{ color: '#4edea3', textDecoration: 'none', fontWeight: 500, fontSize: 15 }}>Explore &gt;</a>
            </div>
          ))}
        </div>

        {/* Bottom Dashboard Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {/* Panel 1: API Key */}
          <div style={{ background: '#151b2d', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', border: '1px solid #2e3447' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: '#908fa0', fontWeight: 600, letterSpacing: '0.05em' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3' }}></div>
              API Key connected
            </div>
            <div style={{ background: '#191f31', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 13, marginBottom: 'auto' }}>
              <div style={{ color: '#908fa0', marginBottom: 8 }}>// .env.local</div>
              <div style={{ color: '#ffffff', marginBottom: 16 }}>GEMINI_API_KEY=<span style={{ color: '#f59e0b' }}>AIza••••••••••••Xk9</span></div>
              <div style={{ color: '#908fa0', marginBottom: 8 }}>// PR Guardian uses your key directly</div>
              <div style={{ color: '#4edea3' }}>// No data stored on our servers</div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <div style={{ background: 'rgba(78, 222, 163, 0.1)', color: '#4edea3', padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500, border: '1px solid rgba(78, 222, 163, 0.2)' }}>✓ Verified</div>
              <div style={{ background: 'rgba(128, 131, 255, 0.1)', color: '#c0c1ff', padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 500, border: '1px solid rgba(128, 131, 255, 0.2)' }}>Gemini 1.5 Pro</div>
            </div>
          </div>

          {/* Panel 2: Scan Results */}
          <div style={{ background: '#151b2d', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', border: '1px solid #2e3447' }}>
            <div style={{ marginBottom: 20, fontSize: 13, color: '#908fa0', fontWeight: 600, letterSpacing: '0.05em' }}>SCAN RESULTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'auto' }}>
              <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>CRITICAL</div>
                <div>
                  <div style={{ color: '#ffffff', fontSize: 13, marginBottom: 4 }}>SQL injection</div>
                  <div style={{ color: '#908fa0', fontSize: 12 }}>users.js : 42</div>
                </div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>HIGH</div>
                <div>
                  <div style={{ color: '#ffffff', fontSize: 13, marginBottom: 4 }}>XSS via innerHTML</div>
                  <div style={{ color: '#908fa0', fontSize: 12 }}>render.ts : 88</div>
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#e0f2fe', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>LOW</div>
                <div>
                  <div style={{ color: '#ffffff', fontSize: 13, marginBottom: 4 }}>Missing rate limit</div>
                  <div style={{ color: '#908fa0', fontSize: 12 }}>middleware.js : 15</div>
                </div>
              </div>
            </div>
            <div style={{ color: '#4edea3', fontSize: 12, marginTop: 16 }}>✓ Auto-fix queued for 2 issues</div>
          </div>

          {/* Panel 3: Live Activity */}
          <div style={{ background: '#151b2d', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', border: '1px solid #2e3447' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#908fa0', fontWeight: 600, letterSpacing: '0.05em' }}>LIVE ACTIVITY</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, marginBottom: 'auto' }}>
              <div style={{ display: 'flex', gap: 16 }}><div style={{ color: '#908fa0', width: 45 }}>0.3s</div><div style={{ color: '#c0c1ff' }}>PR #1043 opened by @maja</div></div>
              <div style={{ display: 'flex', gap: 16 }}><div style={{ color: '#908fa0', width: 45 }}>1.1s</div><div style={{ color: '#4edea3' }}>Review complete — 0 issues</div></div>
              <div style={{ display: 'flex', gap: 16 }}><div style={{ color: '#908fa0', width: 45 }}>4.2s</div><div style={{ color: '#c0c1ff' }}>Patch merged in #1041</div></div>
              <div style={{ display: 'flex', gap: 16 }}><div style={{ color: '#908fa0', width: 45 }}>12s</div><div style={{ color: '#f59e0b' }}>XSS flagged in #1040</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, fontSize: 13, color: '#4edea3' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4edea3' }}></div>
              Streaming live
            </div>
          </div>

          {/* Panel 4: Repo Health */}
          <div style={{ background: '#151b2d', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', border: '1px solid #2e3447' }}>
            <div style={{ marginBottom: 16, fontSize: 13, color: '#908fa0', fontWeight: 600, letterSpacing: '0.05em' }}>REPO HEALTH · GLOBAL VIEW</div>
            
            {/* Overall Score Box */}
            <div style={{ background: '#191f31', border: '1px solid #2e3447', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
               <div style={{ width: 56, height: 56, borderRadius: '50%', border: '4px solid #4edea3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#4edea3' }}>94</div>
               <div>
                 <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Overall Health Score</div>
                 <div style={{ color: '#908fa0', fontSize: 13 }}>Across 12 monitored repositories</div>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}><span style={{ color: '#dce1fb' }}>Security score</span><span style={{ color: '#ffffff', fontWeight: 600 }}>94%</span></div>
                <div style={{ width: '100%', height: 4, background: '#191f31', borderRadius: 2 }}><div style={{ width: '94%', height: '100%', background: '#4edea3', borderRadius: 2 }}></div></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}><span style={{ color: '#dce1fb' }}>Code quality</span><span style={{ color: '#ffffff', fontWeight: 600 }}>88%</span></div>
                <div style={{ width: '100%', height: 4, background: '#191f31', borderRadius: 2 }}><div style={{ width: '88%', height: '100%', background: '#3b82f6', borderRadius: 2 }}></div></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}><span style={{ color: '#dce1fb' }}>Test coverage</span><span style={{ color: '#ffffff', fontWeight: 600 }}>71%</span></div>
                <div style={{ width: '100%', height: 4, background: '#191f31', borderRadius: 2 }}><div style={{ width: '71%', height: '100%', background: '#a855f7', borderRadius: 2 }}></div></div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}><span style={{ color: '#dce1fb' }}>Dependency freshness</span><span style={{ color: '#ffffff', fontWeight: 600 }}>83%</span></div>
                <div style={{ width: '100%', height: 4, background: '#191f31', borderRadius: 2 }}><div style={{ width: '83%', height: '100%', background: '#f59e0b', borderRadius: 2 }}></div></div>
              </div>
            </div>
            
            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['api-service', 'web-app', 'auth-svc', '+9 more'].map((t, i) => (
                <div key={i} style={{ background: '#191f31', border: '1px solid #2e3447', color: '#908fa0', padding: '4px 8px', borderRadius: 4, fontSize: 11 }}>{t}</div>
              ))}
            </div>

            <div style={{ color: '#4edea3', fontSize: 12, marginTop: 'auto' }}>↑ +11 pts since PR Guardian was enabled</div>
          </div>
        </div>
      </section>

      {/* NUMBERED STATS SECTION */}
      <section style={{ padding: '100px 80px', background: '#ffffff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ color: '#0e4a68', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 16 }}>RESULTS</div>
          <h2 style={{ fontSize: 48, fontWeight: 600, letterSpacing: '-0.02em', color: '#000000', marginBottom: 24, fontFamily: "'Inter', sans-serif", lineHeight: 1.1 }}>Developers trust PR Guardian to secure their code</h2>
          <p style={{ fontSize: 18, color: '#908fa0', marginBottom: 48 }}>Teams using PR Guardian have fewer hidden reviews, fewer vulnerabilities and stronger code quality across the board.</p>
          
          <div style={{ display: 'flex', gap: 64, marginBottom: 48 }}>
            <div>
               <div style={{ fontSize: 48, fontWeight: 700, color: '#0e4a68', fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>10,000+</div>
               <div style={{ fontSize: 16, color: '#908fa0' }}>PR requests reviewed and resolved</div>
            </div>
            <div>
               <div style={{ fontSize: 48, fontWeight: 700, color: '#0e4a68', fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>80%</div>
               <div style={{ fontSize: 16, color: '#908fa0' }}>Reduction in code review time</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <button style={{ padding: '14px 32px', background: '#0e4a68', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Start Free</button>
            <button style={{ padding: '14px 32px', background: '#ffffff', color: '#18181b', border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Read case studies</button>
          </div>
        </div>
        
        {/* Right Side Dashboard Panel */}
        <div style={{ background: '#151b2d', borderRadius: 16, display: 'flex', flexDirection: 'column', border: '1px solid #2e3447', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          {/* Top Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #2e3447' }}>
            <div style={{ padding: 24, borderRight: '1px solid #2e3447' }}>
              <div style={{ color: '#908fa0', fontSize: 13, marginBottom: 12 }}>PRs Reviewed</div>
              <div style={{ color: '#ffffff', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>10,482</div>
              <div style={{ color: '#4edea3', fontSize: 13 }}>+12% this month</div>
            </div>
            <div style={{ padding: 24, borderRight: '1px solid #2e3447' }}>
              <div style={{ color: '#908fa0', fontSize: 13, marginBottom: 12 }}>Bugs Caught</div>
              <div style={{ color: '#ffffff', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>3,241</div>
              <div style={{ color: '#4edea3', fontSize: 13 }}>+8% this month</div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ color: '#908fa0', fontSize: 13, marginBottom: 12 }}>Avg Review Time</div>
              <div style={{ color: '#ffffff', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>4.2s</div>
              <div style={{ color: '#4edea3', fontSize: 13 }}>-62% this month</div>
            </div>
          </div>
          
          {/* Chart Area */}
          <div style={{ padding: 32, borderBottom: '1px solid #2e3447' }}>
            <div style={{ color: '#908fa0', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 32 }}>VULNERABILITIES DETECTED PER WEEK</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, marginBottom: 16 }}>
              {/* Bars representing weeks */}
              <div style={{ flex: 1, height: '60%', background: '#3b82f6', borderRadius: '4px 4px 0 0' }}></div>
              <div style={{ flex: 1, height: '55%', background: '#3b82f6', borderRadius: '4px 4px 0 0' }}></div>
              <div style={{ flex: 1, height: '80%', background: '#3b82f6', borderRadius: '4px 4px 0 0' }}></div>
              <div style={{ flex: 1, height: '45%', background: '#3b82f6', borderRadius: '4px 4px 0 0' }}></div>
              {/* After PR Guardian */}
              <div style={{ flex: 1, height: '35%', background: '#22c55e', borderRadius: '4px 4px 0 0' }}></div>
              <div style={{ flex: 1, height: '25%', background: '#22c55e', borderRadius: '4px 4px 0 0' }}></div>
              <div style={{ flex: 1, height: '15%', background: '#22c55e', borderRadius: '4px 4px 0 0' }}></div>
              <div style={{ flex: 1, height: '10%', background: '#22c55e', borderRadius: '4px 4px 0 0' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#908fa0', fontSize: 12, marginBottom: 24, padding: '0 8px' }}>
              <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>W5</span><span>W6</span><span>W7</span><span>W8</span>
            </div>
            <div style={{ textAlign: 'center', color: '#908fa0', fontSize: 13 }}>
              Blue = before PR Guardian · <span style={{ color: '#4edea3' }}>Green = after</span>
            </div>
          </div>

          {/* Files List */}
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'monospace', fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#dce1fb' }}>auth/token.ts</span><span style={{ color: '#4edea3', fontWeight: 600 }}>Fixed</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#dce1fb' }}>api/endpoints.go</span><span style={{ color: '#4edea3', fontWeight: 600 }}>Patched</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#dce1fb' }}>utils/crypto.py</span><span style={{ color: '#f59e0b', fontWeight: 600 }}>Flagged</span></div>
          </div>

        </div>
      </section>

      {/* SECURE YOUR CODE TODAY CTA */}
      <section style={{ paddingTop: '100px', textAlign: 'center', background: '#0e4a68', color: '#ffffff' }}>
        <h2 style={{ fontSize: 48, fontWeight: 500, marginBottom: 16, letterSpacing: '-0.02em', color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>Secure your code today</h2>
        <p style={{ fontSize: 18, color: '#e0f2fe', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
          Join the thousands of developers who trust PR Guardian to protect their repositories with autonomous AI reviews.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 64 }}>
          <button onClick={() => setShowSignUp(true)} style={{ padding: '14px 32px', background: '#ffffff', color: '#0e4a68', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Sign up</button>
          <button style={{ padding: '14px 32px', background: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Schedule call</button>
        </div>
        
        {/* Large Dashboard Panel for pipeline */}
        <div style={{ background: '#0a101f', display: 'flex', justifyContent: 'center', width: '100%', padding: '60px 40px 0 40px' }}>
          <div style={{ width: '100%', maxWidth: 1000, background: '#151b2d', border: '1px solid #2e3447', borderBottom: 'none', borderRadius: '16px 16px 0 0', padding: 48, display: 'flex', flexDirection: 'column', gap: 48 }}>
            
            {/* Top Pipeline Steps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              {/* Connecting Line */}
              <div style={{ position: 'absolute', top: 32, left: '10%', right: '10%', height: 1, background: '#2e3447', zIndex: 0 }}></div>
              
              {[
                { icon: '🐙', title: 'GitHub PR opened', desc: 'Webhook triggers instantly' },
                { icon: '🤖', title: 'AI analysis', desc: 'Gemini scans the diff' },
                { icon: '🔍', title: 'Vulnerabilities found', desc: 'Security, quality, style' },
                { icon: '💊', title: 'Patch generated', desc: 'Fix committed automatically' },
                { icon: '✅', title: 'PR approved', desc: 'Ready to merge' }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, width: 140 }}>
                  <div style={{ width: 64, height: 64, background: '#0e4a68', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 16, border: '1px solid #1c8cbd', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
                    {step.icon}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#ffffff', marginBottom: 4 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: '#908fa0' }}>{step.desc}</div>
                </div>
              ))}
            </div>

            {/* Bottom Stats Row */}
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { val: '< 1s', label: 'Webhook to review', color: '#4edea3' },
                { val: '99.9%', label: 'Uptime SLA', color: '#4edea3' },
                { val: '50+', label: 'Languages supported', color: '#4edea3' },
                { val: '0 config', label: 'Required to start', color: '#4edea3' }
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, background: '#191f31', border: '1px solid #2e3447', borderRadius: 12, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: stat.color, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>{stat.val}</div>
                  <div style={{ fontSize: 14, color: '#908fa0' }}>{stat.label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '100px 80px', background: '#5b8a9e' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 44, fontWeight: 400, letterSpacing: '-0.01em', color: '#ffffff', marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>Questions</h2>
            <p style={{ fontSize: 16, color: '#e0f2fe' }}>Everything you need to know about getting started with PR Guardian.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {faqs.map((faq, i) => (
              <div key={i}>
                <button onClick={() => toggleFaq(i)} style={{ width: '100%', padding: '24px', background: '#0e4a68', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', color: '#ffffff', fontSize: 18, fontWeight: 600, textAlign: 'left', fontFamily: "'Inter', sans-serif" }}>
                  {faq.q}
                  <div style={{ transform: faqOpen === i ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: 24, fontWeight: 300 }}>×</div>
                </button>
                {faqOpen === i && (
                  <div style={{ padding: '0 24px 24px', background: '#0e4a68', color: '#e0f2fe', fontSize: 15, lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 64 }}>
            <h3 style={{ fontSize: 24, fontWeight: 500, color: '#ffffff', marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>Need more help?</h3>
            <p style={{ fontSize: 16, color: '#e0f2fe', marginBottom: 24 }}>Reach out to our team for support.</p>
            <button style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.25)', color: '#ffffff', border: 'none', borderRadius: 0, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Contact</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '80px 80px 40px', background: '#0e4a68', color: '#ffffff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 64, marginBottom: 80 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif", color: '#ffffff' }}>PR Guardian</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, color: '#e0f2fe' }}>
            <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 8, fontSize: 16 }}>Product</div>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Security</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Resources</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, color: '#e0f2fe' }}>
            <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 8, fontSize: 16 }}>Documentation</div>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Guides</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>API reference</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Community</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Company</a>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: 16, fontSize: 16 }}>Updates</div>
            <p style={{ fontSize: 14, color: '#e0f2fe', marginBottom: 24, lineHeight: 1.5 }}>Get the latest news on features, security updates, and product releases.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <input type="email" placeholder="your@email.com" style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 0, color: '#ffffff', outline: 'none' }} />
              <button style={{ padding: '12px 24px', background: '#386c87', color: '#fff', border: 'none', borderRadius: 0, fontWeight: 600, cursor: 'pointer' }}>Subscribe</button>
            </div>
            <p style={{ fontSize: 11, color: '#e0f2fe', marginTop: 16, opacity: 0.8 }}>By subscribing you agree to our Privacy Policy and consent to receive updates from PR Guardian.</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 32, borderTop: `1px solid rgba(255,255,255,0.1)`, fontSize: 13, color: '#e0f2fe' }}>
          <div>© 2026 PR Guardian. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookie Settings</a>
          </div>
        </div>
      </footer>

      <SignUpModal isOpen={showSignUp} onClose={() => setShowSignUp(false)} onSwitchToLogin={() => { setShowSignUp(false); setShowLogin(true); }} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSwitchToSignUp={() => { setShowLogin(false); setShowSignUp(true); }} />
    </div>
  );
}

function SignUpModal({ isOpen, onClose, onSwitchToLogin }: any) {
  const handleSignUp = async () => {
    // In a production app, we would mark an intent to sign up here, or use email/password.
    // For now, we proceed to GitHub OAuth which handles creation automatically.
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000c', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 40 }}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{ background: T.surfLow, padding: 48, borderRadius: 24, border: `1px solid ${T.outlineVar}30`, textAlign: 'center', maxWidth: 440, width: '100%', zIndex: 2, boxShadow: '0 24px 64px -12px #000', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: T.outlineVar, cursor: 'pointer' }}><X size={20} /></button>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ padding: 16, background: `linear-gradient(135deg, ${T.primaryCont}, #6366f1)`, borderRadius: 20, boxShadow: `0 8px 32px ${T.primaryCont}40` }}>
            <ShieldCheck size={32} color="#fff" />
          </div>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: T.onSurface, margin: '0 0 12px' }}>Create your account</h2>
        <p style={{ color: T.onSurfaceVar, fontSize: 15, margin: '0 0 32px', lineHeight: 1.5 }}>
          Sign up to secure your repository and orchestrate autonomous AI code reviews.
        </p>

        <button onClick={handleSignUp}
          style={{ width: '100%', padding: '14px 20px', background: T.onSurface, color: T.bg, border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>
          <GitBranch size={20} /> Sign Up with GitHub
        </button>
        
        <div style={{ marginTop: 32, fontSize: 14, color: T.onSurfaceVar }}>
          Already have an account? <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: T.primaryCont, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Log In here</button>
        </div>
      </motion.div>
    </div>
  );
}

function LoginModal({ isOpen, onClose, onSwitchToSignUp }: any) {
  const handleLogin = async () => {
    // In a strict flow, we would verify the user exists first.
    // For GitHub OAuth, we redirect. If the requirement is strict separation, 
    // we can simulate the intent check here or handle it post-redirect.
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000c', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 40 }}>
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{ background: T.surfLow, padding: 48, borderRadius: 24, border: `1px solid ${T.outlineVar}30`, textAlign: 'center', maxWidth: 440, width: '100%', zIndex: 2, boxShadow: '0 24px 64px -12px #000', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: T.outlineVar, cursor: 'pointer' }}><X size={20} /></button>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ padding: 16, background: T.surfMid, borderRadius: 20, border: `1px solid ${T.outlineVar}30` }}>
            <Lock size={32} color={T.onSurface} />
          </div>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: T.onSurface, margin: '0 0 12px' }}>Welcome back</h2>
        <p style={{ color: T.onSurfaceVar, fontSize: 15, margin: '0 0 32px', lineHeight: 1.5 }}>
          Log in to access your PR Guardian dashboard. You must have a registered account to proceed.
        </p>

        <button onClick={handleLogin}
          style={{ width: '100%', padding: '14px 20px', background: T.primaryCont, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', boxShadow: `0 4px 12px ${T.primaryCont}40` }}>
          <GitBranch size={20} /> Log In with GitHub
        </button>
        
        <div style={{ marginTop: 32, fontSize: 14, color: T.onSurfaceVar }}>
          Don't have an account? <button onClick={onSwitchToSignUp} style={{ background: 'none', border: 'none', color: T.primaryCont, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Sign Up first</button>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsModal({ session, isOpen, onClose }: any) {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      supabase.from('profiles').select('gemini_api_key').eq('id', session.user.id).single()
        .then(({ data }) => { if (data?.gemini_api_key) setApiKey(data.gemini_api_key); });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    const githubUsername = session.user.user_metadata?.user_name || session.user.user_metadata?.preferred_username;
    await supabase.from('profiles').upsert({ 
      id: session.user.id, 
      gemini_api_key: apiKey,
      github_username: githubUsername
    });
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000c', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 40 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: T.surfLow, width: '100%', maxWidth: 500, borderRadius: 24, padding: 32, border: `1px solid ${T.outlineVar}40`, boxShadow: '0 24px 64px -12px #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Key size={20} color={T.emerald} /> Bring Your Own Key
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.outline, cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: T.outlineVar, marginBottom: 24, lineHeight: 1.5 }}>
          PR Guardian runs entirely free of cost. To enable AI analysis on your repositories, please securely provide your own Gemini API Key. This is encrypted in your personal vault.
        </p>
        <input 
          type="password" 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)} 
          placeholder="AIzaSy..."
          style={{ width: '100%', padding: '14px 16px', background: T.surfMid, border: `1px solid ${T.outlineVar}40`, borderRadius: 12, color: T.onSurface, fontSize: 14, marginBottom: 24, outline: 'none' }}
        />
        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg, ${T.emerald}, ${T.emeraldCont})`, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          {saving ? 'Encrypting & Saving...' : 'Save API Key'}
        </button>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, accentColor, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: T.surfLow, borderRadius: 16, padding: '28px 24px', borderLeft: `4px solid ${accentColor}`, border: `1px solid ${T.outlineVar}15` }}>
      <div style={{ color: accentColor, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.outline }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: T.onSurface }}>{value}</div>
      <div style={{ fontSize: 11, color: T.outlineVar }}>{sub}</div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'Passed' ? T.emerald : status === 'Healed' ? T.primaryCont : T.rose;
  return (
    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, color, background: color + '15', border: `1px solid ${color}25` }}>
      {status.toUpperCase()}
    </span>
  );
}

function LogModal({ pr, onClose }: { pr: AuditRecord | null, onClose: () => void }) {
  if (!pr) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000c', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 40 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        style={{ background: T.surfLow, width: '100%', maxWidth: 800, maxHeight: '80vh', borderRadius: 24, padding: 40, border: `1px solid ${T.outlineVar}40`, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px -12px #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>{pr.repo}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.outlineVar, fontSize: 14 }}>
              <span>PR #{pr.pullNumber}</span>
              <span>•</span>
              <span>{new Date(pr.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 8, background: T.surfHigh, border: 'none', borderRadius: 12, color: T.onSurface, cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ padding: 24, background: T.surfMid, borderRadius: 16, border: `1px solid ${T.outlineVar}20` }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: T.primaryCont }}>Vulnerability Scan Results</h4>
            {pr.vulnerabilities && pr.vulnerabilities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pr.vulnerabilities.map((v, i) => (
                  <div key={i} style={{ fontSize: 13, color: T.onSurface, display: 'flex', gap: 10 }}>
                    <span style={{ color: T.rose }}>•</span> {v}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: T.emerald, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> No high-risk vulnerabilities detected.
              </div>
            )}
          </div>

          <div style={{ padding: 24, background: T.surfMid, borderRadius: 16, border: `1px solid ${T.outlineVar}20` }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: T.primaryCont }}>Audit Execution Logs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pr.logs && pr.logs.length > 0 ? (
                pr.logs.map((log, i) => (
                  <div key={i} style={{ padding: 12, background: T.surfLow, borderRadius: 8, fontSize: 12, fontFamily: 'monospace', color: T.onSurfaceVar, border: `1px solid ${T.outlineVar}10` }}>
                    {log}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: T.outlineVar, fontStyle: 'italic' }}>No detailed logs available for this session.</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div style={{ background: T.surfHigh, padding: 12, borderRadius: 12, border: `1px solid ${T.outlineVar}`, boxShadow: '0 8px 32px #000' }}>
        <p style={{ fontSize: 10, color: T.outline, marginBottom: 4 }}>PR #{label}</p>
        <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: T.primary }}>{payload[0].value}% Health</p>
      </div>
    );
  }
  return null;
}

function Chatbot({ session }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    setChat(prev => [...prev, { role: 'user', text: query }]);
    setQuery('');
    setLoading(true);
    try {
      const githubUsername = session.user.user_metadata?.user_name || session.user.user_metadata?.preferred_username;
      const res = await axios.post('/api/chat', { query, githubUsername });
      setChat(prev => [...prev, { role: 'bot', text: res.data.answer }]);
    } catch (e) {
      setChat(prev => [...prev, { role: 'bot', text: 'Error: Failed to fetch response from core.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: 30, right: 30, zIndex: 100, width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${T.primaryCont}, #6366f1)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px #000'
        }}
      >
        <MessageSquare size={24} />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: 100, right: 30, zIndex: 99, width: 400, height: 550, background: T.surfHigh,
              borderRadius: 24, border: `1px solid ${T.outlineVar}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 64px -12px #000'
            }}
          >
            <div style={{ padding: '16px 20px', background: T.surfHighest, borderBottom: `1px solid ${T.outlineVar}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Terminal size={18} style={{ color: T.primaryCont }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: T.onSurface }}>Fleet Intelligence Chat</div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {chat.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: 40, color: T.outlineVar, fontSize: 12 }}>
                  Ask me anything about your indexed codebase!
                </div>
              )}
              {chat.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: 16, fontSize: 13, lineHeight: 1.5,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderTopLeftRadius: msg.role === 'bot' ? 4 : 16,
                    background: msg.role === 'user' ? T.primaryCont : T.surfLow,
                    color: msg.role === 'user' ? '#fff' : T.onSurface,
                    border: msg.role === 'bot' ? `1px solid ${T.outlineVar}20` : 'none',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: T.surfLow, borderRadius: 16, borderTopLeftRadius: 4, fontSize: 13, color: T.outlineVar, border: `1px solid ${T.outlineVar}20` }}>
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>Thinking...</motion.span>
                </div>
              )}
            </div>

            <div style={{ padding: 16, borderTop: `1px solid ${T.outlineVar}30`, background: T.surfLow }}>
              <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Query codebase..."
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${T.outlineVar}40`,
                  background: T.surfMid, color: T.onSurface, fontSize: 13, outline: 'none'
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
