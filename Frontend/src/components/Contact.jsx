import { useState } from "react";
import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [formStatus, setFormStatus] = useState({ loading: false, success: "", error: "" });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setFormStatus({ loading: true, success: "", error: "" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setFormStatus({ loading: false, success: data.message, error: "" });
        setFormData({ name: "", email: "", message: "" });
      } else {
        setFormStatus({ loading: false, success: "", error: data.error });
      }
    } catch {
      setFormStatus({ loading: false, success: "", error: "Network error. Please try again." });
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-header">
        <div className="contact-tag">Get in Touch</div>
        <h1 className="contact-title">Contact <span>Us</span></h1>
        <p className="contact-subtitle">
          Have a question, feedback, or just want to say hi? We'd love to hear from you.
        </p>
      </div>

      <div className="contact-card">
        <div className="contact-form-side">
          <div className="cf-group">
            <label>Your Name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="cf-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="cf-group">
            <label>Your Query</label>
            <textarea
              rows="5"
              name="message"
              placeholder="Write your message here…"
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          {formStatus.success && (
            <div className="cf-success">✅ {formStatus.success}</div>
          )}
          {formStatus.error && (
            <div className="cf-error">❌ {formStatus.error}</div>
          )}

          <button
            className="cf-submit"
            onClick={handleSubmit}
            disabled={formStatus.loading}
          >
            {formStatus.loading ? "Sending…" : "Send Message →"}
          </button>
        </div>

        <div className="contact-info-side">
          <div className="ci-card">
            <div className="ci-icon">📧</div>
            <div>
              <div className="ci-label">Email Us</div>
              <div className="ci-value">mahanthisowmya35@gmail.com</div>
            </div>
          </div>
          <div className="ci-card">
            <div className="ci-icon">📱</div>
            <div>
              <div className="ci-label">Call / WhatsApp</div>
              <div className="ci-value">+91 98765 43210</div>
            </div>
          </div>
          <div className="ci-card">
            <div className="ci-icon">🕐</div>
            <div>
              <div className="ci-label">Response Time</div>
              <div className="ci-value">Within 24 hours</div>
            </div>
          </div>

          <div className="ci-note">
            <p>We're here to help you land your dream job. Reach out anytime and our team will get back to you promptly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;