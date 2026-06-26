import { useState } from "react";
import classicImg from "./templates/classic.png";
import professionalImg from "./templates/professional.png";
import modernImg from "./templates/modern.png";

import ClassicTemplate from "./templates/ClassicTemplate";
import ProfessionalTemplate from "./templates/ProfessionalTemplate";
import ModernTemplate from "./templates/ModernTemplate";

import "./OptimizeResume.css";

function OptimizeResume() {
  const API = import.meta.env.VITE_API_URL;
  console.log("API URL:", API);

  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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

      setResult(data);
    } catch (err) {
      console.error("Optimization Error:", err);
      alert(err.message || "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const renderSelectedTemplate = () => {
    if (!result) return null;

    switch (selectedTemplate) {
      case "classic":
        return <ClassicTemplate data={result} />;

      case "professional":
        return <ProfessionalTemplate data={result} />;

      case "modern":
        return <ModernTemplate data={result} />;

      default:
        return null;
    }
  };

  const handleExportPDF = () => {
    window.print();
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
            <button className="export-btn" onClick={handleExportPDF}>
              Export PDF
            </button>
          </div>

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

          <div className="resume-preview-container">
            {renderSelectedTemplate()}
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizeResume;