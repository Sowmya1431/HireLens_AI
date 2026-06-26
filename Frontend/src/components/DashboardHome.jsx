import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadialBarChart, RadialBar,
  AreaChart, Area, LabelList,
} from "recharts";
import "./Dashboardhome.css";

/* ─────────────────────────────────────────────
   PALETTE (matches CSS tokens)
───────────────────────────────────────────── */
const BLUE   = "#0084ff";
const CYAN   = "#4cc9ff";
const PURPLE = "#7b61ff";
const GREEN  = "#00c896";
const AMBER  = "#f5a623";
const CORAL  = "#ff5e6c";
const SLATE  = "#94a3b8";
const INK    = "#1a1a2e";

const PIE_COLORS  = [GREEN, CORAL];
const CAT_COLORS  = [BLUE, CYAN, PURPLE, GREEN, AMBER, CORAL];
const PRIO_COLORS = { High: CORAL, Medium: AMBER, Low: GREEN };

/* ─────────────────────────────────────────────
   DATA TRANSFORMS
───────────────────────────────────────────── */
function transformApiData(api) {
  const categoryMap = {};
  (api.relatedSkills || []).forEach(({ category }) => {
    if (!category) return;
    const cat = category.trim();
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  if (Object.keys(categoryMap).length === 0) {
    (api.requiredSkillsDetailed || []).forEach(({ importance }) => {
      const cat = importance || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
  }
  const skillCategories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const missingSet = new Set(api.missingSkills || []);
  const missingPriority = (api.requiredSkillsDetailed || [])
    .filter(s => missingSet.has(s.skill))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)
    .map(s => ({
      name: s.skill,
      priority: s.importance === "critical" ? "High" : s.importance === "preferred" ? "Medium" : "Low",
      value: Math.round(s.weight * 10) / 10,
    }));

  const breakdown = [
    { name: "Skills",   score: api.skillScore           ?? 0 },
    { name: "Resume",   score: api.resumeQualityScore   ?? 0 },
    { name: "Projects", score: api.projectRelevanceScore ?? 0 },
  ];

  const totalKeywords  = (api.requiredSkillsNormalized || []).length;
  const foundKeywords  = (api.matchedSkills            || []).length;
  const keywordDensity = totalKeywords ? Math.round((foundKeywords / totalKeywords) * 100) : 0;

  const toStatus = s => s >= 76 ? "great" : s >= 50 ? "warn" : "poor";
  const sectionQuality = [
    { name: "Skills",   score: api.skillScore            ?? 0, status: toStatus(api.skillScore ?? 0) },
    { name: "Projects", score: api.projectRelevanceScore ?? 0, status: toStatus(api.projectRelevanceScore ?? 0) },
    { name: "Resume",   score: api.resumeQualityScore    ?? 0, status: toStatus(api.resumeQualityScore ?? 0) },
  ];

  return {
    atsScore:       api.atsScore          ?? 0,
    matchedSkills:  (api.matchedSkills    || []).length,
    missingSkills:  (api.missingSkills    || []).length,
    totalRequired:  (api.requiredSkillsNormalized || []).length,
    keywordDensity, totalKeywords, foundKeywords,
    breakdown, missingPriority, skillCategories, sectionQuality,
    missingKeywords:           api.missingSkills || [],
    strengths:                 api.strengths     || [],
    weaknesses:                api.weaknesses    || [],
    suggestions:               api.suggestions   || [],
    matchedSkillsList:         api.matchedSkills || [],
    relatedSkills:             api.relatedSkills || [],
    resumeSkillsNormalized:    api.resumeSkillsNormalized   || [],
    requiredSkillsNormalized:  api.requiredSkillsNormalized || [],
  };
}

function transformHistory(analyses) {
  if (!analyses?.length) return null;
  const sorted = [...analyses].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const scoreTrend = sorted.map((a, i) => ({
    label: `#${i + 1}`,
    date: new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    atsScore:             a.atsScore             ?? 0,
    skillScore:           a.skillScore           ?? 0,
    resumeQualityScore:   a.resumeQualityScore   ?? 0,
    projectRelevanceScore: a.projectRelevanceScore ?? 0,
  }));

  const avg = key => Math.round(analyses.reduce((s, a) => s + (a[key] ?? 0), 0) / analyses.length);
  const avgScores = { ats: avg("atsScore"), skill: avg("skillScore"), resume: avg("resumeQualityScore"), project: avg("projectRelevanceScore") };

  const missingCount = {};
  analyses.forEach(a => (a.missingSkills || []).forEach(sk => { missingCount[sk] = (missingCount[sk] || 0) + 1; }));
  const topMissing = Object.entries(missingCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([skill, count]) => ({ skill, count, pct: Math.round((count / analyses.length) * 100) }));

  const matchedCount = {};
  analyses.forEach(a => (a.matchedSkills || []).forEach(sk => { matchedCount[sk] = (matchedCount[sk] || 0) + 1; }));
  const topMatched = Object.entries(matchedCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([skill, count]) => ({ skill, count, pct: Math.round((count / analyses.length) * 100) }));

  const weaknessFreq = {};
  analyses.forEach(a => (a.weaknesses || []).forEach(w => { const k = w.slice(0, 80); weaknessFreq[k] = (weaknessFreq[k] || 0) + 1; }));
  const recurringWeaknesses = Object.entries(weaknessFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([text, count]) => ({ text, count }));

  const strengthFreq = {};
  analyses.forEach(a => (a.strengths || []).forEach(s => { const k = s.slice(0, 80); strengthFreq[k] = (strengthFreq[k] || 0) + 1; }));
  const recurringStrengths = Object.entries(strengthFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([text, count]) => ({ text, count }));

  const first = sorted[0];
  const last  = sorted[sorted.length - 1];
  const improvement = [
    { name: "Skills",   before: first.skillScore ?? 0,           after: last.skillScore ?? 0 },
    { name: "Resume",   before: first.resumeQualityScore ?? 0,   after: last.resumeQualityScore ?? 0 },
    { name: "Projects", before: first.projectRelevanceScore ?? 0, after: last.projectRelevanceScore ?? 0 },
    { name: "Overall",  before: first.atsScore ?? 0,             after: last.atsScore ?? 0 },
  ].map(d => ({ ...d, delta: d.after - d.before }));

  return { scoreTrend, avgScores, topMissing, topMatched, recurringWeaknesses, recurringStrengths, improvement, total: analyses.length };
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 76) return GREEN;
  if (s >= 50) return AMBER;
  return CORAL;
}

function scoreCSSClass(s) {
  if (s >= 76) return "c-green";
  if (s >= 50) return "c-amber";
  return "c-coral";
}

/* ─────────────────────────────────────────────
   SHARED COMPONENTS
───────────────────────────────────────────── */
function GaugeRing({ score }) {
  const r = 68, cx = 88, cy = 88;
  const circ = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  const color = scoreColor(score);
  const label = score >= 76 ? "Great match" : score >= 50 ? "Fair match" : "Needs work";
  return (
    <svg width="176" height="176" viewBox="0 0 176 176">
      <defs>
        <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={color} strokeOpacity="0.08" strokeWidth="12" />
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2ff" strokeWidth="11" />
      {/* Progress */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#gGrad)" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray 1.1s ease" }} />
      <text x={cx} y={cy - 10} textAnchor="middle" fill={INK} fontSize="34" fontWeight="800" fontFamily="Inter,sans-serif" letterSpacing="-1">{score}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={SLATE} fontSize="10" fontFamily="Inter,sans-serif">out of 100</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{label}</text>
    </svg>
  );
}

function StatCard({ icon, label, value, colorClass, sub }) {
  return (
    <div className={`dh-stat-card ${colorClass}`}>
      <div className={`dh-stat-icon ${colorClass}`}>{icon}</div>
      <div>
        <div className={`dh-stat-val ${colorClass}`}>{value}</div>
        <div className="dh-stat-label">{label}</div>
        {sub && <div className="dh-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function Card({ children, className = "", style = {} }) {
  return <div className={`dh-card ${className}`} style={style}>{children}</div>;
}

function CardHead({ title, sub }) {
  return (
    <>
      <div className="dh-card-title">{title}</div>
      {sub && <div className="dh-card-sub">{sub}</div>}
    </>
  );
}

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "9px 13px",
      boxShadow: "0 4px 20px rgba(0,0,0,.1)", border: "1px solid #eef2ff" }}>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 11, color: INK }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "3px 0 0", fontSize: 12, color: p.color || p.fill }}>
          {p.name}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
};

function SectionBar({ name, score, status }) {
  const color = status === "great" ? GREEN : status === "warn" ? AMBER : CORAL;
  const icon  = status === "great" ? "✅" : status === "warn" ? "⚠️" : "❌";
  return (
    <div className="dh-sec-row">
      <span className="dh-sec-icon">{icon}</span>
      <span className="dh-sec-name">{name}</span>
      <div className="dh-sec-track">
        <div className="dh-sec-fill" style={{ width: score + "%", background: color }} />
      </div>
      <span className="dh-sec-pct" style={{ color }}>{score}%</span>
    </div>
  );
}

function Skeleton({ height = 20, width = "100%", style = {} }) {
  return <div className="dh-skeleton" style={{ height, width, ...style }} />;
}

/* ─────────────────────────────────────────────
   HISTORY DASHBOARD
───────────────────────────────────────────── */
function HistoryDashboard({ hist }) {
  const [tab, setTab] = useState("strengths");

  if (!hist) return (
    <div className="dh-empty">
      <div>
        <div className="dh-empty-icon">📊</div>
        <div className="dh-empty-title">No history yet</div>
        <p className="dh-empty-sub">Run at least one analysis to start tracking your resume trends.</p>
      </div>
    </div>
  );

  const dColor = d => d > 0 ? GREEN : d < 0 ? CORAL : SLATE;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Summary strip */}
      <div className="dh-stat-strip">
        <StatCard icon="📈" label="Avg ATS Score"    value={`${hist.avgScores.ats}/100`}     colorClass={scoreCSSClass(hist.avgScores.ats)} sub={`across ${hist.total} analyses`} />
        <StatCard icon="🧠" label="Avg Skill Score"  value={`${hist.avgScores.skill}/100`}    colorClass="c-blue" />
        <StatCard icon="📄" label="Avg Resume Score" value={`${hist.avgScores.resume}/100`}   colorClass="c-purple" />
        <StatCard icon="💼" label="Avg Project Score" value={`${hist.avgScores.project}/100`} colorClass="c-cyan" />
      </div>

      <div className="dh-hist-grid">

        {/* ① ATS Score Trend */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <CardHead title="ATS Score Over Time" sub="How your resume score has evolved across all analyses" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hist.scoreTrend} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BLUE} stopOpacity={0.16} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 12, color: INK }}>{v}</span>} />
              <Area type="monotone" dataKey="atsScore"   name="ATS Score"   stroke={BLUE}   fill="url(#ag1)" strokeWidth={2.5} dot={{ r: 4, fill: BLUE,   strokeWidth: 0 }} />
              <Area type="monotone" dataKey="skillScore" name="Skill Score" stroke={PURPLE} fill="url(#ag2)" strokeWidth={2}   dot={{ r: 3, fill: PURPLE, strokeWidth: 0 }} strokeDasharray="5 3" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* ② Top Missing Skills */}
        <Card>
          <CardHead title="Top Missing Skills" sub="Skills you're repeatedly missing across job descriptions" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hist.topMissing} layout="vertical" margin={{ left: 8, right: 52, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="skill" width={88} tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" name="Times Missing" radius={[0, 6, 6, 0]} maxBarSize={18} fill={CORAL}>
                <LabelList dataKey="pct" position="right" formatter={v => `${v}%`} style={{ fontSize: 10, fill: CORAL, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* ③ Consistent Strengths */}
        <Card>
          <CardHead title="Consistent Strengths" sub="Skills you consistently match across different roles" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hist.topMatched} layout="vertical" margin={{ left: 8, right: 52, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="skill" width={88} tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Bar dataKey="count" name="Times Matched" radius={[0, 6, 6, 0]} maxBarSize={18} fill={GREEN}>
                <LabelList dataKey="pct" position="right" formatter={v => `${v}%`} style={{ fontSize: 10, fill: GREEN, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* ④ Improvement */}
        <Card>
          <CardHead title="Your Progress" sub="First analysis vs most recent — how far you've come" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hist.improvement} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: INK }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: INK }}>{v}</span>} />
              <Bar dataKey="before" name="First"   fill={SLATE + "88"} radius={[4, 4, 0, 0]} maxBarSize={26} />
              <Bar dataKey="after"  name="Latest"  fill={BLUE}         radius={[4, 4, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 12 }}>
            {hist.improvement.map(d => (
              <div key={d.name} className="dh-delta-badge"
                style={{ background: dColor(d.delta) + "14", border: `1px solid ${dColor(d.delta)}28`, color: dColor(d.delta) }}>
                {d.name}: {d.delta > 0 ? "+" : ""}{d.delta}
              </div>
            ))}
          </div>
        </Card>

        {/* ⑤ Score Breakdown Trend */}
        <Card>
          <CardHead title="Score Breakdown Trend" sub="All three score components tracked over time" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hist.scoreTrend} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: INK }}>{v}</span>} />
              <Line type="monotone" dataKey="resumeQualityScore"    name="Resume"   stroke={CYAN}   strokeWidth={2} dot={{ r: 3, fill: CYAN   }} />
              <Line type="monotone" dataKey="projectRelevanceScore" name="Projects" stroke={AMBER}  strokeWidth={2} dot={{ r: 3, fill: AMBER  }} />
              <Line type="monotone" dataKey="skillScore"            name="Skills"   stroke={PURPLE} strokeWidth={2} dot={{ r: 3, fill: PURPLE }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* ⑥ Recurring Insights */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <CardHead title="Recurring Insights" sub="Patterns the AI has noticed across all your feedback" />
          <div className="dh-tab-row">
            {[{ key: "strengths", label: "✅ Strengths" }, { key: "weaknesses", label: "⚠️ Weaknesses" }].map(t => (
              <button key={t.key} className={`dh-tab-btn${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
            ))}
          </div>
          {(tab === "strengths" ? hist.recurringStrengths : hist.recurringWeaknesses).map((item, i) => {
            const color = tab === "strengths" ? GREEN : AMBER;
            return (
              <div key={i} className="dh-hist-insight" style={{ background: color + "0d", border: `1px solid ${color}22` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 6 }} />
                  <span>{item.text}{item.text.length === 80 ? "…" : ""}</span>
                </div>
                <span className="dh-hist-badge" style={{ background: color + "1a", color, border: `1px solid ${color}30` }}>×{item.count}</span>
              </div>
            );
          })}
        </Card>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function DashboardHome({
  analysisData    = null,
  apiEndpoint     = null,
  historyData     = null,
  historyEndpoint = null,
}) {
  const [data,      setData]    = useState(null);
  const [hist,      setHist]    = useState(null);
  const [loading,   setLoading] = useState(false);
  const [error,     setError]   = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [mainTab,   setMainTab]   = useState("analysis");

  /* ── fetch current analysis ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (analysisData) { setData(transformApiData(analysisData)); return; }
    if (!apiEndpoint) return;
    setLoading(true);
    fetch(apiEndpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => { setData(transformApiData(json)); setLoading(false); })
      .catch(e  => { setError(e.message); setLoading(false); });
  }, [analysisData, apiEndpoint]);

  /* ── fetch history ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (historyData) { setHist(transformHistory(historyData)); return; }
    if (!historyEndpoint) return;
    fetch(historyEndpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => setHist(transformHistory(Array.isArray(json) ? json : json.analyses || [])))
      .catch(() => {});
  }, [historyData, historyEndpoint]);

  const hasAnalysis = !!data;
  const hasHistory  = !!hist;
  const showTabs    = hasAnalysis && hasHistory;

  /* ── Loading ── */
  if (loading) return (
    <div className="dh-root">
      <div style={{ padding: "28px 32px" }}>
        <div className="dh-stat-strip" style={{ marginBottom: 20 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="dh-card" style={{ gap: 10 }}>
              <Skeleton height={16} width="60%" />
              <Skeleton height={30} width="45%" />
            </div>
          ))}
        </div>
        <div className="dh-grid">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i}>
              <Skeleton height={14} width="50%" style={{ marginBottom: 10 }} />
              <Skeleton height={140} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="dh-root">
      <div className="dh-empty" style={{ color: CORAL }}>
        <div>
          <div className="dh-empty-icon">⚠️</div>
          <div className="dh-empty-title" style={{ color: CORAL }}>Failed to load analysis</div>
          <p className="dh-empty-sub">{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dh-root">

      {/* ── Page header ── */}
      <div className="dh-page-header">
        <div className="dh-page-title">
          {mainTab === "analysis" ? "Resume Analysis" : "History & Trends"}
        </div>
        <div className="dh-page-sub">
          {mainTab === "analysis"
            ? "Your latest ATS compatibility breakdown"
            : "Track your improvement across all analyses"}
        </div>
        {showTabs && (
          <div className="dh-main-tabs">
            {[
              { key: "analysis", label: "📄 Latest Analysis" },
              { key: "history",  label: "📊 History & Trends" },
            ].map(t => (
              <button key={t.key} className={`dh-main-tab${mainTab === t.key ? " active" : ""}`}
                onClick={() => setMainTab(t.key)}>{t.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="dh-body">

        {/* History view */}
        {(!hasAnalysis || mainTab === "history") && hasHistory && (
          <HistoryDashboard hist={hist} />
        )}

        {/* Empty state */}
        {!hasAnalysis && !hasHistory && (
          <div className="dh-empty">
            <div>
              <div className="dh-empty-icon">📄</div>
              <div className="dh-empty-title">No analysis yet</div>
              <p className="dh-empty-sub">Upload your resume and paste a job description to run your first ATS analysis.</p>
            </div>
          </div>
        )}

        {/* Current analysis view */}
        {hasAnalysis && (!showTabs || mainTab === "analysis") && (() => {
          const d = data;
          const pieData = [
            { name: "Matched", value: d.matchedSkills },
            { name: "Missing", value: d.missingSkills },
          ];

          return (
            <>
              {/* Stat strip */}
              <div className="dh-stat-strip">
                <StatCard icon="🎯" label="ATS Score"        value={`${d.atsScore}/100`}    colorClass={scoreCSSClass(d.atsScore)} />
                <StatCard icon="✅" label="Matched Skills"   value={d.matchedSkills}          colorClass="c-green" sub={`of ${d.totalRequired} required`} />
                <StatCard icon="🔑" label="Keyword Coverage" value={`${d.keywordDensity}%`}  colorClass="c-blue"  sub={`${d.foundKeywords}/${d.totalKeywords} found`} />
                <StatCard icon="⚠️" label="Missing Skills"   value={d.missingSkills}          colorClass="c-coral" sub="needs attention" />
              </div>

              <div className="dh-grid">

                {/* ① Gauge */}
                <Card className="g-gauge">
                  <CardHead title="ATS Score" sub="Overall compatibility with the job" />
                  <div className="dh-gauge-body">
                    <GaugeRing score={d.atsScore} />
                    <div className="dh-gauge-legend">
                      {[[CORAL, "< 50 Needs Work"], [AMBER, "50–75 Fair"], [GREEN, "> 75 Good"]].map(([c, l]) => (
                        <div key={l} className="dh-gauge-leg">
                          <span className="dh-gauge-dot" style={{ background: c }} />
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* ② Score Breakdown */}
                <Card className="g-breakdown">
                  <CardHead title="Score Breakdown" sub="Contribution of each component to your ATS score" />
                  <ResponsiveContainer width="100%" height={155}>
                    <BarChart data={d.breakdown} layout="vertical" margin={{ left: 8, right: 36 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: INK }} axisLine={false} tickLine={false} width={64} />
                      <Tooltip content={<CT />} />
                      <Bar dataKey="score" radius={[0, 7, 7, 0]} maxBarSize={22}>
                        {d.breakdown.map((_, i) => <Cell key={i} fill={[BLUE, CYAN, PURPLE][i % 3]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* ③ Skill Coverage Pie */}
                <Card className="g-pie">
                  <CardHead title="Skill Coverage" sub="Matched vs missing skills from the job description" />
                  <ResponsiveContainer width="100%" height={165}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                        paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Legend iconType="circle" iconSize={9} formatter={v => <span style={{ fontSize: 12, color: INK }}>{v}</span>} />
                      <Tooltip content={<CT />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* ④ Missing Skills Priority */}
                <Card className="g-priority">
                  <CardHead title="Missing Skills Priority" sub="Highest-impact gaps to close for a better score" />
                  {d.missingPriority.length === 0 ? (
                    <div style={{ textAlign: "center", color: GREEN, padding: "24px 0", fontSize: 14, fontWeight: 600 }}>
                      🎉 No critical skill gaps found!
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={155}>
                        <BarChart data={d.missingPriority} margin={{ left: 8, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CT />} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                            {d.missingPriority.map((e, i) => <Cell key={i} fill={PRIO_COLORS[e.priority]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        {Object.entries(PRIO_COLORS).map(([k, v]) => (
                          <span key={k} className="dh-prio-pill"
                            style={{ background: v + "14", color: v, border: `1px solid ${v}30` }}>{k}</span>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                {/* ⑤ Skill Categories */}
                {d.skillCategories.length > 0 && (
                  <Card className="g-categories">
                    <CardHead title="Skill Categories" sub="Distribution of related skills by category" />
                    <ResponsiveContainer width="100%" height={165}>
                      <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={78}
                        data={d.skillCategories.map((s, i) => ({ ...s, fill: CAT_COLORS[i % CAT_COLORS.length] }))}
                        startAngle={90} endAngle={-270}>
                        <RadialBar dataKey="value" cornerRadius={4} label={false} />
                        <Legend iconType="circle" iconSize={8} layout="vertical" align="right" verticalAlign="middle"
                          formatter={v => <span style={{ fontSize: 11, color: INK }}>{v}</span>} />
                        <Tooltip content={<CT />} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {/* ⑥ Section Quality */}
                <Card className="g-sections">
                  <CardHead title="Section Quality" sub="Per-component ATS readiness of your resume" />
                  {d.sectionQuality.map(s => <SectionBar key={s.name} {...s} />)}
                </Card>

                {/* ⑦ Keyword Density */}
                <Card className="g-keywords">
                  <CardHead title="Keyword Coverage" sub={`${d.foundKeywords} of ${d.totalKeywords} job description keywords found in your resume`} />
                  <div className="dh-kw-big">{d.keywordDensity}%</div>
                  <div className="dh-kw-track">
                    <div className="dh-kw-fill" style={{ width: d.keywordDensity + "%" }} />
                  </div>
                  <div className="dh-kw-chips">
                    {d.missingKeywords.slice(0, 12).map(kw => (
                      <span key={kw} className="dh-kw-chip">{kw}</span>
                    ))}
                  </div>
                  <p style={{ margin: "10px 0 0", fontSize: 11, color: SLATE }}>↑ Add these keywords to boost your ATS score</p>
                </Card>

                {/* ⑧ Semantic Matches */}
                {d.relatedSkills.length > 0 && (
                  <Card className="g-related">
                    <CardHead title="Semantic Matches" sub="Skills you have that partially satisfy job requirements" />
                    <div style={{ display: "flex", flexDirection: "column", maxHeight: 210, overflowY: "auto" }}>
                      {d.relatedSkills.slice(0, 8).map((rs, i) => (
                        <div key={i} className="dh-related-row">
                          <div>
                            <span style={{ color: CORAL, fontWeight: 600 }}>{rs.required}</span>
                            <span style={{ color: SLATE, margin: "0 6px" }}>→</span>
                            <span style={{ color: GREEN, fontWeight: 600 }}>{rs.resumeEquivalent}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {rs.category && (
                              <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 10,
                                background: PURPLE + "14", color: PURPLE }}>{rs.category}</span>
                            )}
                            <span style={{ color: AMBER, fontWeight: 700, fontSize: 11 }}>w:{rs.weight}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* ⑨ Matched Skills */}
                <Card className="g-matched">
                  <CardHead title="Matched Skills" sub={`${d.matchedSkills} skills aligned with the job description`} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {d.matchedSkillsList.map(sk => (
                      <span key={sk} className="dh-skill-chip">✓ {sk}</span>
                    ))}
                  </div>
                </Card>

                {/* ⑩ Insights */}
                <Card className="g-insights">
                  <CardHead title="AI Insights" sub="Strengths, gaps, and next steps from your analysis" />
                  <div className="dh-tab-row">
                    {[
                      { key: "overview",    label: "✅ Strengths" },
                      { key: "weaknesses",  label: "⚠️ Gaps"      },
                      { key: "suggestions", label: "💡 Tips"      },
                    ].map(t => (
                      <button key={t.key} className={`dh-tab-btn${activeTab === t.key ? " active" : ""}`}
                        onClick={() => setActiveTab(t.key)}>{t.label}</button>
                    ))}
                  </div>
                  {(activeTab === "overview"
                    ? d.strengths
                    : activeTab === "weaknesses"
                    ? d.weaknesses
                    : d.suggestions
                  ).map((s, i) => {
                    const color = activeTab === "overview" ? GREEN : activeTab === "weaknesses" ? AMBER : BLUE;
                    return (
                      <div key={i} className="dh-insight-item"
                        style={{ background: color + "0d", border: `1px solid ${color}20` }}>
                        <span className="dh-insight-dot" style={{ background: color }} />
                        {s}
                      </div>
                    );
                  })}
                </Card>

              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}