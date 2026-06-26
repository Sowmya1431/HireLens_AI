import "./ResumeTemplates.css";

function ClassicTemplate({ data }) {
  return (
    <div className="resume classic">
      {/* Header */}
      <div className="classic-header">
        <h1>{data.name || "Candidate Name"}</h1>
        <p>{data.contact || "email@gmail.com | 9876543210 | India"}</p>
      </div>

      {/* Summary */}
      <section className="classic-section">
        <p className="classic-summary">{data.summary}</p>
      </section>

      {/* Education */}
      <section className="classic-section">
        <h2>EDUCATION</h2>

        {data.education?.map((edu, i) => (
          <div key={i} className="classic-block">
            <p>{edu}</p>
          </div>
        ))}
      </section>

      {/* Experience */}
      <section className="classic-section">
        <h2>INTERNSHIPS / EXPERIENCE</h2>

        {data.experience?.map((exp, i) => (
          <div key={i} className="classic-block">
            <ul>
              <li>{exp}</li>
            </ul>
          </div>
        ))}
      </section>

      {/* Projects */}
      <section className="classic-section">
        <h2>PROJECTS</h2>

        {data.projects?.map((project, i) => (
          <div key={i} className="classic-project">
            <h3>{project.title}</h3>

            <ul>
              {Array.isArray(project.description)
                ? project.description.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))
                : <li>{project.description}</li>}
            </ul>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section className="classic-section">
        <h2>SKILLS</h2>
        <p>{data.skills?.join(", ")}</p>
      </section>

      {/* Certifications */}
      <section className="classic-section">
        <h2>CERTIFICATIONS</h2>

        {data.certifications?.map((cert, i) => (
          <p key={i}>• {cert}</p>
        ))}
      </section>

      {/* Additional */}
      {data.additionalInfo?.length > 0 && (
        <section className="classic-section">
          <h2>ADDITIONAL INFORMATION</h2>

          {data.additionalInfo.map((item, i) => (
            <p key={i}>• {item}</p>
          ))}
        </section>
      )}
    </div>
  );
}

export default ClassicTemplate;