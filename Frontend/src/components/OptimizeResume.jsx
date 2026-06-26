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

  const handleRewrite = async () => {
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

  return (
    <div style={{ padding: "30px" }}>
      <h1>Optimize Resume</h1>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setResume(e.target.files[0])}
      />

      <br />
      <br />

      <textarea
        rows="10"
        cols="80"
        placeholder="Paste Job Description"
        value={jobDescription}
        onChange={(e) =>
          setJobDescription(e.target.value)
        }
      />

      <h3>Select Template</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginTop: "20px"
        }}
      >
        {templates.map((temp) => (
          <div
            key={temp.id}
            onClick={() => setSelectedTemplate(temp.id)}
            style={{
              border:
                selectedTemplate === temp.id
                  ? "3px solid #4cc9ff"
                  : "1px solid #444",
              borderRadius: "16px",
              padding: "12px",
              cursor: "pointer",
              background: "#111827"
            }}
          >
            <img
              src={temp.image}
              alt={temp.name}
              style={{
                width: "100%",
                height: "280px",
                objectFit: "cover",
                borderRadius: "10px"
              }}
            />

            <h4
              style={{
                color: "white",
                textAlign: "center",
                marginTop: "12px"
              }}
            >
              {temp.name}
            </h4>
          </div>
        ))}
      </div>

      <br />

      <button onClick={handleRewrite}>
        Rewrite Resume
      </button>

      {loading && <h3>Rewriting...</h3>}

      {result && (
        <div className="optimized-result">
          <div className="score-box">
            <h2>ATS Score</h2>
            <div className="score-circle">
              {result.atsScore || 0}
            </div>
          </div>

          {renderSelectedTemplate()}

          <section>
            <h3>Missing Keywords</h3>
            <div className="missing-box">
              {result.missingKeywords?.map(
                (keyword, i) => (
                  <span key={i} className="missing-pill">
                    {keyword}
                  </span>
                )
              )}
            </div>
          </section>

          <button className="export-btn">
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default OptimizeResume;