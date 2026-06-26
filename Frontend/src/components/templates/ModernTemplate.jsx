import "./ResumeTemplates.css";

function ModernTemplate({ data }) {
  return (
    <div className="resume modern">
      <div className="modern-header">
        <h1>{data.name || "Candidate Name"}</h1>
        <h3>{data.role || "Software Engineer"}</h3>

        <p className="modern-contact">
          {data.contact || "email@gmail.com | 9876543210 | India"}
        </p>

        <div className="modern-bar"></div>
      </div>

      <section className="modern-section">
        <h2>PROFILE SUMMARY</h2>
        <p>{data.summary}</p>
      </section>

      <section className="modern-section">
        <h2>INTERNSHIPS / EXPERIENCE</h2>

        {data.experience?.map((exp, i) => (
          <div key={i} className="modern-block">
            <p>{exp}</p>
          </div>
        ))}
      </section>

      <section className="modern-section">
        <h2>EDUCATION</h2>

        {data.education?.map((edu, i) => (
          <p key={i}>{edu}</p>
        ))}
      </section>

      <section className="modern-section">
        <h2>SKILLS</h2>

        <div className="modern-skills">
          {data.skills?.map((skill, i) => (
            <span key={i} className="modern-chip">
              {skill}
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
                  <li key={idx}>{desc}</li>
                ))}
              </ul>
            ) : (
              <p>{project.description}</p>
            )}
          </div>
        ))}
      </section>

      <section className="modern-section">
        <h2>CERTIFICATIONS</h2>

        {data.certifications?.map((cert, i) => (
          <p key={i}>• {cert}</p>
        ))}
      </section>

      {data.additionalInfo?.length > 0 && (
        <section className="modern-section">
          <h2>ACHIEVEMENTS</h2>

          {data.additionalInfo.map((item, i) => (
            <p key={i}>• {item}</p>
          ))}
        </section>
      )}
    </div>
  );
}

export default ModernTemplate;