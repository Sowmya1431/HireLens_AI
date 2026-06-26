import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  PieChart, Pie
} from "recharts";
import "./ATSAnalyzer.css";

const API = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────
   GAUGE – animated semicircle (Image 2)
───────────────────────────────────────── */
function GaugeChart({ score }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let current = 0;

    const animate = () => {
      current = 0;

      const timer = setInterval(() => {
        current += 1;
        setDisplayScore(current);

        if (current >= score) {
          clearInterval(timer);

          setTimeout(() => {
            animate(); // repeat every 1 sec
          }, 1000);
        }
      }, 18);
    };

    animate();
  }, [score]);

  const label =
    displayScore < 50
      ? "Needs Improvement"
      : displayScore < 70
      ? "Average"
      : displayScore < 85
      ? "Good"
      : "Excellent";

  const cx = 200;
  const cy = 170;
  const radius = 125;

  // arc center alignment
  const angle = Math.PI * (1 - displayScore / 100);

  const x = cx + radius * Math.cos(angle);
  const y = cy - radius * Math.sin(angle);

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 400 240" className="gauge-svg">

        {/* background */}
        <path
          d="M 75 170 A 125 125 0 0 1 325 170"
          fill="none"
          stroke="#dbe3ef"
          strokeWidth="28"
          strokeLinecap="round"
        />

        {/* RED */}
        <path
          d="M 75 170 A 125 125 0 0 1 145 72"
          fill="none"
          stroke="#ef4444"
          strokeWidth="28"
          strokeLinecap="round"
        />

        {/* YELLOW */}
        <path
          d="M 145 72 A 125 125 0 0 1 270 82"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="28"
        />

        {/* GREEN */}
        <path
          d="M 270 82 A 125 125 0 0 1 325 170"
          fill="none"
          stroke="#10b981"
          strokeWidth="28"
          strokeLinecap="round"
        />

        {/* pointer */}
        <circle
          cx={x}
          cy={y}
          r="10"
          fill="white"
          stroke="#0b0f1e"
          strokeWidth="3"
        />

        <text
          x="200"
          y="132"
          textAnchor="middle"
          fontSize="54"
          fontWeight="800"
          fill="#0b0f1e"
        >
          {displayScore}
        </text>

        <text
          x="200"
          y="160"
          textAnchor="middle"
          fontSize="17"
          fill="#64748b"
        >
          {label}
        </text>

        {/* perfectly aligned */}
        <text x="68" y="194" fill="#64748b" fontSize="14">0</text>
        <text x="318" y="194" fill="#64748b" fontSize="14">100</text>
      </svg>
    </div>
  );
}
/* ─────────────────────────────────────────
   SCORE CARDS – skillScore / resumeQuality / projectRelevance
───────────────────────────────────────── */
function ScoreCard({ label, value, color, icon }) {
  const [anim, setAnim] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const run = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      setAnim(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const r = 32, circ = 2 * Math.PI * r;
  const dash = (anim / 100) * circ;

  return (
    <div className="score-card">
      <svg width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: "stroke-dasharray 0.9s ease" }} />
        <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="800" fill={color}>{anim}</text>
      </svg>
      <span className="score-card-icon">{icon}</span>
      <span className="score-card-label">{label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   SKILL PILL
───────────────────────────────────────── */
function SkillPill({ skill, matched, importance }) {
  const impClass = importance === "critical" ? "imp-critical"
    : importance === "high" ? "imp-high"
    : importance === "medium" ? "imp-medium" : "";
  return (
    <span className={`skill-pill ${matched ? "matched" : "missing"} ${impClass}`}>
      {matched ? "✓" : "✗"} {skill}
      {importance && <sup className="imp-badge">{importance[0].toUpperCase()}</sup>}
    </span>
  );
}

/* ─────────────────────────────────────────
   RELATED SKILLS TABLE ROW
───────────────────────────────────────── */
function RelatedRow({ item }) {
  const catColor = {
    framework: "#3182ce", language: "#805ad5", tool: "#d69e2e",
    cloud: "#38a169", database: "#e53e3e", other: "#718096"
  };
  const c = catColor[item.category?.toLowerCase()] || "#718096";
  return (
    <tr className="related-row">
      <td>{item.required}</td>
      <td className="related-equiv">{item.resumeEquivalent}</td>
      <td><span className="cat-tag" style={{ background: c + "18", color: c }}>{item.category}</span></td>
      <td>
        <div className="weight-bar-wrap">
          <div className="weight-bar" style={{ width: `${Math.round(item.weight * 100)}%`, background: c }} />
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function ATSAnalyzer() {
  const [resume, setResume]           = useState(null);
  const [jobDescription, setJD]       = useState("");
  const [result, setResult]           = useState(null);
  const [loading, setLoading]         = useState(false);
  const [dragOver, setDragOver]       = useState(false);
  const [activeTab, setActiveTab]     = useState("overview");

  const handleFile = (f) => { if (f) setResume(f); };

  const handleAnalyze = async () => {
    if (!resume || !jobDescription.trim()) {
      alert("Please upload a resume and paste a job description.");
      return;
    }
    try {
      setLoading(true);
      setResult(null);
      const token = localStorage.getItem("token");

      // Step 1 – upload resume
      const fd = new FormData();
      fd.append("resume", resume);
      const upRes  = await fetch(`${API}/resume/upload`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const upData = await upRes.json();
      if (!upRes.ok) { alert(upData.message || "Upload failed"); return; }

      // Step 2 – analyze
      const anRes  = await fetch(`${API}/ats/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobDescription }),
      });
      const anData = await anRes.json();
      if (!anRes.ok) { alert(anData.message || "Analysis failed"); return; }

      setResult(anData);
      setActiveTab("overview");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Derived chart data from schema fields ── */
  const skillMatchBar = result ? [
    { name: "Matched",  value: result.matchedSkills?.length  || 0 },
    { name: "Missing",  value: result.missingSkills?.length  || 0 },
  ] : [];

  const hybridScoreBar = result ? [
    { name: "Skill Score",       value: Math.round(result.skillScore            || 0) },
    { name: "Resume Quality",    value: Math.round(result.resumeQualityScore    || 0) },
    { name: "Project Relevance", value: Math.round(result.projectRelevanceScore || 0) },
    { name: "ATS Score",         value: Math.round(result.atsScore              || 0) },
  ] : [];

  // importance breakdown from requiredSkillsDetailed
  const importancePie = result?.requiredSkillsDetailed?.length ? (() => {
    const counts = {};
    result.requiredSkillsDetailed.forEach(({ importance }) => {
      counts[importance] = (counts[importance] || 0) + 1;
    });
    const pieColors = { critical: "#e53e3e", high: "#dd6b20", medium: "#d69e2e", low: "#38a169" };
    return Object.entries(counts).map(([k, v]) => ({ name: k, value: v, color: pieColors[k] || "#718096" }));
  })() : [];

  // build importance lookup for missing pills
  const importanceMap = {};
  result?.requiredSkillsDetailed?.forEach(({ skill, importance }) => {
    importanceMap[skill.toLowerCase()] = importance;
  });

  const COLORS_BAR = ["#667eea", "#38a169", "#dd6b20", "#e53e3e"];

  return (
    <div className="ats-wrapper">

      {/* ── Header ── */}
      <div className="ats-header">
        <div className="ats-logo-pill">⚡ ATS Analyzer</div>
        <h1>Resume ATS Score Checker</h1>
        <p>Upload your resume · Paste the job description · Get an instant detailed ATS report</p>
      </div>

      {/* ── Input ── */}
      <div className="input-grid">
        <div
          className={`drop-zone ${dragOver ? "drag-active" : ""} ${resume ? "has-file" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => document.getElementById("resumeInput").click()}
        >
          <input id="resumeInput" type="file" accept=".pdf,.doc,.docx" hidden
            onChange={(e) => handleFile(e.target.files[0])} />
          {resume ? (
            <>
              <div className="file-icon">📄</div>
              <p className="file-name">{resume.name}</p>
              <span className="file-hint">Click to change</span>
            </>
          ) : (
            <>
              <div className="upload-icon">☁️</div>
              <p className="drop-label">Drag & drop your resume</p>
              <span className="drop-sub">PDF · DOC · DOCX — click to browse</span>
            </>
          )}
        </div>

        <div className="jd-box">
          <label className="jd-label">Job Description</label>
          <textarea className="jd-textarea" rows="9"
            placeholder="Paste the full job description here…"
            value={jobDescription} onChange={(e) => setJD(e.target.value)} />
        </div>
      </div>

      <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
        {loading ? <><span className="spinner" /> Analyzing…</> : "🔍 Analyze Resume"}
      </button>

      {/* ── Results ── */}
      {result && (
        <div className="results-section" style={{ maxWidth: "1100px" }}>

          {/* GAUGE + sub-scores */}
          <div className="score-block">
            <h2 className="section-title">Your ATS Score</h2>
            <GaugeChart score={result.atsScore || 0} />

            <div className="sub-scores">
              <ScoreCard label="Skill Match"        value={Math.round(result.skillScore            || 0)} color="#667eea" icon="🎯" />
              <ScoreCard label="Resume Quality"     value={Math.round(result.resumeQualityScore    || 0)} color="#38a169" icon="📋" />
              <ScoreCard label="Project Relevance"  value={Math.round(result.projectRelevanceScore || 0)} color="#dd6b20" icon="🚀" />
            </div>
          </div>

          {/* TAB NAV */}
          <div className="tab-nav">
            {["overview", "skills", "insights", "charts"].map((t) => (
              <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}>
                {t === "overview" ? "📊 Overview"
                  : t === "skills" ? "🛠 Skills"
                  : t === "insights" ? "💡 Insights"
                  : "📈 Charts"}
              </button>
            ))}
          </div>

          {/* ── TAB: OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="tab-content">

              {/* Hybrid score bar */}
              <div className="chart-card full-width">
                <h3 className="chart-title">Hybrid Score Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hybridScoreBar} barSize={52} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#718096" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#a0aec0" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "#f7fafc" }}
                      contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {hybridScoreBar.map((_, i) => <Cell key={i} fill={COLORS_BAR[i % COLORS_BAR.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Strengths + Weaknesses + Suggestions */}
              <div className="feedback-grid">
                <div className="feedback-card strengths">
                  <h3>💪 Strengths</h3>
                  <ul>{result.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div className="feedback-card weaknesses">
                  <h3>⚠️ Weaknesses</h3>
                  <ul>{result.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div className="feedback-card suggestions">
                  <h3>💡 Suggestions</h3>
                  <ul>{result.suggestions?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: SKILLS ── */}
          {activeTab === "skills" && (
            <div className="tab-content">

              {/* Matched / Missing pills */}
              <div className="skills-section">
                <div className="skills-col">
                  <h3 className="skills-heading matched-heading">✅ Matched Skills
                    <span className="count-badge green">{result.matchedSkills?.length || 0}</span>
                  </h3>
                  <div className="pills-wrap">
                    {result.matchedSkills?.map((s, i) => (
                      <SkillPill key={i} skill={s} matched importance={importanceMap[s.toLowerCase()]} />
                    ))}
                  </div>
                </div>
                <div className="skills-col">
                  <h3 className="skills-heading missing-heading">❌ Missing Skills
                    <span className="count-badge red">{result.missingSkills?.length || 0}</span>
                  </h3>
                  <div className="pills-wrap">
                    {result.missingSkills?.map((s, i) => (
                      <SkillPill key={i} skill={s} matched={false} importance={importanceMap[s.toLowerCase()]} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Required skills with importance & weight */}
              {result.requiredSkillsDetailed?.length > 0 && (
                <div className="chart-card full-width">
                  <h3 className="chart-title">Required Skills — Importance & Weight</h3>
                  <div className="importance-legend">
                    {[["critical","#e53e3e"],["high","#dd6b20"],["medium","#d69e2e"],["low","#38a169"]].map(([k,c]) => (
                      <span key={k} className="leg-item">
                        <span className="leg-dot" style={{ background: c }} />{k}
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(240, result.requiredSkillsDetailed.length * 36)}>
                    <BarChart layout="vertical"
                      data={result.requiredSkillsDetailed.map((d) => ({
                        skill: d.skill,
                        weight: Math.round(d.weight * 100),
                        importance: d.importance,
                      }))}
                      margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#a0aec0" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="skill" width={120} tick={{ fontSize: 12, fill: "#4a5568" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => [`${v}%`, "Weight"]}
                        contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                      <Bar dataKey="weight" radius={[0, 6, 6, 0]}>
                        {result.requiredSkillsDetailed.map((d, i) => {
                          const c = d.importance === "critical" ? "#e53e3e"
                            : d.importance === "high" ? "#dd6b20"
                            : d.importance === "medium" ? "#d69e2e" : "#38a169";
                          return <Cell key={i} fill={c} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Semantic related skills table */}
              {result.relatedSkills?.length > 0 && (
                <div className="chart-card full-width">
                  <h3 className="chart-title">🔗 Semantically Related Skills</h3>
                  <p className="chart-sub">Skills in your resume that partially satisfy job requirements</p>
                  <div className="table-wrap">
                    <table className="related-table">
                      <thead>
                        <tr>
                          <th>Required</th>
                          <th>Your Equivalent</th>
                          <th>Category</th>
                          <th style={{ width: 120 }}>Similarity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.relatedSkills.map((r, i) => <RelatedRow key={i} item={r} />)}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: INSIGHTS ── */}
          {activeTab === "insights" && (
            <div className="tab-content">
              {/* Raw vs Normalized skills */}
              <div className="two-col">
                <div className="chart-card">
                  <h3 className="chart-title">📄 Your Resume Skills</h3>
                  <p className="chart-sub">Raw → Normalized</p>
                  <div className="raw-norm-list">
                    {result.resumeSkillsRaw?.map((raw, i) => (
                      <div key={i} className="raw-norm-row">
                        <span className="raw-tag">{raw}</span>
                        <span className="arrow">→</span>
                        <span className="norm-tag">{result.resumeSkillsNormalized?.[i] || raw}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-card">
                  <h3 className="chart-title">📋 Job Required Skills</h3>
                  <p className="chart-sub">Raw → Normalized</p>
                  <div className="raw-norm-list">
                    {result.requiredSkillsRaw?.map((raw, i) => (
                      <div key={i} className="raw-norm-row">
                        <span className="raw-tag">{raw}</span>
                        <span className="arrow">→</span>
                        <span className="norm-tag">{result.requiredSkillsNormalized?.[i] || raw}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: CHARTS ── */}
          {activeTab === "charts" && (
            <div className="tab-content">
              <div className="charts-grid">

                {/* Skill match bar */}
                <div className="chart-card">
                  <h3 className="chart-title">Skill Match Overview</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={skillMatchBar} barSize={60}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#718096" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 12, fill: "#a0aec0" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        <Cell fill="#38a169" />
                        <Cell fill="#e53e3e" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Importance pie */}
                {importancePie.length > 0 && (
                  <div className="chart-card">
                    <h3 className="chart-title">Required Skills by Importance</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={importancePie} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" outerRadius={80} innerRadius={44} paddingAngle={3}>
                          {importancePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                        <Legend formatter={(v) => <span style={{ fontSize: 12, color: "#4a5568" }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Radar: hybrid scores */}
                <div className="chart-card">
                  <h3 className="chart-title">Score Radar</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={[
                      { subject: "Skill",       score: Math.round(result.skillScore            || 0) },
                      { subject: "Quality",     score: Math.round(result.resumeQualityScore    || 0) },
                      { subject: "Relevance",   score: Math.round(result.projectRelevanceScore || 0) },
                      { subject: "ATS",         score: Math.round(result.atsScore              || 0) },
                    ]}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#718096" }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar name="Score" dataKey="score" stroke="#667eea" fill="#667eea" fillOpacity={0.28} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Semantic similarity weights */}
                {result.relatedSkills?.length > 0 && (
                  <div className="chart-card">
                    <h3 className="chart-title">Semantic Similarity Weights</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={result.relatedSkills.map((r) => ({
                        name: r.required, value: Math.round(r.weight * 100)
                      }))} barSize={18} layout="vertical" margin={{ left: 16, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#a0aec0" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#4a5568" }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v) => [`${v}%`, "Similarity"]}
                          contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13 }} />
                        <Bar dataKey="value" fill="#805ad5" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}