import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardNavbar.css";

/* Pull first letter of name stored in localStorage (set it when you login) */
function getInitial() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "U";
    const payload = JSON.parse(atob(token.split(".")[1]));
    const name = payload.name || payload.email || "U";
    return name.charAt(0).toUpperCase();
  } catch {
    return "U";
  }
}

export default function DashboardNavbar({ setActivePage, activePage = "dashboard" }) {
  const [menuOpen,   setMenuOpen]   = useState(false); // mobile drawer
  const [avatarOpen, setAvatarOpen] = useState(false); // desktop avatar dropdown
  const navigate = useNavigate();
  const initial = getInitial();

  const navLinks = [
    { key: "dashboard", label: "Dashboard",       icon: "📊" },
    { key: "ats",       label: "ATS Analyzer",    icon: "🎯" },
    { key: "optimize",  label: "Optimize Resume",  icon: "✨" },
    { key: "contact",   label: "Contact",          icon: "✉️" },
  ];

  const handleNav = (key) => {
    setActivePage(key);
    setMenuOpen(false);
    setAvatarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="dnav">

      {/* ── Brand ── */}
      <div className="dnav-left">
        <div className="dnav-logo-box">🎯</div>
        <span className="dnav-brand">
          HireLens<span className="dnav-brand-accent">AI</span>
        </span>
      </div>

      {/* ── Nav links (desktop) ── */}
      <div className="dnav-links">
        {navLinks.map(l => (
          <button
            key={l.key}
            className={`dnav-link${activePage === l.key ? " active" : ""}`}
            onClick={() => handleNav(l.key)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* ── Right: CTA + avatar ── */}
      <div className="dnav-right">
        <button className="dnav-cta" onClick={() => handleNav("ats")}>
          + New Analysis
        </button>
        <div className="dnav-avatar-wrap">
          <button
            className="dnav-avatar"
            onClick={() => setAvatarOpen(v => !v)}
            aria-label="Account menu"
          >
            {initial}
          </button>
          {avatarOpen && (
            <div className="dnav-avatar-dropdown">
              <div className="dnav-avatar-dropdown-name">Signed in as</div>
              <div className="dnav-avatar-dropdown-initial">{initial}</div>
              <hr className="dnav-avatar-dropdown-divider" />
              <button className="dnav-avatar-dropdown-logout" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile hamburger ── */}
      <button
        className="dnav-hamburger"
        onClick={() => setMenuOpen(v => !v)}
        aria-label="Toggle menu"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className="dnav-drawer">
          {navLinks.map(l => (
            <button
              key={l.key}
              className={`dnav-drawer-link${activePage === l.key ? " active" : ""}`}
              onClick={() => handleNav(l.key)}
            >
              <span className="dnav-drawer-icon">{l.icon}</span>
              {l.label}
            </button>
          ))}
          <hr className="dnav-drawer-divider" />
          <button className="dnav-drawer-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      )}
    </nav>
  );
}