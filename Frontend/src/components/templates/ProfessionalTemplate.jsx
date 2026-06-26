import "./ResumeTemplates.css";

function ProfessionalTemplate({ data }) {
  return (
    <div className="resume professional">
      {/* Header */}
      <div className="pro-header">
        <h1>{data.name || "Candidate Name"}</h1>
        <p>{data.role || "Software Engineer"}</p>
      </div>

      <div className="pro-divider"></div>

      <div className="pro-grid">
        {/* LEFT */}
        <div className="pro-left">
          <section>
            <h2>CAREER SUMMARY</h2>
            <p>{data.summary}</p>
          </section>

          <section>
            <h2>PROJECTS</h2>
            {data.projects?.map((project, i) => (
              <div key={i} className="pro-block">
                <h3>{project.title}</h3>

                {Array.isArray(project.description) ? (
                  <ul>
                    {project.description.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{project.description}</p>
                )}
              </div>
            ))}
          </section>

          <section>
            <h2>INTERNSHIPS</h2>
            {data.experience?.map((exp, i) => (
              <div key={i} className="pro-block">
                <p>{exp}</p>
              </div>
            ))}
          </section>
        </div>

        {/* RIGHT */}
        <div className="pro-right">
          <section>
            <h2>CONTACT</h2>
            <p>{data.contact || "email@gmail.com"}</p>
          </section>

          <section>
            <h2>EDUCATION</h2>
            {data.education?.map((edu, i) => (
              <p key={i}>{edu}</p>
            ))}
          </section>

          <section>
            <h2>SKILLS</h2>
            <ul>
              {data.skills?.map((skill, i) => (
                <li key={i}>{skill}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2>CERTIFICATIONS</h2>
            {data.certifications?.map((cert, i) => (
              <p key={i}>• {cert}</p>
            ))}
          </section>

          {data.additionalInfo?.length > 0 && (
            <section>
              <h2>ADDITIONAL</h2>
              <ul>
                {data.additionalInfo.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfessionalTemplate;