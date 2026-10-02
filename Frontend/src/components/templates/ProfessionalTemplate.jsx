import React from "react";
import "./ResumeTemplates.css";

function ProfessionalTemplate({ data, pageMode = "fresher" }) {
  if (!data) return null;

  const hasExperience = Array.isArray(data.experience) && data.experience.length > 0;
  const isOnlyInternships = hasExperience && !data.experience.some((exp) => {
    const role = (typeof exp === "object" ? (exp.role || exp.title || "") : String(exp)).toLowerCase();
    return !role.includes("intern") && !role.includes("trainee") && !role.includes("student") && role.trim().length > 0;
  });

  const experienceHeading = isOnlyInternships ? "INTERNSHIPS" : "WORK EXPERIENCE";

  return (
    <div 
      className={`resume professional ${pageMode === "fresher" ? "fresher-mode" : "experienced-mode"}`} 
      suppressContentEditableWarning={true}
    >
      {/* Header */}
      <div className="pro-header">
        <h1>{data.name || "Candidate Name"}</h1>
        <p>{data.role || "Software Engineer"}</p>
        {data.contact && <p className="pro-contact">{data.contact}</p>}
      </div>

      <div className="pro-divider"></div>

      <div className="pro-grid">
        {/* LEFT COLUMN */}
        <div className="pro-left">
          {data.summary && (
            <section>
              <h2>PROFESSIONAL SUMMARY</h2>
              <p>{data.summary}</p>
            </section>
          )}

          {data.projects && data.projects.length > 0 && (
            <section>
              <h2>PROJECTS</h2>
              {data.projects.map((project, i) => (
                <div key={i} className="pro-block">
                  <h3>{project.title}</h3>

                  {Array.isArray(project.description) ? (
                    <ul>
                      {project.description.map((d, idx) => (
                        <li key={idx}>
                          {typeof d === "object" && d !== null
                            ? (d.desc || d.description || JSON.stringify(d))
                            : d}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      {typeof project.description === "object" && project.description !== null
                        ? (project.description.desc || project.description.description || JSON.stringify(project.description))
                        : project.description}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {hasExperience && (
            <section>
              <h2>{experienceHeading}</h2>
              {data.experience.map((exp, i) => (
                <div key={i} className="pro-block">
                  {typeof exp === "object" && exp !== null ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13.5px" }}>
                        <span>{exp.role || exp.title || "Position"} - {exp.company || "Company"}</span>
                        {(exp.duration || exp.period) && <span style={{ color: "#9a7a2e" }}>{exp.duration || exp.period}</span>}
                      </div>
                      {exp.responsibilities && (
                        <ul style={{ marginTop: "3px", paddingLeft: "16px" }}>
                          {Array.isArray(exp.responsibilities) ? (
                            exp.responsibilities.map((resp, idx) => <li key={idx}>{resp}</li>)
                          ) : (
                            <li>{exp.responsibilities}</li>
                          )}
                        </ul>
                      )}
                      {!exp.responsibilities && (exp.description || exp.desc) && (
                        <ul style={{ marginTop: "3px", paddingLeft: "16px" }}>
                          {Array.isArray(exp.description || exp.desc) ? (
                            (exp.description || exp.desc).map((resp, idx) => <li key={idx}>{resp}</li>)
                          ) : (
                            <li>{exp.description || exp.desc}</li>
                          )}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p>{exp}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="pro-right">
          {data.education && data.education.length > 0 && (
            <section>
              <h2>EDUCATION</h2>
              {data.education.map((edu, i) => (
                <div key={i} className="pro-block">
                  {typeof edu === "object" && edu !== null ? (
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "13px" }}>
                        {edu.degree || edu.field ? `${edu.degree || ''}${edu.degree && edu.field ? ' in ' : ''}${edu.field || ''}` : "Education"}
                      </div>
                      <div style={{ color: "#555", fontSize: "12px" }}>{edu.university || edu.institution || edu.college}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888", marginTop: "2px" }}>
                        {(edu.duration || edu.period || edu.year) && <span>{edu.duration || edu.period || edu.year}</span>}
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

          {data.skills && data.skills.length > 0 && (
            <section>
              <h2>SKILLS</h2>
              <ul>
                {data.skills.map((skill, i) => (
                  <li key={i}>
                    {typeof skill === "object" && skill !== null
                      ? (skill.name || skill.title || JSON.stringify(skill))
                      : skill}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.certifications && data.certifications.length > 0 && (
            <section>
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

          {data.additionalInfo && data.additionalInfo.length > 0 && (
            <section>
              <h2>ADDITIONAL INFO</h2>
              <ul>
                {data.additionalInfo.map((item, i) => (
                  <li key={i}>
                    {typeof item === "object" && item !== null
                      ? (item.title || item.name || item.value || JSON.stringify(item))
                      : item}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ProfessionalTemplate);