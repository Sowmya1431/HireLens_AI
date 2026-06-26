import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../components/Login.css";

function Login() {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-root">
      {/* Animated background orbs */}
      
      <div className="lg-orb lg-orb1" />
      <div className="lg-orb lg-orb2" />
      <div className="lg-orb lg-orb3" />

      <div className="lg-wrapper">
        {/* LEFT PANEL */}
        <div className="lg-left">
          <div className="lg-brand">
            HireLens<span>AI</span>
          </div>

          <div className="lg-left-content">
            <div className="lg-score-ring">
              <svg viewBox="0 0 120 120" className="lg-ring-svg">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="327"
                  strokeDashoffset="49"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
                />
                <defs>
                  <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#0084ff" />
                  </linearGradient>
                </defs>
                <text x="60" y="55" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700">92</text>
                <text x="60" y="70" textAnchor="middle" fill="#8ab4cc" fontSize="9">/100 ATS</text>
              </svg>
            </div>

            <h2 className="lg-tagline">
              Your resume,<br />
              <span>optimised.</span>
            </h2>
            <p className="lg-tagline-sub">
              Analyse, improve, and land more interviews with AI-powered resume scoring.
            </p>

            <div className="lg-stat-row">
              {[
                { val: "92%", label: "Avg ATS Score" },
                { val: "3×", label: "More Interviews" },
                { val: "10s", label: "Analysis Time" },
              ].map((s) => (
                <div className="lg-stat" key={s.label}>
                  <div className="lg-stat-val">{s.val}</div>
                  <div className="lg-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — FORM */}
        <div className="lg-right">
          <div className="lg-card">
            <Link to="/" className="lg-back-btn">
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.3"
  >
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
</Link>
            <div className="lg-card-header">
              <div className="lg-avatar">
                <span>H</span>
              </div>
              <h1 className="lg-title">Welcome back</h1>
              <p className="lg-subtitle">Sign in to continue your resume journey</p>
            </div>

            <form className="lg-form" onSubmit={handleLogin}>
              <div className="lg-field">
                <label className="lg-label">Email</label>
                <div className="lg-input-wrap">
                  <span className="lg-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="M2 7l10 7 10-7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className="lg-input"
                  />
                </div>
              </div>

              <div className="lg-field">
                <div className="lg-label-row">
                  <label className="lg-label">Password</label>
                  <a href="#" className="lg-forgot">Forgot password?</a>
                </div>
                <div className="lg-input-wrap">
                  <span className="lg-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    className="lg-input"
                  />
                  <button
                    type="button"
                    className="lg-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && <div className="lg-error">⚠ {error}</div>}

              <button type="submit" className="lg-btn" disabled={loading}>
                {loading ? (
                  <span className="lg-spinner" />
                ) : (
                  "Sign In →"
                )}
              </button>
            </form>

            <div className="lg-divider"><span>or</span></div>

            <div className="lg-footer-text">
              Don't have an account?{" "}
              <Link to="/register" className="lg-link">Create one free</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;