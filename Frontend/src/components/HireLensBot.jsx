import { useState, useRef, useEffect } from "react";
import "./HireLensBot.css";
import botAvatar from "./templates/bot.jpg";

const API = "/api/chatbot";

const HR_QUESTIONS = [
  "Tell me about yourself.",
  "Why should we hire you?",
  "What are your greatest strengths?",
  "What is your biggest weakness?",
  "Where do you see yourself in 5 years?",
];

export default function HireLensBot() {
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState("home");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [skill, setSkill] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeForJD, setResumeForJD] = useState(null);
  const [interviewType, setInterviewType] = useState(null);
  const chatEndRef = useRef(null);
  const fileRef = useRef(null);
  const jdFileRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function reset() {
    setScreen("home");
    setMessages([]);
    setInput("");
    setSkill("");
    setSkillInput("");
    setJdText("");
    setResumeFile(null);
    setResumeForJD(null);
    setInterviewType(null);
    setLoading(false);
  }

  function addMessage(role, text) {
    setMessages((prev) => [...prev, { role, text }]);
  }

  async function callChat(userText, systemPrompt, historyOverride) {
    const history = historyOverride || messages;
    const msgs = [
      ...history.map((m) => ({ role: m.role, content: m.text })),
      { role: "user", content: userText },
    ];
    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, systemPrompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data.reply;
  }

  async function handleHRInterview() {
    setScreen("chat");
    setInterviewType("hr");
    setLoading(true);
    const systemPrompt = `You are a career coach helping a candidate prepare for an HR interview.
Generate interview-ready answers for the following HR questions. 
For each question provide:
- The question as a heading
- A short crisp answer (3-5 sentences) the candidate can use
- A tip to personalize it
Format cleanly.`;
    const userMsg = `Generate answers for these HR interview questions:\n${HR_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
    try {
      addMessage("user", "Generate HR interview questions with answers");
      const reply = await callChat(userMsg, systemPrompt, []);
      addMessage("assistant", reply);
    } catch {
      addMessage("assistant", "Something went wrong. Try again.");
    }
    setLoading(false);
  }

  async function handleResumeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    setScreen("chat");
    setInterviewType("resume");
    setLoading(true);
    addMessage("user", `Uploaded resume: ${file.name}`);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const extractRes = await fetch("/api/ats/extract-text", {
        method: "POST",
        body: formData,
      });
      let resumeText = "";
      if (extractRes.ok) {
        const d = await extractRes.json();
        resumeText = d.text || "";
      }
      if (!resumeText) {
        resumeText = `Resume file: ${file.name} (text extraction unavailable — using filename context)`;
      }
      const chatRes = await fetch(`${API}/chat/resume-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });
      const data = await chatRes.json();
      addMessage("assistant", data.reply || "Could not generate questions.");
    } catch {
      addMessage("assistant", "Could not process resume. Please try again.");
    }
    setLoading(false);
  }

  async function handleSkillSubmit() {
    if (!skillInput.trim()) return;
    const s = skillInput.trim();
    setSkill(s);
    setSkillInput("");
    setScreen("chat");
    setInterviewType("skill");
    setLoading(true);
    const systemPrompt = `You are a technical interview coach. Generate interview questions for the skill provided, grouped into Beginner, Intermediate, and Advanced levels. For each question, provide a clear and detailed answer. Format with level headings and numbered questions.`;
    const userMsg = `Generate interview questions with answers for: ${s}`;
    addMessage("user", `Skill: ${s}`);
    try {
      const reply = await callChat(userMsg, systemPrompt, []);
      addMessage("assistant", reply);
    } catch {
      addMessage("assistant", "Could not generate skill questions.");
    }
    setLoading(false);
  }

  async function handleJDSubmit() {
    if (!jdText.trim()) return;
    setScreen("chat");
    setInterviewType("jd");
    setLoading(true);
    const systemPrompt = `You are an expert interview coach. Given a job description and optionally a resume, generate targeted interview questions the candidate is likely to face. Group by category (Technical, Behavioral, Role-specific). For each question provide a strong answer. Be specific to the JD.`;
    let userMsg = `Job Description:\n${jdText}`;
    if (resumeForJD) {
      userMsg += `\n\nCandidate's resume filename: ${resumeForJD.name} (use general best practices for resume-based answers)`;
    }
    addMessage("user", "Generate JD-based interview questions");
    try {
      const reply = await callChat(userMsg, systemPrompt, []);
      addMessage("assistant", reply);
    } catch {
      addMessage("assistant", "Could not generate JD questions.");
    }
    setLoading(false);
  }

  async function handleSendMessage() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    addMessage("user", text);
    setLoading(true);
    const systemPrompt =
      interviewType === "skill"
        ? `You are a technical interview coach specializing in ${skill}. Answer questions clearly and precisely.`
        : `You are HireLens AI Assistant, an expert career coach. Help the user with their career and interview preparation questions.`;
    try {
      const updatedHistory = [...messages, { role: "user", text }];
      const reply = await callChat(text, systemPrompt, updatedHistory);
      addMessage("assistant", reply);
    } catch {
      addMessage("assistant", "Something went wrong. Try again.");
    }
    setLoading(false);
  }

  function renderText(text) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h3 key={i} className="hlb-h3">{line.slice(3)}</h3>;
      if (line.startsWith("# ")) return <h2 key={i} className="hlb-h2">{line.slice(2)}</h2>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="hlb-bold">{line.slice(2, -2)}</p>;
      if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} className="hlb-bullet">• {line.slice(2)}</p>;
      if (/^\d+\.\s/.test(line)) return <p key={i} className="hlb-numbered">{line}</p>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} className="hlb-p">{line}</p>;
    });
  }

  return (
    <>
      <button
        className="hlb-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open HireLens AI Assistant"
      >
        <img src={botAvatar} alt="HireLens bot" style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover" }} />
      </button>

      {open && (
        <div className="hlb-popup">
          <div className="hlb-header">
            {screen !== "home" && (
              <button className="hlb-back" onClick={reset} aria-label="Go back">
                <i className="ti ti-arrow-left" aria-hidden="true" />
                Back
              </button>
            )}
            <div className="hlb-header-title">
              <img src={botAvatar} alt="" aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
              HireLens assistant
            </div>
            <button className="hlb-close" onClick={() => setOpen(false)} aria-label="Close">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>

          <div className="hlb-body">
            {screen === "home" && (
              <div className="hlb-home">
                <p className="hlb-greeting">How can I help you today?</p>
                <div className="hlb-options">
                  <button className="hlb-option" onClick={() => setScreen("interview-type")}>
                    <i className="ti ti-microphone" aria-hidden="true" />
                    Interview questions
                  </button>
                  <button className="hlb-option" onClick={() => { setScreen("chat"); setInterviewType("other"); addMessage("assistant", "Hi! I'm HireLens AI. Ask me anything about your career, resume, job search, or interview prep."); }}>
                    <i className="ti ti-message-circle" aria-hidden="true" />
                    Other
                  </button>
                </div>
              </div>
            )}

            {screen === "interview-type" && (
              <div className="hlb-home">
                <p className="hlb-greeting">Choose interview type</p>
                <div className="hlb-options">
                  <button className="hlb-option" onClick={handleHRInterview}>
                    <i className="ti ti-users" aria-hidden="true" />
                    HR interview
                  </button>
                  <button className="hlb-option" onClick={() => setScreen("resume-upload")}>
                    <i className="ti ti-file-text" aria-hidden="true" />
                    Resume based
                  </button>
                  <button className="hlb-option" onClick={() => setScreen("skill-input")}>
                    <i className="ti ti-code" aria-hidden="true" />
                    Skill based
                  </button>
                  <button className="hlb-option" onClick={() => setScreen("jd-input")}>
                    <i className="ti ti-briefcase" aria-hidden="true" />
                    JD based
                  </button>
                </div>
              </div>
            )}

            {screen === "resume-upload" && (
              <div className="hlb-home">
                <p className="hlb-greeting">Upload your resume PDF</p>
                <p className="hlb-sub">I'll generate interview questions based on your projects and skills.</p>
                <button className="hlb-upload-btn" onClick={() => fileRef.current?.click()}>
                  <i className="ti ti-upload" aria-hidden="true" />
                  Choose resume PDF
                </button>
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handleResumeUpload} />
              </div>
            )}

            {screen === "skill-input" && (
              <div className="hlb-home">
                <p className="hlb-greeting">Which skill to prepare for?</p>
                <input
                  className="hlb-input-field"
                  placeholder="e.g. React, Python, System Design..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSkillSubmit()}
                />
                <button className="hlb-upload-btn" onClick={handleSkillSubmit}>
                  <i className="ti ti-sparkles" aria-hidden="true" />
                  Generate questions
                </button>
              </div>
            )}

            {screen === "jd-input" && (
              <div className="hlb-home">
                <p className="hlb-greeting">Paste the job description</p>
                <textarea
                  className="hlb-textarea"
                  placeholder="Paste the full job description here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={5}
                />
                <button className="hlb-option hlb-option-sm" onClick={() => jdFileRef.current?.click()}>
                  <i className="ti ti-paperclip" aria-hidden="true" />
                  {resumeForJD ? resumeForJD.name : "Attach resume (optional)"}
                </button>
                <input ref={jdFileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setResumeForJD(e.target.files[0])} />
                <button className="hlb-upload-btn" onClick={handleJDSubmit} style={{ marginTop: 8 }}>
                  <i className="ti ti-sparkles" aria-hidden="true" />
                  Generate questions
                </button>
              </div>
            )}

            {screen === "chat" && (
              <div className="hlb-chat">
                {messages.map((m, i) => (
                  <div key={i} className={`hlb-msg hlb-msg-${m.role}`}>
                    {m.role === "assistant" && (
                      <div className="hlb-avatar">
                        <img src={botAvatar} alt="" aria-hidden="true" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div className="hlb-bubble">
                      {m.role === "assistant" ? renderText(m.text) : <p className="hlb-p">{m.text}</p>}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="hlb-msg hlb-msg-assistant">
                    <div className="hlb-avatar">
                      <img src={botAvatar} alt="" aria-hidden="true" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                    </div>
                    <div className="hlb-bubble hlb-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {screen === "chat" && (
            <div className="hlb-footer">
              <input
                className="hlb-chat-input"
                placeholder="Ask a follow-up..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={loading}
              />
              <button className="hlb-send" onClick={handleSendMessage} disabled={loading} aria-label="Send">
                <i className="ti ti-send" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}