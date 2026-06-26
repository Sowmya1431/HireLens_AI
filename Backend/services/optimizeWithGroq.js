const groq = require("../config/groqConfig");
const analyzeWithGroq = require("./groqService");

const optimizeWithGroq = async (
  resumeText,
  jobDescription,
  template
) => {
  try {
    console.log("Starting ATS analysis...");

    const atsResult = await analyzeWithGroq(
      resumeText,
      jobDescription
    );

    console.log("ATS analysis completed");

    const prompt = `
You are HireLens AI Resume Optimizer.

INPUTS:
Resume:
${resumeText}

Job Description:
${jobDescription}

Selected Template:
${template}

ATS Analysis:
${JSON.stringify(atsResult)}

RULES:
- Never invent fake skills/experience
- Preserve truth
- Return ONLY valid JSON
- No markdown
- No explanations

OUTPUT JSON:
{
  "atsScore": 0,
  "template": "",
  "name": "",
  "contact": "",
  "role": "",
  "summary": "",
  "education": [],
  "skills": [],
  "projects": [],
  "experience": [],
  "certifications": [],
  "additionalInfo": [],
  "missingKeywords": []
}
`;

    let completion;

    try {
      completion =
        await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.2
        });
    } catch (err) {
      console.error("GROQ API ERROR:", err);
      throw new Error("Groq API request failed");
    }

    let response =
      completion?.choices?.[0]?.message?.content;

    if (!response) {
      throw new Error("Empty Groq response");
    }

    console.log("RAW GROQ RESPONSE:");
    console.log(response);

    response = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(response);
    } catch (err) {
      console.log("Direct parse failed. Trying fallback...");

      const first = response.indexOf("{");
      const last = response.lastIndexOf("}");

      if (first === -1 || last === -1) {
        throw new Error(
          "No valid JSON found in Groq response"
        );
      }

      const json = response.slice(first, last + 1);

      try {
        parsed = JSON.parse(json);
      } catch (parseErr) {
        console.error("Fallback parse failed:", parseErr);
        throw new Error("Invalid JSON from Groq");
      }
    }

    parsed.atsScore ||= 0;
    parsed.template ||= template;
    parsed.name ||= "";
    parsed.contact ||= "";
    parsed.role ||= "";
    parsed.summary ||= "";
    parsed.education ||= [];
    parsed.skills ||= [];
    parsed.projects ||= [];
    parsed.experience ||= [];
    parsed.certifications ||= [];
    parsed.additionalInfo ||= [];
    parsed.missingKeywords ||= [];

    return parsed;
  } catch (error) {
    console.error("OPTIMIZE SERVICE ERROR:", error);
    throw error;
  }
};

module.exports = optimizeWithGroq;