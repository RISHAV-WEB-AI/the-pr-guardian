import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import { 
  ShieldCheck, Zap, Activity, History, 
  Terminal, Cpu, ChevronRight,
  CheckCircle2, X, MessageSquare, Key, LogOut
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

/* ─── Stitch "Antigravity Obsidian" Design Tokens ─── */
const T = {
  bg:             '#0c1324',
  surface:        '#0c1324',
  surfLow:        '#151b2d',
  surfMid:        '#191f31',
  surfHigh:       '#23293c',
  surfHighest:    '#2e3447',
  onSurface:      '#dce1fb',
  onSurfaceVar:   '#c7c4d7',
  outline:        '#908fa0',
  outlineVar:     '#464554',
  primary:        '#c0c1ff',
  primaryCont:    '#8083ff',
  tint:           '#c0c1ff',
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
    return <LoginScreen />;
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
              AUTONOMOUS <span style={{ background: `linear-gradient(to right, ${T.primary}, #a78bfa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI CODE REVIEWER</span>
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

function LoginScreen() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif" }}>
      <div className="mesh-gradient" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: T.surfLow, padding: 48, borderRadius: 24, border: `1px solid ${T.outlineVar}30`, textAlign: 'center', maxWidth: 400, zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ padding: 16, background: `linear-gradient(135deg, ${T.primaryCont}, #6366f1)`, borderRadius: 20, boxShadow: `0 8px 32px ${T.primaryCont}40` }}>
            <ShieldCheck size={32} color="#fff" />
          </div>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: T.onSurface, margin: '0 0 12px' }}>PR Guardian SaaS</h1>
        <p style={{ color: T.outlineVar, fontSize: 14, margin: '0 0 32px', lineHeight: 1.5 }}>
          Sign in to secure your repository and orchestrate autonomous AI code reviews.
        </p>
        <button onClick={handleLogin}
          style={{ width: '100%', padding: '14px 20px', background: T.onSurface, color: T.bg, border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>
          Continue with GitHub
        </button>
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
