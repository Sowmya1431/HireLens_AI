const { sendContactEmail } = require("../services/emailService");

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and message are all required.",
      });
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Message must be at least 10 characters.",
      });
    }

    await sendContactEmail(name.trim(), email.trim(), message.trim());

    return res.status(200).json({
      success: true,
      message: "Your message has been sent! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Contact email error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to send message. Please try again later.",
    });
  }
};

module.exports = { sendContactMessage };