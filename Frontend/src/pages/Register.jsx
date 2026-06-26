import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../components/Register.css";

/* ── Animated SVG Illustration ── */
function SceneIllustration() {
  return (
    <svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f2a4a" />
          <stop offset="100%" stopColor="#0a1a32" />
        </linearGradient>
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#0084ff" />
        </linearGradient>
        <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6c5ce7" />
          <stop offset="100%" stopColor="#a29bfe" />
        </linearGradient>
        <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00b894" />
          <stop offset="100%" stopColor="#00cec9" />
        </linearGradient>
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,100,255,0.25)" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="cardClip">
          <rect x="60" y="20" width="200" height="150" rx="14" />
        </clipPath>
      </defs>

      {/* ── MAIN UI CARD (floating) ── */}
      <g className="rg-ui-card" filter="url(#cardShadow)">
        <rect x="60" y="20" width="200" height="150" rx="14"
          fill="url(#cardGrad)" stroke="rgba(76,201,255,0.25)" strokeWidth="1" />

        {/* card top bar */}
        <rect x="60" y="20" width="200" height="28" rx="14" fill="rgba(0,132,255,0.18)" />
        <rect x="60" y="34" width="200" height="14" fill="rgba(0,132,255,0.18)" />
        <circle cx="78" cy="34" r="5" fill="#ff6b6b" opacity="0.8" />
        <circle cx="93" cy="34" r="5" fill="#ffd93d" opacity="0.8" />
        <circle cx="108" cy="34" r="5" fill="#6bcb77" opacity="0.8" />
        <text x="160" y="38" textAnchor="middle" fill="rgba(255,255,255,0.5)"
          fontSize="7" fontFamily="Inter,sans-serif">HireLens AI Dashboard</text>

        {/* ── Score ring inside card ── */}
        <g className="rg-score-glow">
          <circle cx="100" cy="105" r="32" fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx="100" cy="105" r="32" fill="none"
            stroke="url(#blueGrad)" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="201"
            className="rg-ring-dash"
            style={{ transform: "rotate(-90deg)", transformOrigin: "100px 105px" }} />
          <text x="100" y="101" textAnchor="middle"
            fill="#fff" fontSize="14" fontWeight="700" fontFamily="Inter,sans-serif">92</text>
          <text x="100" y="113" textAnchor="middle"
            fill="#8ab4cc" fontSize="6" fontFamily="Inter,sans-serif">ATS Score</text>
        </g>

        {/* ── Mini bar chart ── */}
        <g>
          <text x="165" y="66" fill="#8ab4cc" fontSize="6.5" fontFamily="Inter,sans-serif">Resume Strength</text>
          {/* bars */}
          <g className="rg-bar1">
            <rect x="158" y="108" width="10" height="22" rx="3" fill="url(#blueGrad)" opacity="0.9" />
          </g>
          <g className="rg-bar2">
            <rect x="173" y="98" width="10" height="32" rx="3" fill="url(#blueGrad)" opacity="0.9" />
          </g>
          <g className="rg-bar3">
            <rect x="188" y="88" width="10" height="42" rx="3" fill="url(#purpleGrad)" opacity="0.9" />
          </g>
          <g className="rg-bar4">
            <rect x="203" y="80" width="10" height="50" rx="3" fill="url(#greenGrad)" opacity="0.9" />
          </g>
          {/* x-axis */}
          <line x1="155" y1="130" x2="220" y2="130" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        </g>

        {/* mini pill tags */}
        <rect x="155" y="137" width="30" height="10" rx="5" fill="rgba(0,212,255,0.2)"
          stroke="rgba(0,212,255,0.4)" strokeWidth="0.5" />
        <text x="170" y="144" textAnchor="middle" fill="#4cc9ff"
          fontSize="5" fontFamily="Inter,sans-serif">Keywords</text>
        <rect x="190" y="137" width="28" height="10" rx="5" fill="rgba(108,92,231,0.2)"
          stroke="rgba(108,92,231,0.4)" strokeWidth="0.5" />
        <text x="204" y="144" textAnchor="middle" fill="#a29bfe"
          fontSize="5" fontFamily="Inter,sans-serif">Format</text>
      </g>

      {/* ── FLOATING BULB (top-right) ── */}
      <g className="rg-bulb" style={{ transformOrigin: "272px 18px" }}>
        {/* glow */}
        <circle cx="272" cy="18" r="14" fill="rgba(255,220,50,0.1)" />
        {/* bulb body */}
        <ellipse cx="272" cy="15" rx="9" ry="10" fill="#ffd93d" opacity="0.95" />
        <path d="M265 22 Q272 30 279 22" fill="#ffd93d" opacity="0.8" />
        <rect x="268" y="25" width="8" height="4" rx="2" fill="#f0b429" />
        <rect x="269" y="29" width="6" height="2" rx="1" fill="#e0a020" />
        {/* shine */}
        <ellipse cx="269" cy="12" rx="2.5" ry="3.5" fill="rgba(255,255,255,0.4)" />
        {/* rays */}
        <line x1="272" y1="2" x2="272" y2="-2" stroke="#ffd93d" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="283" y1="6" x2="286" y2="3" stroke="#ffd93d" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="261" y1="6" x2="258" y2="3" stroke="#ffd93d" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="286" y1="16" x2="290" y2="16" stroke="#ffd93d" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="258" y1="16" x2="254" y2="16" stroke="#ffd93d" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* ── SPARKLES ── */}
      <g className="rg-spark1" fill="#4cc9ff">
        <polygon points="52,42 54,47 59,47 55,50 57,55 52,52 47,55 49,50 45,47 50,47" />
      </g>
      <g className="rg-spark2" fill="#a29bfe">
        <polygon points="278,90 279.5,94 284,94 280.5,96.5 282,101 278,98.5 274,101 275.5,96.5 272,94 276.5,94" />
      </g>
      <g className="rg-spark3" fill="#ffd93d" opacity="0.8">
        <polygon points="48,170 49.5,174 54,174 50.5,176.5 52,181 48,178.5 44,181 45.5,176.5 42,174 46.5,174" />
      </g>

      {/* ── PERSON LEFT (guy with phone) ── */}
      <g className="rg-person-left">
        {/* body */}
        <rect x="28" y="160" width="28" height="42" rx="6" fill="#2d3561" />
        {/* head */}
        <circle cx="42" cy="152" r="13" fill="#f5a623" />
        {/* hair */}
        <path d="M29 148 Q42 138 55 148 L55 145 Q42 132 29 145 Z" fill="#333" />
        {/* beard */}
        <path d="M33 158 Q42 165 51 158" fill="none" stroke="#555" strokeWidth="2" />
        {/* eyes */}
        <circle cx="37" cy="151" r="2" fill="#333" />
        <circle cx="47" cy="151" r="2" fill="#333" />
        {/* phone in hand */}
        <rect x="52" y="170" width="14" height="22" rx="3" fill="#1a1a2e"
          stroke="rgba(76,201,255,0.6)" strokeWidth="1" />
        <rect x="54" y="173" width="10" height="14" rx="1" fill="url(#blueGrad)" opacity="0.7" />
        {/* arm */}
        <path d="M56 180 L52 175" stroke="#f5a623" strokeWidth="4" strokeLinecap="round" />
        {/* legs */}
        <rect x="30" y="198" width="10" height="22" rx="4" fill="#1a1a2e" />
        <rect x="44" y="198" width="10" height="22" rx="4" fill="#1a1a2e" />
        {/* shoes */}
        <ellipse cx="35" cy="220" rx="8" ry="4" fill="#333" />
        <ellipse cx="49" cy="220" rx="8" ry="4" fill="#333" />
      </g>

      {/* ── DOG ── */}
      <g>
        {/* body */}
        <ellipse cx="178" cy="220" rx="18" ry="12" fill="#c8a96e" />
        {/* head */}
        <circle cx="193" cy="210" r="11" fill="#c8a96e" />
        {/* ear */}
        <ellipse cx="188" cy="203" rx="5" ry="7" fill="#b8925a" transform="rotate(-15,188,203)" />
        <ellipse cx="200" cy="203" rx="4" ry="6" fill="#b8925a" transform="rotate(10,200,203)" />
        {/* eye */}
        <circle cx="196" cy="209" r="2.5" fill="#333" />
        <circle cx="197" cy="208" r="0.8" fill="white" />
        {/* nose */}
        <ellipse cx="202" cy="214" rx="3" ry="2" fill="#333" />
        {/* mouth */}
        <path d="M199 216 Q202 219 205 216" fill="none" stroke="#333" strokeWidth="1" />
        {/* legs */}
        <rect x="163" y="226" width="7" height="12" rx="3" fill="#b8925a" />
        <rect x="174" y="226" width="7" height="12" rx="3" fill="#b8925a" />
        <rect x="184" y="226" width="7" height="12" rx="3" fill="#b8925a" />
        {/* tail */}
        <path className="rg-dog-tail"
          d="M160 218 Q150 205 158 198" fill="none"
          stroke="#c8a96e" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* ── PERSON RIGHT (woman pointing) ── */}
      <g className="rg-person-right">
        {/* body — blazer */}
        <rect x="248" y="160" width="30" height="44" rx="6" fill="#0984e3" />
        {/* collar */}
        <path d="M258 160 L263 172 L268 160" fill="#fff" opacity="0.9" />
        {/* head */}
        <circle cx="263" cy="150" r="13" fill="#d4956a" />
        {/* hair */}
        <path d="M250 147 Q263 136 276 147 L276 140 Q263 127 250 140 Z" fill="#2d1b00" />
        <path d="M250 147 L248 162" stroke="#2d1b00" strokeWidth="5" strokeLinecap="round" />
        <path d="M276 147 L278 162" stroke="#2d1b00" strokeWidth="5" strokeLinecap="round" />
        {/* eyes */}
        <circle cx="258" cy="149" r="2" fill="#333" />
        <circle cx="268" cy="149" r="2" fill="#333" />
        {/* smile */}
        <path d="M258 156 Q263 160 268 156" fill="none" stroke="#333" strokeWidth="1.5" />
        {/* pointing arm */}
        <path d="M248 174 L234 162" stroke="#d4956a" strokeWidth="5" strokeLinecap="round" />
        {/* finger */}
        <circle cx="232" cy="161" r="3" fill="#d4956a" />
        {/* other arm */}
        <path d="M278 176 L285 192" stroke="#d4956a" strokeWidth="4" strokeLinecap="round" />
        {/* legs */}
        <rect x="251" y="200" width="11" height="24" rx="4" fill="#2d3561" />
        <rect x="266" y="200" width="11" height="24" rx="4" fill="#2d3561" />
        {/* shoes */}
        <ellipse cx="256" cy="224" rx="8" ry="4" fill="#333" />
        <ellipse cx="272" cy="224" rx="8" ry="4" fill="#333" />
      </g>

      {/* ── GROUND SHADOW ── */}
      <ellipse cx="42" cy="223" rx="22" ry="5" fill="rgba(0,0,0,0.15)" />
      <ellipse cx="178" cy="234" rx="24" ry="5" fill="rgba(0,0,0,0.12)" />
      <ellipse cx="263" cy="226" rx="22" ry="5" fill="rgba(0,0,0,0.15)" />

      {/* ── FLOATING MINI BADGE ── */}
      <g style={{ animation: "orbFloat 5s ease-in-out 1s infinite" }}>
        <rect x="220" y="48" width="56" height="22" rx="11"
          fill="rgba(0,184,148,0.15)" stroke="rgba(0,184,148,0.5)" strokeWidth="1" />
        <circle cx="232" cy="59" r="5" fill="url(#greenGrad)" />
        <text x="244" y="63" fill="#00b894" fontSize="7" fontFamily="Inter,sans-serif" fontWeight="600">+ATS 92%</text>
      </g>
    </svg>
  );
}

function Register() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        navigate("/login");
      } else {
        setError(data.message || "Registration failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rg-root">
      {/* Background orbs */}
      <div className="rg-orb rg-orb1" />
      <div className="rg-orb rg-orb2" />
      <div className="rg-orb rg-orb3" />

      <div className="rg-wrapper">

        {/* ── LEFT PANEL ── */}
        <div className="rg-left">
          <div className="rg-brand">HireLens<span>AI</span></div>

          {/* Animated scene */}
          <div className="rg-scene">
            <SceneIllustration />
          </div>

          <h2 className="rg-tagline">
            Land more <span>interviews.</span>
          </h2>
          <p className="rg-tagline-sub">
            AI-powered résumé analysis that beats the ATS and gets you noticed.
          </p>

          {/* Stats */}
          <div className="rg-stat-row">
            {[
              { val: "50k+", label: "Users" },
              { val: "92%",  label: "Avg Score" },
              { val: "Free", label: "To Start" },
            ].map((s) => (
              <div className="rg-stat" key={s.label}>
                <div className="rg-stat-val">{s.val}</div>
                <div className="rg-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="rg-right">
          <div className="rg-card">

            {/* Back button */}
            <Link to="/" className="rg-back-btn" aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.3">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* Header */}
            <div className="rg-card-header">
              <div className="rg-avatar"><span>H</span></div>
              <h1 className="rg-title">Create account</h1>
              <p className="rg-subtitle">Start your free résumé analysis today</p>
            </div>

            {/* Form */}
            <form className="rg-form" onSubmit={handleRegister}>

              {/* Name */}
              <div className="rg-field">
                <label className="rg-label">Full Name</label>
                <div className="rg-input-wrap">
                  <span className="rg-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </span>
                  <input
                    type="text" name="name" placeholder="Jane Smith"
                    value={formData.name} onChange={handleChange}
                    required autoComplete="name" className="rg-input"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="rg-field">
                <label className="rg-label">Email</label>
                <div className="rg-input-wrap">
                  <span className="rg-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="M2 7l10 7 10-7" />
                    </svg>
                  </span>
                  <input
                    type="email" name="email" placeholder="you@example.com"
                    value={formData.email} onChange={handleChange}
                    required autoComplete="email" className="rg-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="rg-field">
                <label className="rg-label">Password</label>
                <div className="rg-input-wrap">
                  <span className="rg-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password" placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                    required autoComplete="new-password"
                    className="rg-input rg-input-pw"
                  />
                  <button type="button" className="rg-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div className="rg-error">⚠ {error}</div>}

              <button type="submit" className="rg-btn" disabled={loading}>
                {loading ? <span className="rg-spinner" /> : "Create Account →"}
              </button>
            </form>

            <div className="rg-divider"><span>or</span></div>

            <div className="rg-footer-text">
              Already have an account?{" "}
              <Link to="/login" className="rg-link">Sign in</Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;