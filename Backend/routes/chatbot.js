const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/chat", async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            systemPrompt ||
            `You are HireLens AI Assistant, an expert career coach and interview preparation specialist. 
You help candidates prepare for interviews with detailed, practical, and confident answers.
Always be concise, professional, and encouraging.
Format responses clearly with sections when listing multiple items.`,
        },
        ...messages,
      ],
    });

    const reply = completion.choices[0]?.message?.content || "";
    res.json({ reply });
  } catch (err) {
    console.error("Groq API error:", err.message);
    res.status(500).json({ error: "Failed to get response from AI." });
  }
});

router.post("/chat/resume-questions", async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: "resumeText is required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer. Given a candidate's resume, generate relevant interview questions grouped by project or skill section. For each question, also provide a strong answer the candidate can use. Format clearly with project/section headings, bullet questions, and answers.`,
        },
        {
          role: "user",
          content: `Here is the candidate's resume:\n\n${resumeText}\n\nGenerate interview questions with answers based on this resume.`,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content || "";
    res.json({ reply });
  } catch (err) {
    console.error("Groq resume questions error:", err.message);
    res.status(500).json({ error: "Failed to generate resume questions." });
  }
});

module.exports = router;