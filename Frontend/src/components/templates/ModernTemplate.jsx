import "./ResumeTemplates.css";

function ModernTemplate({ data }) {
  return (
    <div className="resume modern" contentEditable={true} suppressContentEditableWarning={true}>
      <div className="modern-header">
        <h1>{data.name || "Candidate Name"}</h1>
        <h3>{data.role || "Software Engineer"}</h3>

        <p className="modern-contact">
          {data.contact || "email@gmail.com | 9876543210 | India"}
        </p>

        <div className="modern-bar"></div>
      </div>

      <section className="modern-section">
        <h2>PROFESSIONAL SUMMARY</h2>
        <p>{data.summary}</p>
      </section>

      <section className="modern-section">
        <h2>INTERNSHIPS / WORK EXPERIENCE</h2>

        {data.experience?.map((exp, i) => (
          <div key={i} className="modern-block">
            {typeof exp === "object" && exp !== null ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13.5px" }}>
                  <span>{exp.role || exp.title || "Position"} | {exp.company || "Company"}</span>
                  {exp.duration && <span style={{ color: "#718096" }}>{exp.duration}</span>}
                </div>
                {exp.responsibilities && (
                  <ul style={{ marginTop: "4px", paddingLeft: "18px" }}>
                    {Array.isArray(exp.responsibilities) ? (
                      exp.responsibilities.map((resp, idx) => <li key={idx}>{resp}</li>)
                    ) : (
                      <li>{exp.responsibilities}</li>
                    )}
                  </ul>
                )}
                {!exp.responsibilities && (exp.description || exp.desc) && (
                  <ul style={{ marginTop: "4px", paddingLeft: "18px" }}>
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

      <section className="modern-section">
        <h2>EDUCATION</h2>

        {data.education?.map((edu, i) => (
          <div key={i} className="modern-block">
            {typeof edu === "object" && edu !== null ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13.5px" }}>
                  <span>{edu.degree || edu.field ? `${edu.degree || ''}${edu.degree && edu.field ? ' in ' : ''}${edu.field || ''}` : "Education"}</span>
                  {edu.duration && <span style={{ color: "#718096" }}>{edu.duration}</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "2px" }}>
                  {edu.university && <span>{edu.university}</span>}
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
              </div>
            ) : (
              <p>{edu}</p>
            )}
          </div>
        ))}
      </section>

      <section className="modern-section">
        <h2>SKILLS</h2>

        <div className="modern-skills">
          {data.skills?.map((skill, i) => (
            <span key={i} className="modern-chip">
              {typeof skill === "object" && skill !== null
                ? (skill.name || skill.title || JSON.stringify(skill))
                : skill}
            </span>
          ))}
        </div>
      </section>

      <section className="modern-section">
        <h2>PROJECTS</h2>

        {data.projects?.map((project, i) => (
          <div key={i} className="modern-block">
            <h3>{project.title}</h3>

            {Array.isArray(project.description) ? (
              <ul>
                {project.description.map((desc, idx) => (
                  <li key={idx}>
                    {typeof desc === "object" && desc !== null
                      ? (desc.desc || desc.description || JSON.stringify(desc))
                      : desc}
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

      <section className="modern-section">
        <h2>CERTIFICATIONS</h2>

        {data.certifications?.map((cert, i) => (
          <p key={i}>
            • {typeof cert === "object" && cert !== null
              ? `${cert.name || cert.title || ""}${cert.provider ? ` (${cert.provider})` : ""}${cert.date ? ` - ${cert.date}` : ""}`
              : cert}
          </p>
        ))}
      </section>

      {data.additionalInfo?.length > 0 && (
        <section className="modern-section">
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

export default ModernTemplate;