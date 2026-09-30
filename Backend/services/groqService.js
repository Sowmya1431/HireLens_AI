const groq = require("../config/groqConfig");

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
    } catch (_) { }

    // 2. Trailing comma cleanup
    let cleaned = str.replace(/,\s*([\]}])/g, "$1");
    try {
        return JSON.parse(cleaned);
    } catch (_) { }

    // 3. Repair incomplete or unclosed JSON
    let repaired = cleanAndCloseJSON(str);
    try {
        return JSON.parse(repaired);
    } catch (_) { }

    return JSON.parse(cleaned);
}

const analyzeWithGroq = async (resumeText, jobDescription) => {
    try {
        const safeResume = (resumeText || "").trim().slice(0, 8500);
        const safeJd = (jobDescription || "").trim().slice(0, 4500);

        const prompt = `
You are an expert ATS (Applicant Tracking System) Evaluation & Semantic Matching Engine.

TASK:
Accurately analyze the candidate's Resume against the Job Description (JD). Identify matching skills, missing skills, semantic equivalents, project relevance, and actionable qualitative feedback.

EXTRACTION & NORMALIZATION GUIDELINES:
1. EXTRACT CORE TECHNICAL SKILLS:
   - Extract real technical competencies: programming languages, frameworks, libraries, databases, cloud platforms, infrastructure/DevOps tools, and core system architectures.
   - DO NOT extract generic everyday programming actions or common buzzwords as separate required skills (e.g., do NOT extract 'error handling', 'CRUD operations', 'API integration', 'npm', 'fetch', 'axios', 'code review', 'debugging', 'unit testing', 'problem solving', 'communication').
   - Subsume sub-skills under their parent framework/language:
     * 'React Hooks', 'React Router', 'JSX' -> 'React'
     * 'HTML5' -> 'HTML'
     * 'CSS3' -> 'CSS'
     * 'Mongoose' -> 'MongoDB'
     * 'Express.js', 'Express' -> 'Express.js'
     * 'Node.js', 'Node' -> 'Node.js'
     * 'PostgreSQL', 'Postgres' -> 'PostgreSQL'
     * 'RESTful APIs', 'REST' -> 'REST APIs'
     * 'Git / GitHub' -> 'Git'
   - Extract between 10 to 20 truly distinct technical requirements from the Job Description (focusing on what recruiters actually screen for).

2. IMPORTANCE CLASSIFICATION (for every skill in requiredSkillsNormalized):
   - "critical": Core mandatory technologies explicitly required for this role (weight: 1.0)
   - "high": Essential technical skills needed for primary day-to-day deliverables (weight: 0.8)
   - "medium": Preferred, secondary, or framework-adjacent tools (weight: 0.5)
   - "low": Bonus or optional nice-to-have technologies (weight: 0.3)

3. SEMANTIC RELATED SKILLS:
   If a required skill is NOT in resumeSkillsNormalized, check if the candidate has a strong semantic substitute:
   - MySQL <-> PostgreSQL (Relational DB, weight 0.75)
   - AWS <-> Azure <-> GCP (Cloud Provider, weight 0.75)
   - MongoDB <-> DynamoDB <-> Cassandra (NoSQL, weight 0.75)
   - Jenkins <-> GitHub Actions <-> GitLab CI (CI/CD, weight 0.75)
   - React <-> Vue <-> Angular (Frontend, weight 0.6)
   - Express <-> NestJS <-> FastAPI (Backend, weight 0.6)
   Return each related match:
   {
     "required": "<required skill name>",
     "resumeEquivalent": "<matching skill name from resume>",
     "category": "<category name>",
     "weight": 0.75
   }

4. PROJECT & EXPERIENCE RELEVANCE SCORE (Scale 0 to 20):
   Evaluate the candidate's Projects and Work Experience sections against the JD:
   - 17-20: Highly Relevant — Candidate built applications directly using the target tech stack (e.g. MERN stack projects for a MERN stack role).
   - 12-16: Relevant — Candidate has solid software engineering projects with modern architecture, solving relevant problems.
   - 7-11: Partially Relevant — Technical projects in adjacent or slightly different domains.
   - 0-6: Unrelated — Non-technical or completely unrelated projects.
   CRITICAL: If the candidate has built relevant technical projects matching the core role stack, award 14-19 points. Never default to 0 for a technical candidate.

5. QUALITATIVE ANALYSIS (3 to 5 clear, specific bullet points each):
   - "strengths": 3-5 specific bullet points highlighting matching skills and relevant project achievements.
   - "weaknesses": 3-5 specific, genuine gaps in the candidate's stack or experience relative to the JD.
   - "suggestions": 3-5 actionable, high-impact improvements to boost the candidate's ATS match and interview chances.

RESPONSE FORMAT:
Output ONLY a valid JSON object matching this exact schema:
{
  "resumeSkillsRaw": [],
  "resumeSkillsNormalized": [],
  "requiredSkillsRaw": [],
  "requiredSkillsNormalized": [],
  "requiredSkillsDetailed": [
    {
      "skill": "Node.js",
      "importance": "critical",
      "weight": 1.0
    }
  ],
  "relatedSkills": [
    {
      "required": "PostgreSQL",
      "resumeEquivalent": "MySQL",
      "category": "Relational Databases",
      "weight": 0.75
    }
  ],
  "projectRelevanceScore": 16,
  "strengths": [
    "Strong hands-on experience in core technologies required by the role",
    "Project portfolio demonstrates practical end-to-end full-stack implementation",
    "Well-organized technical background with relevant tooling"
  ],
  "weaknesses": [
    "Lacks direct mention of specific cloud infrastructure tools (e.g., AWS, Docker)",
    "Could provide more quantified production metrics in project descriptions"
  ],
  "suggestions": [
    "Incorporate missing core keywords into your skills and project summaries",
    "Quantify project achievements with percentages, latency reductions, or user scale"
  ]
}

RESUME:
${safeResume}

JOB DESCRIPTION:
${safeJd}
`;

        // Dynamically find models
        let activeIds = [];
        try {
            const list = await groq.models.list();
            activeIds = (list.data || []).map(m => m.id);
            console.log("ACCESSIBLE GROQ MODELS FOR THIS REQUEST:", activeIds);
        } catch (mErr) {
            console.warn("Could not retrieve models list, using fallback:", mErr.message);
        }

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
                console.log(`>>> ATTEMPTING GROQ MODEL: ${m}`);

                const tokenLimit = m.includes("qwen") ? 2200 : 2500;

                let createParams = {
                    messages: [
                        {
                            role: "system",
                            content: "You are an ATS skill extraction engine. You must output ONLY a valid JSON object matching the exact requested schema. Never use unescaped double quotes inside strings. Do not include thinking, explanations, or markdown."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    model: m,
                    temperature: 0.1,
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

                let raw = completion.choices[0]?.message?.content || "";
                console.log(`>>> GROQ RESPONSE FROM ${m} (length ${raw.length})`);

                raw = raw
                    .replace(/<think>[\s\S]*?<\/think>/gi, "")
                    .replace(/```json/gi, "")
                    .replace(/```/gi, "")
                    .trim();

                parsed = safeParseJSON(raw);
                console.log(`>>> GROQ SUCCESS & VALID JSON FROM MODEL: ${m}`);
                break;
            } catch (err) {
                lastError = err;
                console.warn(`Model ${m} failed or returned invalid JSON:`, err.message);
            }
        }

        if (!parsed) {
            throw new Error("Could not parse valid JSON from AI: " + (lastError?.message || "Unknown error"));
        }

        parsed.requiredSkillsDetailed = parsed.requiredSkillsDetailed || [];

        // Safety fallback
        parsed.projectRelevanceScore = Math.max(
            0,
            Math.min(20, typeof parsed.projectRelevanceScore === "number" ? parsed.projectRelevanceScore : 14)
        );

        return parsed;

    } catch (error) {
        console.error("GROQ SERVICE ERROR:", error);
        throw new Error("Groq parsing failed: " + error.message);
    }
};

module.exports = analyzeWithGroq;