const groq = require("../config/groqConfig");

/* ─── Robust JSON Auto-Repair Functions ─── */
function cleanAndCloseJSON(str) {
  let s = str.trim().replace(/,\s*([\]}])/g, "$1");
  let inString = false;
  let stack = [];

  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    const prev = s[i - 1];

    if (char === '"' && prev !== '\\') {
      inString = !inString;
    } else if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' && stack[stack.length - 1] === '{') {
        stack.pop();
      } else if (char === ']' && stack[stack.length - 1] === '[') {
        stack.pop();
      }
    }
  }

  if (inString) s += '"';
  s = s.replace(/,\s*$/, "");

  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '{') s += '}';
    else if (last === '[') s += ']';
  }

  return s.replace(/,\s*([\]}])/g, "$1");
}

function safeParseJSON(rawStr) {
  if (!rawStr) throw new Error("Empty AI response");

  let str = rawStr.trim();
  const firstBrace = str.indexOf("{");
  const lastBrace = str.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    str = str.slice(firstBrace, lastBrace + 1);
  }

  // 1. Direct parse
  try {
    return JSON.parse(str);
  } catch (_) {}

  // 2. Trailing comma cleanup
  let cleaned = str.replace(/,\s*([\]}])/g, "$1");
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // 3. Repair incomplete or unclosed JSON
  let repaired = cleanAndCloseJSON(str);
  try {
    return JSON.parse(repaired);
  } catch (_) {}

  return JSON.parse(cleaned);
}

const optimizeWithGroq = async (
  resumeText,
  jobDescription,
  template
) => {
  try {
    console.log("Starting ATS resume optimization...");

    const safeResume = (resumeText || "").trim().slice(0, 8000);
    const safeJd = (jobDescription || "").trim().slice(0, 3500);

    const prompt = `
You are HireLens AI Resume Optimizer, an advanced ATS resume rewriting engine.

RESUME CONTENT:
${safeResume}

TARGET JOB DESCRIPTION:
${safeJd}

SELECTED TEMPLATE:
${template || "modern"}

OBJECTIVES:
1. Rewrite and elevate the resume content to achieve a high ATS compatibility match (88-97) for the target role.
2. ABSOLUTE TRUTH: Never invent fake companies, fake degrees, or fake projects. Enhance technical wording, action verbs, and quantifiable impact.
3. Align keywords from the Job Description naturally into the Summary, Skills, Projects, and Experience sections.
4. Summary: 3-4 recruiter-grade sentences (70-120 words) with clear technical stack and value proposition.
5. Projects: 2-4 key projects. Each project should have 3-4 bullet points highlighting architecture, technologies used, and measurable results.
6. Experience / Internships: 2-3 entries with 3-4 professional bullet points highlighting practical problem solving.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this exact schema:

{
  "atsScore": 93,
  "template": "${template || "modern"}",
  "name": "",
  "contact": "",
  "role": "",
  "summary": "",
  "education": [
    {
      "degree": "",
      "institution": "",
      "period": "",
      "cgpa": ""
    }
  ],
  "skills": [],
  "projects": [
    {
      "title": "",
      "description": []
    }
  ],
  "experience": [
    {
      "role": "",
      "company": "",
      "duration": "",
      "responsibilities": []
    }
  ],
  "certifications": [],
  "additionalInfo": [],
  "missingKeywords": []
}

STRICT:
- Output JSON only.
- No markdown code blocks, no backticks, no explanations.
`;

    // Query active Groq models
    let activeIds = [];
    try {
      const list = await groq.models.list();
      activeIds = (list.data || []).map(m => m.id);
    } catch (_) {}

    // Prioritized model list
    const candidateModels = [
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "allam-2-7b"
    ];

    const validModels = candidateModels.filter(m => activeIds.length === 0 || activeIds.includes(m));
    const uniqueModels = validModels.length > 0 ? validModels : candidateModels;

    let parsed = null;
    let lastError = null;

    for (const m of uniqueModels) {
      try {
        console.log(`>>> ATTEMPTING OPTIMIZE WITH GROQ MODEL: ${m}`);

        const tokenLimit = m.includes("qwen") ? 1400 : 1800;

        const createParams = {
          messages: [
            {
              role: "system",
              content: "You are an ATS resume rewriting engine. You MUST output ONLY a valid JSON object matching the requested schema. Never output markdown, never output thinking tags, and never output conversational text."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: m,
          temperature: 0.2,
          max_tokens: tokenLimit
        };

        let completion;
        try {
          completion = await groq.chat.completions.create({
            ...createParams,
            response_format: { type: "json_object" }
          });
        } catch (_) {
          completion = await groq.chat.completions.create(createParams);
        }

        let raw = completion?.choices?.[0]?.message?.content || "";
        console.log(`>>> GROQ OPTIMIZE RESPONSE FROM ${m} (length ${raw.length})`);

        if (!raw || raw.trim().length === 0) {
          console.warn(`Model ${m} returned empty content, trying next candidate model...`);
          continue;
        }

        raw = raw
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/```json/gi, "")
          .replace(/```/gi, "")
          .trim();

        parsed = safeParseJSON(raw);
        console.log(`>>> GROQ OPTIMIZE SUCCESS & VALID JSON FROM MODEL: ${m}`);
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${m} failed:`, err.message);
      }
    }

    if (!parsed) {
      throw new Error("Could not optimize resume from AI: " + (lastError?.message || "Empty response from models"));
    }

    parsed.atsScore = Math.max(85, Math.min(99, Number(parsed.atsScore) || 92));
    parsed.template = template || parsed.template || "modern";
    parsed.name = parsed.name || "";
    parsed.contact = typeof parsed.contact === "object" ? JSON.stringify(parsed.contact) : (parsed.contact || "");
    parsed.role = parsed.role || "";
    parsed.summary = parsed.summary || "";
    parsed.education = Array.isArray(parsed.education) ? parsed.education : [];
    parsed.skills = Array.isArray(parsed.skills) ? parsed.skills : [];
    parsed.projects = Array.isArray(parsed.projects) ? parsed.projects : [];
    parsed.experience = Array.isArray(parsed.experience) ? parsed.experience : [];
    parsed.certifications = Array.isArray(parsed.certifications) ? parsed.certifications : [];
    parsed.additionalInfo = Array.isArray(parsed.additionalInfo) ? parsed.additionalInfo : [];
    parsed.missingKeywords = Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [];

    return parsed;
  } catch (error) {
    console.error("OPTIMIZE SERVICE ERROR:", error);
    throw error;
  }
};

module.exports = optimizeWithGroq;