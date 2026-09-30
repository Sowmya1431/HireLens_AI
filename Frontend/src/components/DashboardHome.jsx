import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
  AreaChart, Area, LabelList
} from "recharts";
import "./Dashboardhome.css";

/* ─────────────────────────────────────────────
   HIRELENS AI PALETTE & TOKENS
───────────────────────────────────────────── */
const CYAN = "#4cc9ff";
const BLUE = "#0084ff";
const PURPLE = "#7b61ff";
const GREEN = "#00c896";
const AMBER = "#f5a623";
const CORAL = "#ff5e6c";
const SLATE = "#94a3b8";

const CAT_COLORS = [CYAN, BLUE, PURPLE, GREEN, AMBER, CORAL];

/* ─────────────────────────────────────────────
   HELPERS & SCORING
───────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 75) return GREEN;
  if (s >= 50) return AMBER;
  return CORAL;
}

function scoreLabel(s) {
  if (s >= 80) return "Excellent Match";
  if (s >= 65) return "Good Fit";
  if (s >= 50) return "Fair Potential";
  return "Needs Optimization";
}

function formatSafeText(val) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.text || val.point || val.suggestion || JSON.stringify(val);
  return String(val);
}

/* ─────────────────────────────────────────────
   TRANSFORMS
───────────────────────────────────────────── */
function transformApiData(api) {
  if (!api) return null;

  const categoryMap = {};
  (api.relatedSkills || []).forEach(({ category }) => {
    if (!category) return;
    const cat = category.trim();
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  if (Object.keys(categoryMap).length === 0) {
    (api.requiredSkillsDetailed || []).forEach(({ importance }) => {
      const cat = importance ? (importance.charAt(0).toUpperCase() + importance.slice(1)) : "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
  }
  const skillCategories = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const missingSet = new Set(api.missingSkills || []);
  const missingPriority = (api.requiredSkillsDetailed || [])
    .filter(s => missingSet.has(s.skill))
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, 8)
    .map(s => ({
      name: s.skill,
      priority: s.importance === "critical" ? "High" : s.importance === "preferred" ? "Medium" : "Low",
      value: Math.round((s.weight || 1) * 10) / 10,
    }));

  const breakdown = [
    { name: "Skills Match", score: Math.round(api.skillScore ?? 0) },
    { name: "Resume Quality", score: Math.round(((api.resumeQualityScore ?? 0) / 20) * 100) },
    { name: "Project Relevance", score: Math.round(((api.projectRelevanceScore ?? 0) / 20) * 100) },
  ];

  const totalKeywords = (api.requiredSkillsNormalized || []).length || ((api.matchedSkills || []).length + (api.missingSkills || []).length);
  const foundKeywords = (api.matchedSkills || []).length;
  const keywordDensity = totalKeywords ? Math.round((foundKeywords / totalKeywords) * 100) : 0;

  return {
    atsScore: api.atsScore ?? 0,
    skillScore: api.skillScore ?? 0,
    resumeQualityScore: api.resumeQualityScore ?? 0,
    projectRelevanceScore: api.projectRelevanceScore ?? 0,
    matchedSkillsCount: foundKeywords,
    missingSkillsCount: (api.missingSkills || []).length,
    totalRequired: totalKeywords,
    keywordDensity,
    breakdown,
    missingPriority,
    skillCategories,
    missingKeywords: api.missingSkills || [],
    strengths: (api.strengths || []).map(formatSafeText),
    weaknesses: (api.weaknesses || []).map(formatSafeText),
    suggestions: (api.suggestions || []).map(formatSafeText),
    matchedSkillsList: api.matchedSkills || [],
    relatedSkills: api.relatedSkills || [],
    resumeSkillsNormalized: api.resumeSkillsNormalized || [],
    requiredSkillsNormalized: api.requiredSkillsNormalized || [],
    createdAt: api.createdAt || new Date().toISOString(),
  };
}

/* ─────────────────────────────────────────────
   CUSTOM DASHBOARD TOOLTIP (WHITE/LIGHT THEME)
───────────────────────────────────────────── */
const DashboardTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="dh-tooltip">
      <div className="dh-tooltip-header">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="dh-tooltip-row">
          <span className="dh-tooltip-dot" style={{ background: p.color || p.fill }} />
          <span className="dh-tooltip-name">{p.name}:</span>
          <span className="dh-tooltip-val">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function DashboardHome({
  analysisData = null,
  apiEndpoint = null,
  historyData = null,
  historyEndpoint = null,
  onNavigate = () => { },
}) {
  const [data, setData] = useState(null);
  const [rawAnalyses, setRawAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive controls
  const [mainTab, setMainTab] = useState("overview");     // overview | history | skills | insights
  const [timeRange, setTimeRange] = useState("all");          // all | 5 | 10
  const [trendMetric, setTrendMetric] = useState("all");          // all | ats | skill | breakdown
  const [skillFilter, setSkillFilter] = useState("all");          // all | matched | missing
  const [skillSearch, setSkillSearch] = useState("");
  const [insightTab, setInsightTab] = useState("strengths");    // strengths | weaknesses | suggestions
  const [copiedIndex, setCopiedIndex] = useState(null);

  /* ── Initial Load & Fetching ── */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. If explicit analysisData provided
      if (analysisData) {
        setData(transformApiData(analysisData));
      }

      // 2. Fetch history endpoint
      let histJson = null;
      if (historyEndpoint) {
        try {
          const res = await fetch(historyEndpoint, { headers });
          if (res.ok) {
            histJson = await res.json();
            const list = Array.isArray(histJson) ? histJson : (histJson.analyses || []);
            setRawAnalyses(list);

            // Auto-populate latest analysis from history if data not yet loaded
            if (!analysisData && histJson.latestAnalysis) {
              setData(transformApiData(histJson.latestAnalysis));
            } else if (!analysisData && list.length > 0) {
              setData(transformApiData(list[list.length - 1]));
            }
          }
        } catch (hErr) {
          console.warn("History fetch issue:", hErr);
        }
      }

      // 3. If latest analysis endpoint provided and no data yet
      if (!analysisData && !data && apiEndpoint) {
        try {
          const aRes = await fetch(apiEndpoint, { headers });
          if (aRes.ok) {
            const aJson = await aRes.json();
            setData(transformApiData(aJson));
          }
        } catch (aErr) {
          console.warn("Latest analysis fetch issue:", aErr);
        }
      }

    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [analysisData, apiEndpoint, historyEndpoint]);

  /* ── Interactive Analytics Computation ── */
  const analytics = useMemo(() => {
    if (!rawAnalyses || rawAnalyses.length === 0) {
      // If we only have latest analysis data
      if (data) {
        return {
          total: 1,
          avgAtsScore: data.atsScore,
          avgSkillScore: data.skillScore,
          avgResumeScore: data.resumeQualityScore,
          avgProjectScore: data.projectRelevanceScore,
          avgMatchedSkills: data.matchedSkillsCount,
          avgMissingSkills: data.missingSkillsCount,
          avgSkillMatchPct: data.keywordDensity,
          highestAts: data.atsScore,
          lowestAts: data.atsScore,
          latestAts: data.atsScore,
          scoreTrend: [{
            label: "Scan #1",
            date: new Date(data.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            atsScore: data.atsScore,
            skillScore: data.skillScore,
            resumeQualityScore: Math.round(((data.resumeQualityScore || 0) / 20) * 100),
            projectRelevanceScore: Math.round(((data.projectRelevanceScore || 0) / 20) * 100),
            matchedSkills: data.matchedSkillsCount,
            missingSkills: data.missingSkillsCount,
          }],
          topMissing: (data.missingKeywords || []).map(s => ({ skill: s, count: 1, pct: 100 })),
          topMatched: (data.matchedSkillsList || []).map(s => ({ skill: s, count: 1, pct: 100 })),
          recurringStrengths: (data.strengths || []).map(text => ({ text, count: 1 })),
          recurringWeaknesses: (data.weaknesses || []).map(text => ({ text, count: 1 })),
          recurringSuggestions: (data.suggestions || []).map(text => ({ text, count: 1 })),
          improvement: [],
        };
      }
      return null;
    }

    // Sort chronologically
    const sorted = [...rawAnalyses].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Apply interactive Time Range filter
    let sliced = sorted;
    if (timeRange === "5") sliced = sorted.slice(-5);
    else if (timeRange === "10") sliced = sorted.slice(-10);

    const count = sliced.length;
    const calcAvg = key => Math.round(sliced.reduce((sum, item) => sum + (item[key] ?? 0), 0) / count);

    // Exact skill averages
    const totalMatchedCount = sliced.reduce((s, a) => s + (a.matchedSkills?.length || 0), 0);
    const totalMissingCount = sliced.reduce((s, a) => s + (a.missingSkills?.length || 0), 0);
    const avgMatchedSkills = Number((totalMatchedCount / count).toFixed(1));
    const avgMissingSkills = Number((totalMissingCount / count).toFixed(1));
    const totalSkillsSum = totalMatchedCount + totalMissingCount;
    const avgSkillMatchPct = totalSkillsSum > 0 ? Math.round((totalMatchedCount / totalSkillsSum) * 100) : 0;

    const allAts = sliced.map(a => a.atsScore ?? 0);
    const highestAts = allAts.length ? Math.max(...allAts) : 0;
    const lowestAts = allAts.length ? Math.min(...allAts) : 0;
    const latestAts = sorted[sorted.length - 1]?.atsScore ?? 0;

    // Trend chart points
    const scoreTrend = sliced.map((a, i) => ({
      label: `Scan #${sorted.indexOf(a) + 1}`,
      date: new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      atsScore: a.atsScore ?? 0,
      skillScore: a.skillScore ?? 0,
      resumeQualityScore: Math.round(((a.resumeQualityScore ?? 0) / 20) * 100),
      projectRelevanceScore: Math.round(((a.projectRelevanceScore ?? 0) / 20) * 100),
      matchedSkills: (a.matchedSkills || []).length,
      missingSkills: (a.missingSkills || []).length,
    }));

    // Frequency aggregations
    const missingFreq = {};
    sliced.forEach(a => (a.missingSkills || []).forEach(sk => { missingFreq[sk] = (missingFreq[sk] || 0) + 1; }));
    const topMissing = Object.entries(missingFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, c]) => ({ skill, count: c, pct: Math.round((c / count) * 100) }));

    const matchedFreq = {};
    sliced.forEach(a => (a.matchedSkills || []).forEach(sk => { matchedFreq[sk] = (matchedFreq[sk] || 0) + 1; }));
    const topMatched = Object.entries(matchedFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, c]) => ({ skill, count: c, pct: Math.round((c / count) * 100) }));

    const strFreq = {};
    sliced.forEach(a => (a.strengths || []).forEach(s => {
      const clean = formatSafeText(s).slice(0, 95);
      strFreq[clean] = (strFreq[clean] || 0) + 1;
    }));
    const recurringStrengths = Object.entries(strFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([text, c]) => ({ text, count: c }));

    const weakFreq = {};
    sliced.forEach(a => (a.weaknesses || []).forEach(w => {
      const clean = formatSafeText(w).slice(0, 95);
      weakFreq[clean] = (weakFreq[clean] || 0) + 1;
    }));
    const recurringWeaknesses = Object.entries(weakFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([text, c]) => ({ text, count: c }));

    const sugFreq = {};
    sliced.forEach(a => (a.suggestions || []).forEach(sg => {
      const clean = formatSafeText(sg).slice(0, 95);
      sugFreq[clean] = (sugFreq[clean] || 0) + 1;
    }));
    const recurringSuggestions = Object.entries(sugFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([text, c]) => ({ text, count: c }));

    // First vs Latest Improvement
    const firstItem = sorted[0];
    const lastItem = sorted[sorted.length - 1];
    const improvement = count > 1 ? [
      { name: "ATS Score", before: firstItem.atsScore ?? 0, after: lastItem.atsScore ?? 0 },
      { name: "Skill Match", before: firstItem.skillScore ?? 0, after: lastItem.skillScore ?? 0 },
      { name: "Resume Score", before: Math.round(((firstItem.resumeQualityScore ?? 0) / 20) * 100), after: Math.round(((lastItem.resumeQualityScore ?? 0) / 20) * 100) },
      { name: "Projects", before: Math.round(((firstItem.projectRelevanceScore ?? 0) / 20) * 100), after: Math.round(((lastItem.projectRelevanceScore ?? 0) / 20) * 100) },
    ].map(d => ({ ...d, delta: d.after - d.before })) : [];

    return {
      total: sorted.length,
      filteredCount: count,
      avgAtsScore: calcAvg("atsScore"),
      avgSkillScore: calcAvg("skillScore"),
      avgResumeScore: Math.round(((calcAvg("resumeQualityScore") || 0) / 20) * 100),
      avgProjectScore: Math.round(((calcAvg("projectRelevanceScore") || 0) / 20) * 100),
      avgMatchedSkills,
      avgMissingSkills,
      avgSkillMatchPct,
      highestAts,
      lowestAts,
      latestAts,
      scoreTrend,
      topMissing,
      topMatched,
      recurringStrengths,
      recurringWeaknesses,
      recurringSuggestions,
      improvement,
    };
  }, [rawAnalyses, data, timeRange]);

  /* ── Filtered Skills List for Explorer Tab ── */
  const filteredSkills = useMemo(() => {
    if (!analytics) return [];
    let list = [];

    if (skillFilter === "all" || skillFilter === "matched") {
      analytics.topMatched.forEach(item => {
        list.push({ ...item, type: "matched" });
      });
    }
    if (skillFilter === "all" || skillFilter === "missing") {
      analytics.topMissing.forEach(item => {
        list.push({ ...item, type: "missing" });
      });
    }

    if (skillSearch.trim()) {
      const q = skillSearch.toLowerCase();
      list = list.filter(item => item.skill.toLowerCase().includes(q));
    }

    return list;
  }, [analytics, skillFilter, skillSearch]);

  const handleCopyInsight = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className="dh-root">
        <div className="dh-body">
          <div className="dh-header-skeleton">
            <div className="dh-sk-line" style={{ width: "240px", height: "30px", marginBottom: "8px" }} />
            <div className="dh-sk-line" style={{ width: "380px", height: "16px" }} />
          </div>
          <div className="dh-stat-strip">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="dh-stat-card dh-sk-card">
                <div className="dh-sk-circle" />
                <div style={{ flex: 1 }}>
                  <div className="dh-sk-line" style={{ width: "50%", height: "24px", marginBottom: "6px" }} />
                  <div className="dh-sk-line" style={{ width: "70%", height: "14px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Error State ── */
  if (error && !analytics) {
    return (
      <div className="dh-root">
        <div className="dh-empty-state">
          <div className="dh-empty-icon">⚠️</div>
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
          <button className="dh-btn-primary" onClick={fetchData}>
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  /* ── Zero State (No scans yet) ── */
  if (!analytics) {
    return (
      <div className="dh-root">
        <div className="dh-empty-state">
          <div className="dh-empty-icon">🎯</div>
          <h2>Welcome to HireLens AI Dashboard</h2>
          <p>
            You haven't run any resume analyses yet. Upload your resume and paste a job description
            to unlock your personalized ATS compatibility insights and trends.
          </p>
          <button className="dh-btn-primary" onClick={() => onNavigate("ats")}>
            🚀 Run Your First ATS Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dh-root">

      {/* ── TOP HERO BAR ── */}
      <div className="dh-hero-bar">
        <div className="dh-hero-left">
          <div className="dh-hero-pill">⚡ Interactive ATS Intelligence</div>
          <h1 className="dh-hero-title">Candidate Performance Hub</h1>
          <p className="dh-hero-sub">
            Tracking {analytics.total} resume {analytics.total === 1 ? "scan" : "scans"} with real-time scoring, skill matching, and actionable AI guidance.
          </p>
        </div>

        <div className="dh-hero-actions">
          <button className="dh-btn-secondary" onClick={() => onNavigate("optimize")}>
            ✨ Optimize Resume
          </button>
          <button className="dh-btn-primary" onClick={() => onNavigate("ats")}>
            + Run New ATS Scan
          </button>
          <button className="dh-btn-icon" onClick={fetchData} title="Refresh Analytics">
            🔄
          </button>
        </div>
      </div>

      {/* ── MAIN INTERACTIVE NAVIGATION TABS ── */}
      <div className="dh-nav-bar">
        <div className="dh-nav-tabs">
          {[
            { key: "overview", label: "📊 Executive Overview", icon: "📊" },
            { key: "history", label: "📈 Progression Trends", icon: "📈" },
            { key: "skills", label: "🛠 Skills Intelligence", icon: "🛠" },
            { key: "insights", label: "💡 AI Strategic Plan", icon: "💡" },
          ].map(t => (
            <button
              key={t.key}
              className={`dh-nav-tab ${mainTab === t.key ? "active" : ""}`}
              onClick={() => setMainTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Time range interactive pills (visible across tabs) */}
        {analytics.total > 1 && (
          <div className="dh-range-selector">
            <span className="dh-range-label">Range:</span>
            {[
              { key: "all", label: `All (${analytics.total})` },
              { key: "10", label: "Last 10" },
              { key: "5", label: "Last 5" },
            ].map(r => (
              <button
                key={r.key}
                className={`dh-range-btn ${timeRange === r.key ? "active" : ""}`}
                onClick={() => setTimeRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="dh-body">

        {/* ══════════════════════════════════════════
           KEY METRIC SUMMARY STRIP (ACCURATE AVERAGES)
        ══════════════════════════════════════════ */}
        <div className="dh-stat-strip">

          {/* 1. Avg ATS Score */}
          <div className="dh-stat-card glow-cyan">
            <div className="dh-stat-icon-wrap icon-cyan">🎯</div>
            <div className="dh-stat-content">
              <div className="dh-stat-top">
                <span className="dh-stat-val val-cyan">{analytics.avgAtsScore}</span>
                <span className="dh-stat-denom">/100</span>
                <span className="dh-stat-badge" style={{ color: scoreColor(analytics.avgAtsScore) }}>
                  {scoreLabel(analytics.avgAtsScore)}
                </span>
              </div>
              <div className="dh-stat-label">Average ATS Score</div>
              <div className="dh-stat-sub">
                Best: <b style={{ color: CYAN }}>{analytics.highestAts}</b> · Latest: <b>{analytics.latestAts}</b>
              </div>
            </div>
          </div>

          {/* 2. Avg Matched Skills */}
          <div className="dh-stat-card glow-green">
            <div className="dh-stat-icon-wrap icon-green">✅</div>
            <div className="dh-stat-content">
              <div className="dh-stat-top">
                <span className="dh-stat-val val-green">{analytics.avgMatchedSkills}</span>
                <span className="dh-stat-denom">skills</span>
                <span className="dh-stat-badge tag-green">{analytics.avgSkillMatchPct}% Match</span>
              </div>
              <div className="dh-stat-label">Avg. Skills Matched</div>
              <div className="dh-stat-sub">
                {analytics.topMatched.length} unique matched technologies
              </div>
            </div>
          </div>

          {/* 3. Avg Missing Skills */}
          <div className="dh-stat-card glow-coral">
            <div className="dh-stat-icon-wrap icon-coral">⚠️</div>
            <div className="dh-stat-content">
              <div className="dh-stat-top">
                <span className="dh-stat-val val-coral">{analytics.avgMissingSkills}</span>
                <span className="dh-stat-denom">gaps</span>
                <span className="dh-stat-badge tag-coral">{analytics.topMissing.length} Key Gaps</span>
              </div>
              <div className="dh-stat-label">Avg. Missing Keywords</div>
              <div className="dh-stat-sub">
                High-priority role requirements to bridge
              </div>
            </div>
          </div>

          {/* 4. Resume Quality & Project Relevance */}
          <div className="dh-stat-card glow-purple">
            <div className="dh-stat-icon-wrap icon-purple">📋</div>
            <div className="dh-stat-content">
              <div className="dh-stat-top">
                <span className="dh-stat-val val-purple">{analytics.avgResumeScore}%</span>
                <span className="dh-stat-denom">quality</span>
                <span className="dh-stat-badge tag-purple">{analytics.avgProjectScore}% Projects</span>
              </div>
              <div className="dh-stat-label">Resume & Project Index</div>
              <div className="dh-stat-sub">
                ATS format structure & measurable impact
              </div>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════
           TAB 1: EXECUTIVE OVERVIEW
        ══════════════════════════════════════════ */}
        {mainTab === "overview" && (
          <div className="dh-grid-layout">

            {/* Left: Score Gauge & Breakdown */}
            <div className="dh-card dh-card-accent">
              <div className="dh-card-head">
                <h3 className="dh-card-title">Overall Compatibility Rating</h3>
                <span className="dh-card-sub">Weighted blend of skills, resume depth, and project relevance</span>
              </div>

              <div className="dh-gauge-wrapper">
                <svg viewBox="0 0 200 120" className="dh-gauge-svg">
                  <path
                    d="M 20 105 A 80 80 0 0 1 180 105"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 20 105 A 80 80 0 0 1 180 105"
                    fill="none"
                    stroke={scoreColor(analytics.avgAtsScore)}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (analytics.avgAtsScore / 100))}
                    style={{ transition: "stroke-dashoffset 1.2s ease" }}
                  />
                  <text x="100" y="85" textAnchor="middle" className="dh-gauge-text">
                    {analytics.avgAtsScore}
                  </text>
                  <text x="100" y="105" textAnchor="middle" className="dh-gauge-subtext">
                    AVG ATS SCORE
                  </text>
                </svg>

                <div className="dh-score-metrics-row">
                  <div className="dh-metric-col">
                    <span className="dh-m-val" style={{ color: BLUE }}>{analytics.avgSkillScore}/60</span>
                    <span className="dh-m-lbl">Skill Score</span>
                  </div>
                  <div className="dh-metric-col">
                    <span className="dh-m-val" style={{ color: GREEN }}>{analytics.avgResumeScore}%</span>
                    <span className="dh-m-lbl">Format Quality</span>
                  </div>
                  <div className="dh-metric-col">
                    <span className="dh-m-val" style={{ color: CYAN }}>{analytics.avgProjectScore}%</span>
                    <span className="dh-m-lbl">Project Impact</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Performance Trend */}
            <div className="dh-card dh-card-span2">
              <div className="dh-card-head flex-between">
                <div>
                  <h3 className="dh-card-title">Score Trajectory Across Scans</h3>
                  <span className="dh-card-sub">Performance history across your uploaded resumes</span>
                </div>
                <div className="dh-card-tag">
                  {analytics.scoreTrend.length} Data {analytics.scoreTrend.length === 1 ? "Point" : "Points"}
                </div>
              </div>

              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <AreaChart data={analytics.scoreTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CYAN} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={CYAN} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BLUE} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={BLUE} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DashboardTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="atsScore"
                      name="ATS Score"
                      stroke={CYAN}
                      strokeWidth={2.5}
                      fill="url(#cyanGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="skillScore"
                      name="Skill Match"
                      stroke={BLUE}
                      strokeWidth={2}
                      fill="url(#blueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Left: In-Demand Matched Skills */}
            <div className="dh-card">
              <div className="dh-card-head">
                <h3 className="dh-card-title">Top Matched Strengths</h3>
                <span className="dh-card-sub">Technologies you consistently match across roles</span>
              </div>
              <div className="dh-skill-pills-wrap">
                {analytics.topMatched.length > 0 ? (
                  analytics.topMatched.slice(0, 8).map(sk => (
                    <div key={sk.skill} className="dh-chip-matched">
                      <span className="dh-chip-check">✓</span>
                      <span className="dh-chip-name">{sk.skill}</span>
                      <span className="dh-chip-badge">{sk.pct}%</span>
                    </div>
                  ))
                ) : (
                  <p className="dh-empty-note">Run an ATS analysis to populate matched skills.</p>
                )}
              </div>
            </div>

            {/* Bottom Mid: Critical Gaps */}
            <div className="dh-card">
              <div className="dh-card-head">
                <h3 className="dh-card-title">Top Skill Gaps to Bridge</h3>
                <span className="dh-card-sub">High-frequency missing requirements from job postings</span>
              </div>
              <div className="dh-skill-pills-wrap">
                {analytics.topMissing.length > 0 ? (
                  analytics.topMissing.slice(0, 8).map(sk => (
                    <div key={sk.skill} className="dh-chip-missing">
                      <span className="dh-chip-cross">✗</span>
                      <span className="dh-chip-name">{sk.skill}</span>
                      <span className="dh-chip-badge coral">{sk.pct}%</span>
                    </div>
                  ))
                ) : (
                  <p className="dh-empty-note">No recurring skill gaps detected!</p>
                )}
              </div>
            </div>

            {/* Bottom Right: Quick AI Recommendations */}
            <div className="dh-card">
              <div className="dh-card-head flex-between">
                <div>
                  <h3 className="dh-card-title">Strategic Action Items</h3>
                  <span className="dh-card-sub">Immediate steps to optimize your resume</span>
                </div>
                <button className="dh-card-link-btn" onClick={() => setMainTab("insights")}>
                  View All →
                </button>
              </div>
              <div className="dh-mini-insights-list">
                {(analytics.recurringSuggestions.length > 0
                  ? analytics.recurringSuggestions.slice(0, 3)
                  : (data?.suggestions || []).slice(0, 3).map(text => ({ text }))
                ).map((s, idx) => (
                  <div key={idx} className="dh-mini-insight">
                    <span className="dh-mini-dot" />
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════
           TAB 2: PROGRESSION & TRENDS
        ══════════════════════════════════════════ */}
        {mainTab === "history" && (
          <div className="dh-tab-section">

            {/* Interactive Trend Chart Card */}
            <div className="dh-card" style={{ marginBottom: "20px" }}>
              <div className="dh-card-head flex-between">
                <div>
                  <h3 className="dh-card-title">Historical ATS Score & Category Progression</h3>
                  <span className="dh-card-sub">Track how your score components evolve as you update your resume</span>
                </div>

                {/* Metric toggle controls */}
                <div className="dh-metric-filters">
                  {[
                    { key: "all", label: "All Metrics" },
                    { key: "ats", label: "ATS Score Only" },
                    { key: "breakdown", label: "Sub-Scores" },
                  ].map(m => (
                    <button
                      key={m.key}
                      className={`dh-filter-btn ${trendMetric === m.key ? "active" : ""}`}
                      onClick={() => setTrendMetric(m.key)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={analytics.scoreTrend} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DashboardTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: "14px", fontSize: "12px" }}
                      formatter={(v) => <span style={{ color: "#334155", fontWeight: 600 }}>{v}</span>}
                    />

                    {(trendMetric === "all" || trendMetric === "ats") && (
                      <Line
                        type="monotone"
                        dataKey="atsScore"
                        name="ATS Overall"
                        stroke={CYAN}
                        strokeWidth={3}
                        dot={{ r: 4, fill: CYAN }}
                        activeDot={{ r: 7 }}
                      />
                    )}

                    {(trendMetric === "all" || trendMetric === "breakdown") && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="skillScore"
                          name="Skill Match"
                          stroke={BLUE}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3, fill: BLUE }}
                        />
                        <Line
                          type="monotone"
                          dataKey="resumeQualityScore"
                          name="Resume Quality"
                          stroke={GREEN}
                          strokeWidth={2}
                          dot={{ r: 3, fill: GREEN }}
                        />
                        <Line
                          type="monotone"
                          dataKey="projectRelevanceScore"
                          name="Project Impact"
                          stroke={PURPLE}
                          strokeWidth={2}
                          dot={{ r: 3, fill: PURPLE }}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Improvement / Comparison Strip */}
            {analytics.improvement && analytics.improvement.length > 0 && (
              <div className="dh-card">
                <div className="dh-card-head">
                  <h3 className="dh-card-title">Progress Benchmark (First vs. Latest Resume)</h3>
                  <span className="dh-card-sub">Measurable improvements achieved across your analysis history</span>
                </div>

                <div className="dh-improvement-grid">
                  {analytics.improvement.map(item => {
                    const isPositive = item.delta > 0;
                    const isNeutral = item.delta === 0;
                    return (
                      <div key={item.name} className="dh-imp-card">
                        <div className="dh-imp-name">{item.name}</div>
                        <div className="dh-imp-row">
                          <span className="dh-imp-before">{item.before}</span>
                          <span className="dh-imp-arrow">→</span>
                          <span className="dh-imp-after">{item.after}</span>
                        </div>
                        <div className={`dh-imp-delta ${isPositive ? "positive" : isNeutral ? "neutral" : "negative"}`}>
                          {isPositive ? `+${item.delta} pts` : isNeutral ? "No Change" : `${item.delta} pts`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════
           TAB 3: SKILLS INTELLIGENCE
        ══════════════════════════════════════════ */}
        {mainTab === "skills" && (
          <div className="dh-tab-section">

            {/* Skills Explorer Controls */}
            <div className="dh-card" style={{ marginBottom: "20px" }}>
              <div className="dh-skills-toolbar">
                <div className="dh-search-wrap">
                  <span className="dh-search-icon">🔍</span>
                  <input
                    type="text"
                    className="dh-search-input"
                    placeholder="Search any skill (e.g. React, Docker, Python)..."
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                  />
                  {skillSearch && (
                    <button className="dh-search-clear" onClick={() => setSkillSearch("")}>✕</button>
                  )}
                </div>

                <div className="dh-pill-filters">
                  {[
                    { key: "all", label: "All Skills" },
                    { key: "matched", label: "✅ Matched Only" },
                    { key: "missing", label: "❌ Missing Only" },
                  ].map(pf => (
                    <button
                      key={pf.key}
                      className={`dh-pill-btn ${skillFilter === pf.key ? "active" : ""}`}
                      onClick={() => setSkillFilter(pf.key)}
                    >
                      {pf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of skills */}
              <div className="dh-interactive-skills-grid">
                {filteredSkills.length > 0 ? (
                  filteredSkills.map((sk, i) => (
                    <div
                      key={i}
                      className={`dh-int-skill-card ${sk.type === "matched" ? "is-matched" : "is-missing"}`}
                    >
                      <div className="dh-sk-card-top">
                        <span className="dh-sk-icon">{sk.type === "matched" ? "✓" : "✗"}</span>
                        <span className="dh-sk-title">{sk.skill}</span>
                      </div>
                      <div className="dh-sk-meta">
                        <span>{sk.type === "matched" ? "Appeared in" : "Missing in"}</span>
                        <b>{sk.count} {sk.count === 1 ? "job" : "jobs"} ({sk.pct}%)</b>
                      </div>
                      <div className="dh-sk-bar">
                        <div
                          className="dh-sk-bar-fill"
                          style={{
                            width: `${sk.pct}%`,
                            background: sk.type === "matched" ? GREEN : CORAL,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="dh-no-results">
                    No skills found matching "<b>{skillSearch}</b>"
                  </div>
                )}
              </div>
            </div>

            {/* Charts: Matched vs Missing Distribution */}
            <div className="dh-two-col">
              <div className="dh-card">
                <div className="dh-card-head">
                  <h3 className="dh-card-title">Top 8 Technologies Present in Your Resume</h3>
                  <span className="dh-card-sub">Frequency of technology matches</span>
                </div>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={analytics.topMatched.slice(0, 8)}
                      layout="vertical"
                      margin={{ left: 16, right: 30, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="skill" width={90} tick={{ fill: "#0f172a", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DashboardTooltip />} />
                      <Bar dataKey="count" name="Times Matched" radius={[0, 6, 6, 0]} maxBarSize={16} fill={GREEN}>
                        <LabelList dataKey="pct" position="right" formatter={v => `${v}%`} style={{ fill: GREEN, fontSize: 10, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="dh-card">
                <div className="dh-card-head">
                  <h3 className="dh-card-title">Top 8 Technologies Missing from Resume</h3>
                  <span className="dh-card-sub">Keywords repeatedly requested by recruiters</span>
                </div>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={analytics.topMissing.slice(0, 8)}
                      layout="vertical"
                      margin={{ left: 16, right: 30, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="skill" width={90} tick={{ fill: "#0f172a", fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DashboardTooltip />} />
                      <Bar dataKey="count" name="Times Missing" radius={[0, 6, 6, 0]} maxBarSize={16} fill={CORAL}>
                        <LabelList dataKey="pct" position="right" formatter={v => `${v}%`} style={{ fill: CORAL, fontSize: 10, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════
           TAB 4: AI STRATEGIC PLAN & RECOMMENDATIONS
        ══════════════════════════════════════════ */}
        {mainTab === "insights" && (
          <div className="dh-tab-section">

            <div className="dh-card">
              <div className="dh-card-head flex-between">
                <div>
                  <h3 className="dh-card-title">AI Action Plan & Qualitative Findings</h3>
                  <span className="dh-card-sub">Synthesized feedback across your job targeting journey</span>
                </div>

                <div className="dh-sub-tabs">
                  {[
                    { key: "strengths", label: "💪 Key Strengths", count: analytics.recurringStrengths.length },
                    { key: "weaknesses", label: "⚠️ Detected Gaps", count: analytics.recurringWeaknesses.length },
                    { key: "suggestions", label: "💡 Actionable Tips", count: analytics.recurringSuggestions.length },
                  ].map(st => (
                    <button
                      key={st.key}
                      className={`dh-sub-tab ${insightTab === st.key ? "active" : ""}`}
                      onClick={() => setInsightTab(st.key)}
                    >
                      {st.label} {st.count > 0 && <span className="dh-sub-count">{st.count}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Insights List */}
              <div className="dh-insights-deck">
                {(() => {
                  const list = insightTab === "strengths"
                    ? analytics.recurringStrengths
                    : insightTab === "weaknesses"
                      ? analytics.recurringWeaknesses
                      : analytics.recurringSuggestions;

                  const fallbackList = insightTab === "strengths"
                    ? (data?.strengths || ["Demonstrates solid foundational alignment in core software development technologies."]).map(text => ({ text, count: 1 }))
                    : insightTab === "weaknesses"
                      ? (data?.weaknesses || ["Missing specific role technologies mentioned in the job description."]).map(text => ({ text, count: 1 }))
                      : (data?.suggestions || ["Quantify project bullet points with concrete latency, scale, and performance metrics."]).map(text => ({ text, count: 1 }));

                  const displayList = list.length > 0 ? list : fallbackList;

                  const accentColor = insightTab === "strengths" ? GREEN : insightTab === "weaknesses" ? AMBER : CYAN;

                  return displayList.map((item, idx) => (
                    <div
                      key={idx}
                      className="dh-insight-card"
                      style={{ borderLeft: `3px solid ${accentColor}` }}
                    >
                      <div className="dh-insight-body">
                        <span className="dh-insight-bullet" style={{ background: accentColor }} />
                        <p className="dh-insight-text">{item.text}</p>
                      </div>

                      <div className="dh-insight-actions">
                        {item.count > 1 && (
                          <span className="dh-freq-badge">Seen in {item.count} scans</span>
                        )}
                        <button
                          className="dh-copy-btn"
                          onClick={() => handleCopyInsight(item.text, idx)}
                          title="Copy to clipboard"
                        >
                          {copiedIndex === idx ? "✓ Copied" : "📋 Copy"}
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}