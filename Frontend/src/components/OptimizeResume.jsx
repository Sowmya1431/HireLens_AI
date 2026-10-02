import { useState, useRef, useEffect } from "react";
import classicImg from "./templates/classic.png";
import professionalImg from "./templates/professional.png";
import modernImg from "./templates/modern.png";

import ClassicTemplate from "./templates/ClassicTemplate";
import ProfessionalTemplate from "./templates/ProfessionalTemplate";
import ModernTemplate from "./templates/ModernTemplate";

import { detectResumeLevel, exportResumePDF } from "../utils/resumePdfExporter";
import "./OptimizeResume.css";

function OptimizeResume() {
  const API = import.meta.env.VITE_API_URL;
  console.log("API URL:", API);

  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [pageMode, setPageMode] = useState("fresher");
  const [autoDetectedMode, setAutoDetectedMode] = useState("fresher");

  const resumeRef = useRef(null);

  const templates = [
    {
      id: "classic",
      name: "Classic ATS",
      image: classicImg
    },
    {
      id: "professional",
      name: "Professional",
      image: professionalImg
    },
    {
      id: "modern",
      name: "Modern",
      image: modernImg
    }
  ];

  const handleRewrite = async (e) => {
    e.preventDefault();
    if (!resume || !jobDescription || !selectedTemplate) {
      alert("Fill all fields");
      return;
    }

    console.log("Resume:", resume);
    console.log("JD:", jobDescription);
    console.log("Template:", selectedTemplate);

    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jobDescription", jobDescription);
    formData.append("template", selectedTemplate);

    setLoading(true);

    try {
      const response = await fetch(`${API}/optimize/rewrite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid JSON from server");
      }

      console.log("SERVER RESPONSE:", data);

      if (!response.ok) {
        throw new Error(
          data.error || "Server returned error"
        );
      }

      // Automatically determine if candidate is a Fresher or Experienced
      const detected = detectResumeLevel(data);
      setAutoDetectedMode(detected);
      setPageMode(detected);
      setResult(data);
    } catch (err) {
      console.error("Optimization Error:", err);
      alert(err.message || "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const resumeEl = resumeRef.current?.querySelector(".resume");
    if (!resumeEl) return;

    if (isEditing) {
      resumeEl.setAttribute("contenteditable", "true");
      resumeEl.setAttribute("spellcheck", "true");
      resumeEl.classList.add("is-editing");
    } else {
      resumeEl.setAttribute("contenteditable", "false");
      resumeEl.classList.remove("is-editing");
    }
  }, [isEditing, selectedTemplate, renderKey, result, pageMode]);

  const handleToggleEdit = () => {
    const resumeEl = resumeRef.current?.querySelector(".resume");
    const nextState = !isEditing;
    setIsEditing(nextState);

    if (resumeEl) {
      if (nextState) {
        resumeEl.setAttribute("contenteditable", "true");
        resumeEl.setAttribute("spellcheck", "true");
        resumeEl.classList.add("is-editing");
        const firstHeading = resumeEl.querySelector("h1, h2, p");
        if (firstHeading) {
          firstHeading.focus();
        }
      } else {
        resumeEl.setAttribute("contenteditable", "false");
        resumeEl.classList.remove("is-editing");
      }
    }
  };

  const handleResetToOriginal = () => {
    if (window.confirm("Discard all manual edits and reset back to the AI-generated resume?")) {
      setRenderKey((prev) => prev + 1);
    }
  };

  const renderSelectedTemplate = () => {
    if (!result) return null;

    switch (selectedTemplate) {
      case "classic":
        return <ClassicTemplate key={`classic-${renderKey}-${pageMode}`} data={result} pageMode={pageMode} />;

      case "professional":
        return <ProfessionalTemplate key={`pro-${renderKey}-${pageMode}`} data={result} pageMode={pageMode} />;

      case "modern":
        return <ModernTemplate key={`modern-${renderKey}-${pageMode}`} data={result} pageMode={pageMode} />;

      default:
        return null;
    }
  };

  const handleExportPDF = async () => {
    const element = resumeRef.current?.querySelector(".resume") || resumeRef.current;
    if (!element) {
      alert("No resume found to export.");
      return;
    }

    try {
      setExporting(true);
      await exportResumePDF({
        element,
        candidateName: result?.name,
        pageMode
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("PDF Export failed: " + (err.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="optimize-container">
      <div className="optimize-header">
        <h1>AI Resume Optimizer</h1>
        <p>Tailor your resume for any job description in seconds</p>
      </div>

      <div className="optimize-form">
        <div className="form-group">
          <label>1. Upload Your Current Resume (PDF)</label>
          <label className="file-upload-wrapper">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResume(e.target.files[0])}
            />
            <div className="file-upload-text">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>{resume ? resume.name : <>Drop your PDF here or <span className="highlight">browse</span></>}</span>
            </div>
          </label>
        </div>

        <div className="form-group">
          <label>2. Target Job Description</label>
          <textarea
            className="custom-textarea"
            placeholder="Paste the job description here to align your resume with the requirements..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>3. Select a Design Template</label>
          <div className="template-grid">
            {templates.map((temp) => (
              <div
                key={temp.id}
                className={`template-card ${selectedTemplate === temp.id ? "selected" : ""}`}
                onClick={() => setSelectedTemplate(temp.id)}
              >
                <img src={temp.image} alt={temp.name} />
                <h4>{temp.name}</h4>
              </div>
            ))}
          </div>
        </div>

        <div className="action-container">
          <button 
            type="button"
            className="rewrite-btn" 
            onClick={handleRewrite}
            disabled={loading}
          >
            {loading ? "Optimizing..." : "Optimize Resume"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <h3>AI is analyzing and rewriting your resume...</h3>
        </div>
      )}

      {result && (
        <div className="optimized-result">
          <div className="result-header">
            <div className="score-box">
              <h2>ATS Score</h2>
              <div className="score-circle">
                {result.atsScore || 0}%
              </div>
            </div>

            {/* Resume Target Format: Fresher (1-Page) vs Experienced (1-2 Pages) */}
            <div className="page-mode-wrapper">
              <div className="page-mode-header">
                <span className="page-mode-title">📄 PDF Target Format:</span>
                <span className="page-mode-detected">
                  {autoDetectedMode === "fresher" ? "✨ Auto: Fresher" : "✨ Auto: Experienced"}
                </span>
              </div>
              <div className="page-mode-toggle">
                <button
                  type="button"
                  className={`page-mode-btn ${pageMode === "fresher" ? "active" : ""}`}
                  onClick={() => setPageMode("fresher")}
                  title="Strictly format resume as a 1-page PDF (Best for freshers & students)"
                >
                  🎓 Fresher (1 Page)
                </button>
                <button
                  type="button"
                  className={`page-mode-btn ${pageMode === "experienced" ? "active" : ""}`}
                  onClick={() => setPageMode("experienced")}
                  title="Format resume across 1 to 2 pages based on career depth (Max 2 pages)"
                >
                  💼 Experienced (1-2 Pages)
                </button>
              </div>
              <p className="page-mode-desc">
                {pageMode === "fresher" 
                  ? "✓ Guaranteed 1-page PDF export with clean, compact ATS formatting."
                  : "✓ Clean 1-2 page layout with section protection. Capped at 2 pages maximum."}
              </p>
            </div>

            <div className="result-actions">
              <button 
                type="button"
                className={`edit-mode-btn ${isEditing ? "active" : ""}`}
                onClick={handleToggleEdit}
              >
                {isEditing ? "💾 Done Editing" : "✏️ Edit Resume"}
              </button>
              <button 
                type="button"
                className="export-btn" 
                onClick={handleExportPDF}
                disabled={exporting}
              >
                {exporting ? "📥 Generating PDF..." : "📥 Download PDF"}
              </button>
            </div>
          </div>

          {isEditing && (
            <div className="edit-toolbar-container">
              <div className="edit-toolbar">
                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Bold text (Ctrl+B)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand("bold");
                    }}
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Italic text (Ctrl+I)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand("italic");
                    }}
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Underline text (Ctrl+U)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand("underline");
                    }}
                  >
                    <u>U</u>
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Insert Bullet Point"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand("insertUnorderedList");
                    }}
                  >
                    • Bullet List
                  </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group">
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Undo last change (Ctrl+Z)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand("undo");
                    }}
                  >
                    ↩ Undo
                  </button>
                  <button
                    type="button"
                    className="toolbar-btn"
                    title="Redo change (Ctrl+Y)"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      document.execCommand("redo");
                    }}
                  >
                    ↪ Redo
                  </button>
                </div>

                <div className="toolbar-divider"></div>

                <div className="toolbar-group" style={{ marginLeft: "auto" }}>
                  <button
                    type="button"
                    className="toolbar-btn reset-btn"
                    title="Discard manual edits and reset back to the AI-generated resume"
                    onClick={handleResetToOriginal}
                  >
                    🔄 Reset to AI Original
                  </button>
                </div>
              </div>

              <div className="edit-mode-banner">
                <div className="edit-banner-content">
                  <span className="edit-banner-icon">✏️</span>
                  <div className="edit-banner-text">
                    <strong>Live Manual Edit Mode:</strong> Click and type anywhere directly on the resume preview below to edit names, summaries, bullets, dates, or skills. Use the toolbar or standard shortcuts (<code>Ctrl+B</code>, <code>Ctrl+I</code>, <code>Ctrl+Z</code>). When satisfied, click <strong>💾 Done Editing</strong> or <strong>📥 Download PDF</strong>!
                  </div>
                </div>
              </div>
            </div>
          )}

          {result.missingKeywords && result.missingKeywords.length > 0 && (
            <section>
              <h3 style={{color: '#cbd5e1', marginBottom: '10px'}}>Keywords Added / Missing from Original</h3>
              <div className="missing-box">
                {result.missingKeywords.map((keyword, i) => (
                  <span key={i} className="missing-pill">
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="resume-preview-container" ref={resumeRef}>
            {renderSelectedTemplate()}
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizeResume;