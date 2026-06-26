import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "../components/Home.css";

function Home() {
  const gaugeRef = useRef(null);
  const atsFillRef = useRef(null);

  // Contact form state
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formStatus, setFormStatus] = useState({ loading: false, success: "", error: "" });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setFormStatus({ loading: true, success: "", error: "" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setFormStatus({ loading: false, success: data.message, error: "" });
        setFormData({ name: "", email: "", message: "" });
      } else {
        setFormStatus({ loading: false, success: "", error: data.error });
      }
    } catch {
      setFormStatus({ loading: false, success: "", error: "Network error. Please try again." });
    }
  };

  useEffect(() => {
    const arc = gaugeRef.current;
    if (arc) {
      const total = 151;
      const target = total * (1 - 0.92);
      let start = null;
      const anim = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1200, 1);
        arc.style.strokeDashoffset = total - (total - target) * p;
        if (p < 1) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
    }

    const slides = ["slide-ats", "slide-circles", "slide-keywords"];
    let cur = 0;
    const cycle = setInterval(() => {
      document.getElementById(slides[cur])?.classList.remove("active");
      cur = (cur + 1) % slides.length;
      const next = document.getElementById(slides[cur]);
      next?.classList.add("active");

      if (cur === 1) {
        document.querySelectorAll(".anim-circle").forEach((c) => {
          const orig = parseFloat(c.getAttribute("data-target"));
          c.style.strokeDashoffset = "163";
          c.style.transition = "none";
          setTimeout(() => {
            c.style.transition = "stroke-dashoffset 1s ease";
            c.style.strokeDashoffset = orig;
          }, 80);
        });
      }
    }, 3000);

    return () => clearInterval(cycle);
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="hl-home">
      {/* NAV */}
      <nav className="hl-nav">
        <h2 className="hl-brand">
          HireLens<span>AI</span>
        </h2>
        <div className="hl-nav-links">
          <a href="#hero" onClick={scrollTo("hero")}>Home</a>
          <a href="#about" onClick={scrollTo("about")}>About</a>
          <a href="#contact" onClick={scrollTo("contact")}>Contact</a>
          <Link to="/login" className="hl-nav-btn">Login</Link>
          <Link to="/register" className="hl-nav-btn primary">Register</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hl-hero" id="hero">
        <div className="hl-left">
          <h2 className="hl-subtitle">
            AI-Powered<br />
            <span className="hl-cyan">Resume Analysis</span>
          </h2>
          <p className="hl-desc">
            Get real-time ATS score, smart suggestions<br />
            and detailed insights to land more interviews.
          </p>

          <ul className="hl-features">
            {[
              { icon: "🎯", label: "ATS Score & Performance" },
              { icon: "📋", label: "Content Improvement" },
              { icon: "📈", label: "Keyword & Skill Analysis" },
              { icon: "💡", label: "Smart Suggestions" },
            ].map((f, i) => (
              <li key={i} style={{ animationDelay: `${0.3 + i * 0.18}s` }}>
                <span className="hl-feat-icon">{f.icon}</span>
                {f.label}
              </li>
            ))}
          </ul>

          <a href="#about" onClick={scrollTo("about")} className="hl-cta">Get Started →</a>
        </div>

        {/* RIGHT CARD */}
        <div className="hl-right">
          <div className="hl-card">
            <div className="hl-panel-left">
              <div className="hl-score-title">Resume Score</div>
              <div className="hl-gauge-wrap">
                <svg viewBox="0 0 110 68" fill="none" className="hl-gauge-svg">
                  <path d="M10 60 A48 48 0 0 1 100 60" stroke="rgba(255,255,255,0.08)" strokeWidth="9" strokeLinecap="round" fill="none" />
                  <path ref={gaugeRef} d="M10 60 A48 48 0 0 1 100 60" stroke="#00e676" strokeWidth="9" strokeLinecap="round" fill="none" strokeDasharray="151" strokeDashoffset="151" />
                </svg>
                <div className="hl-score-num">92/100</div>
                <div className="hl-score-issues">24 Issues</div>
              </div>
              <div className="hl-cat-list">
                {[
                  { label: "Content", pct: "90%", cls: "green" },
                  { label: "Format", pct: "84%", cls: "green" },
                  { label: "Style", pct: "40%", cls: "red" },
                  { label: "Sections", pct: "40%", cls: "red" },
                  { label: "Skills", pct: "88%", cls: "amber" },
                ].map((c) => (
                  <div className="hl-cat-row" key={c.label}>
                    <span className="hl-cat-label">{c.label}</span>
                    <span className={`hl-badge hl-badge-${c.cls}`}>{c.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hl-panel-right">
              <div className="hl-panel-header">
                <div className="hl-content-label">
                  <span className="hl-hex">☰</span>
                  CONTENT
                </div>
                <span className="hl-issues-badge">8 ISSUES FOUND</span>
              </div>

              <div className="hl-content-area">
                <div className="hl-slide active" id="slide-ats">
                  <div className="hl-slide-title">ATS Parse Rate</div>
                  <div className="hl-skels">
                    {[100, 88, 94, 76].map((w, i) => (<div key={i} className="hl-skel" style={{ width: `${w}%` }} />))}
                  </div>
                  <div className="hl-ats-box">
                    <span className="hl-pin">📍</span>
                    <div className="hl-ats-track">
                      <div ref={atsFillRef} className="hl-ats-fill" style={{ width: "82%" }} />
                    </div>
                    <div className="hl-skels" style={{ marginTop: 8 }}>
                      {[100, 80, 90, 65].map((w, i) => (<div key={i} className="hl-skel dim" style={{ width: `${w}%` }} />))}
                    </div>
                  </div>
                </div>

                <div className="hl-slide" id="slide-circles">
                  <div className="hl-slide-title">Category Scores</div>
                  <div className="hl-circle-grid">
                    {[
                      { pct: 90, color: "#00e676", label: "Content", offset: 16 },
                      { pct: 84, color: "#4cc9ff", label: "Format", offset: 26 },
                      { pct: 40, color: "#ff6060", label: "Style", offset: 98 },
                      { pct: 88, color: "#ffb300", label: "Skills", offset: 20 },
                    ].map((c) => (
                      <div className="hl-circle-item" key={c.label}>
                        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                          <circle className="anim-circle" cx="32" cy="32" r="26" fill="none" stroke={c.color} strokeWidth="6" strokeDasharray="163" strokeDashoffset={c.offset} strokeLinecap="round" data-target={c.offset} />
                        </svg>
                        <div className="hl-circle-pct" style={{ color: c.color }}>{c.pct}%</div>
                        <div className="hl-circle-label">{c.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hl-slide" id="slide-keywords">
                  <div className="hl-slide-title">Keyword Analysis</div>
                  <div className="hl-kw-list">
                    {[
                      { name: "React.js", found: true, pct: 92, color: "#00e676" },
                      { name: "TypeScript", found: true, pct: 78, color: "#4cc9ff" },
                      { name: "Leadership", found: false, pct: 30, color: "#ff6060" },
                      { name: "Node.js", found: true, pct: 65, color: "#00e676" },
                      { name: "Agile", found: false, pct: 20, color: "#ff6060" },
                      { name: "AWS", found: true, pct: 55, color: "#ffb300" },
                    ].map((k) => (
                      <div className="hl-kw-row" key={k.name}>
                        <span className={`hl-kw-tag ${k.found ? "found" : "missing"}`}>{k.name}</span>
                        <div className="hl-kw-track">
                          <div className="hl-kw-fill" style={{ width: `${k.pct}%`, background: k.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="hl-about" id="about">
        <div className="hl-section-inner">
          <div className="hl-section-tag">About the Project</div>
          <h2 className="hl-section-title">What is <span className="hl-cyan">HireLensAI</span>?</h2>
          <p className="hl-section-desc">
            HireLensAI is an intelligent resume analysis platform built to help job seekers understand
            exactly how their resume performs against modern ATS (Applicant Tracking Systems) — the
            automated filters used by most companies before a human ever reads your application.
          </p>
          <div className="hl-about-cards">
            {[
              { icon: "🎯", title: "ATS Score Analysis", desc: "Get an instant, accurate ATS compatibility score so you know exactly where you stand before applying." },
              { icon: "🔍", title: "Keyword Matching", desc: "We compare your resume against job descriptions and surface missing keywords that could be costing you interviews." },
              { icon: "📋", title: "Content & Format Review", desc: "Detect formatting issues, weak phrasing, and missing sections — all with actionable fix suggestions." },
              { icon: "💡", title: "Smart Suggestions", desc: "AI-powered recommendations tailored to your industry, role, and experience level to maximise impact." },
              { icon: "📈", title: "Skill Gap Detection", desc: "Identify in-demand skills you're missing and get guidance on how to present the skills you already have." },
              { icon: "⚡", title: "Instant Results", desc: "Upload your resume and get a full report in seconds — no waiting, no manual review required." },
            ].map((card, i) => (
              <div className="hl-about-card" key={i}>
                <span className="hl-about-icon">{card.icon}</span>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            ))}
          </div>
          <div className="hl-about-cta-wrap">
            <Link to="/register" className="hl-cta">Start Analysing My Resume →</Link>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="hl-contact" id="contact">
        <div className="hl-section-inner">
          <div className="hl-section-tag">Get in Touch</div>
          <h2 className="hl-section-title">Contact <span className="hl-cyan">Us</span></h2>
          <p className="hl-section-desc">
            Have a question, feedback, or just want to say hi? We'd love to hear from you.
          </p>

          <div className="hl-contact-layout">
            {/* FORM */}
            <div className="hl-contact-form-wrap">
              <div className="hl-contact-form">
                <div className="hl-form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="hl-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="hl-form-group">
                  <label>Your Query</label>
                  <textarea
                    rows="5"
                    name="message"
                    placeholder="Write your message here…"
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>

                {formStatus.success && (
                  <div className="hl-form-success">✅ {formStatus.success}</div>
                )}
                {formStatus.error && (
                  <div className="hl-form-error">❌ {formStatus.error}</div>
                )}

                <button
                  className="hl-submit-btn"
                  onClick={handleSubmit}
                  disabled={formStatus.loading}
                >
                  {formStatus.loading ? "Sending…" : "Send Message →"}
                </button>
              </div>
            </div>

            {/* INFO */}
            <div className="hl-contact-info">
              <div className="hl-info-card">
                <span className="hl-info-icon">📧</span>
                <div>
                  <div className="hl-info-label">Email Us</div>
                  <div className="hl-info-value">mahanthisowmya35@gmail.com</div>
                </div>
              </div>
              <div className="hl-info-card">
                <span className="hl-info-icon">📱</span>
                <div>
                  <div className="hl-info-label">Call / WhatsApp</div>
                  <div className="hl-info-value">+91 98765 43210</div>
                </div>
              </div>
              <div className="hl-info-card">
                <span className="hl-info-icon">🕐</span>
                <div>
                  <div className="hl-info-label">Response Time</div>
                  <div className="hl-info-value">Within 24 hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hl-footer">
        <span className="hl-brand" style={{ fontSize: "1rem" }}>HireLens<span style={{ color: "#4cc9ff" }}>AI</span></span>
        <span className="hl-footer-copy">© {new Date().getFullYear()} HireLensAI. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default Home;