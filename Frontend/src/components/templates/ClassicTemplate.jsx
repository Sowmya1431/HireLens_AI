import React from "react";
import "./ResumeTemplates.css";

function ClassicTemplate({ data, pageMode = "fresher" }) {
  if (!data) return null;

  const hasExperience = Array.isArray(data.experience) && data.experience.length > 0;
  const isOnlyInternships = hasExperience && !data.experience.some((exp) => {
    const role = (typeof exp === "object" ? (exp.role || exp.title || "") : String(exp)).toLowerCase();
    return !role.includes("intern") && !role.includes("trainee") && !role.includes("student") && role.trim().length > 0;
  });

  const experienceHeading = isOnlyInternships ? "INTERNSHIPS" : "WORK EXPERIENCE";

  return (
    <div 
      className={`resume classic ${pageMode === "fresher" ? "fresher-mode" : "experienced-mode"}`} 
      suppressContentEditableWarning={true}
    >
      {/* Header */}
      <div className="classic-header">
        <h1>{data.name || "Candidate Name"}</h1>
        <p>{data.contact || "email@gmail.com | 9876543210 | India"}</p>
      </div>

      {/* Summary */}
      {data.summary && (
        <section className="classic-section">
          <h2>PROFESSIONAL SUMMARY</h2>
          <p className="classic-summary">{data.summary}</p>
        </section>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section className="classic-section">
          <h2>EDUCATION</h2>

          {data.education.map((edu, i) => (
            <div key={i} className="classic-block">
              {typeof edu === "object" && edu !== null ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}>
                    <span>{edu.degree || edu.field ? `${edu.degree || ''}${edu.degree && edu.field ? ' in ' : ''}${edu.field || ''}` : "Education"}</span>
                    {(edu.duration || edu.period || edu.year) && <span>{edu.duration || edu.period || edu.year}</span>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontStyle: "italic", fontSize: "12.5px", marginTop: "2px" }}>
                    {(edu.university || edu.institution || edu.college) && <span>{edu.university || edu.institution || edu.college}</span>}
                    {(edu.gpa || edu.cgpa) && <span>GPA: {edu.gpa || edu.cgpa}</span>}
                  </div>
                </div>
              ) : (
                <p>{edu}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Experience / Internships */}
      {hasExperience && (
        <section className="classic-section">
          <h2>{experienceHeading}</h2>

          {data.experience.map((exp, i) => (
            <div key={i} className="classic-block">
              {typeof exp === "object" && exp !== null ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}>
                    <span>{exp.role || exp.title || "Position"} - {exp.company || "Company"}</span>
                    {(exp.duration || exp.period) && <span>{exp.duration || exp.period}</span>}
                  </div>
                  {exp.responsibilities && (
                    <ul style={{ marginTop: "3px" }}>
                      {Array.isArray(exp.responsibilities) ? (
                        exp.responsibilities.map((resp, idx) => <li key={idx}>{resp}</li>)
                      ) : (
                        <li>{exp.responsibilities}</li>
                      )}
                    </ul>
                  )}
                  {!exp.responsibilities && (exp.description || exp.desc) && (
                    <ul style={{ marginTop: "3px" }}>
                      {Array.isArray(exp.description || exp.desc) ? (
                        (exp.description || exp.desc).map((resp, idx) => <li key={idx}>{resp}</li>)
                      ) : (
                        <li>{exp.description || exp.desc}</li>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <ul>
                  <li>{exp}</li>
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <section className="classic-section">
          <h2>PROJECTS</h2>

          {data.projects.map((project, i) => (
            <div key={i} className="classic-project">
              <h3>{project.title}</h3>

              <ul>
                {Array.isArray(project.description)
                  ? project.description.map((item, idx) => (
                      <li key={idx}>
                        {typeof item === "object" && item !== null
                          ? (item.desc || item.description || JSON.stringify(item))
                          : item}
                      </li>
                    ))
                  : <li>
                      {typeof project.description === "object" && project.description !== null
                        ? (project.description.desc || project.description.description || JSON.stringify(project.description))
                        : project.description}
                    </li>}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {data.skills && data.skills.length > 0 && (
        <section className="classic-section">
          <h2>SKILLS</h2>
          <p>
            {data.skills
              .map((skill) =>
                typeof skill === "object" && skill !== null
                  ? (skill.name || skill.title || JSON.stringify(skill))
                  : skill
              )
              .join(", ")}
          </p>
        </section>
      )}

      {/* Certifications */}
      {data.certifications && data.certifications.length > 0 && (
        <section className="classic-section">
          <h2>CERTIFICATIONS</h2>

          {data.certifications.map((cert, i) => (
            <p key={i}>
              • {typeof cert === "object" && cert !== null
                ? `${cert.name || cert.title || ""}${cert.provider ? ` (${cert.provider})` : ""}${cert.date || cert.period ? ` - ${cert.date || cert.period}` : ""}`
                : cert}
            </p>
          ))}
        </section>
      )}

      {/* Additional */}
      {data.additionalInfo && data.additionalInfo.length > 0 && (
        <section className="classic-section">
          <h2>ADDITIONAL INFORMATION</h2>

          {data.additionalInfo.map((item, i) => (
            <p key={i}>
              • {typeof item === "object" && item !== null
                ? (item.title || item.name || item.value || JSON.stringify(item))
                : item}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}

export default React.memo(ClassicTemplate);