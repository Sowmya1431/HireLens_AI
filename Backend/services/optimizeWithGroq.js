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
You are HireLens AI Resume Optimizer, an advanced ATS resume rewriting engine.

INPUTS:
Resume:
${resumeText}

Job Description:
${jobDescription}

Selected Template:
${template}

ATS Analysis:
${JSON.stringify(atsResult)}

========================
PHASE 1 — RESUME PARSING
========================

FIRST parse the uploaded resume completely before optimization.

Extract ALL available information into these sections:

* name
* contact
* role
* summary (if present)
* education
* skills
* projects
* experience / internships
* certifications
* additionalInfo

IMPORTANT:
Never skip any section.

If the resume contains extra sections such as:

* achievements
* hackathons
* volunteering
* publications
* research
* languages
* awards
* extracurricular activities

Put them into:
additionalInfo

If a standard section is absent, return empty array.

========================
PHASE 2 — ATS OPTIMIZATION
==========================

OBJECTIVES:

1. Rewrite the entire resume into a highly ATS-optimized version.

2. Maintain ABSOLUTE TRUTH.
   NEVER invent:

* fake experience
* fake internships
* fake degrees
* fake certifications
* fake companies
* fake universities
* fake technologies

Only improve wording and formatting.

3. Keyword Optimization

Extract all important keywords from Job Description.

Classify them into:

* required keywords
* preferred keywords

IMPORTANT:
At least 80% of high-priority JD keywords must appear naturally across:

* professional summary
* projects
* internships / work experience
* skills (only if already present in resume)

Do NOT concentrate keywords only inside skills.

Spread them across ALL sections.

4. Missing Keywords Rule

If a keyword appears in JD but NOT anywhere in resume:

DO NOT insert it into resume content.

Put it ONLY inside:
missingKeywords

========================
PROFESSIONAL SUMMARY RULES
==========================

Generate a strong ATS summary.

Requirements:

* Exactly 4–5 sentences
* 100–150 words
* Strong technical vocabulary
* Mention primary stack
* Mention problem solving
* Mention collaboration
* Mention scalability / performance / software engineering practices

Summary must sound recruiter-grade.

Weak summaries are forbidden.

========================
PROJECT RULES
=============

For EVERY project:

Return:

{
title,
description:[]
}

Rules:

* Minimum 4 bullet points
* Maximum 6 bullet points
* EACH bullet minimum 35 words
* Each bullet must be detailed and technical
* Use strong action verbs

Each bullet must include at least one of:

* architecture
* technologies used
* APIs
* database
* scalability
* performance
* optimization
* security
* measurable impact

BAD:
Built web app using React.

FORBIDDEN.

GOOD:
Developed a scalable MERN-stack web platform using reusable React components, RESTful API integration, and MongoDB schema optimization, improving application responsiveness by 35% and reducing data retrieval latency significantly.

IMPORTANT:
If any bullet has fewer than 35 words, regenerate it.

========================
EXPERIENCE / INTERNSHIP RULES
=============================

For EVERY experience/internship:

Return:

{
role,
company,
duration,
responsibilities:[]
}

Rules:

* Minimum 4 bullet points
* Maximum 6 bullet points
* EACH bullet minimum 35 words
* Technical + impact focused
* Include collaboration
* Include debugging / testing / development / optimization

Every bullet must be professional and interview-ready.

If bullet <35 words, regenerate.

========================
SKILLS RULES
============

Return only real skills from resume.

Never add fake skills.

Remove duplicates.

========================
EDUCATION RULES
===============

Preserve original degree and university.

Only improve formatting.

========================
CERTIFICATION RULES
===================

Preserve all certifications.

========================
ATS SCORE RULES
===============

Calculate optimized ATS score using:

* keyword coverage
* section completeness
* technical relevance
* project quality
* experience quality

Score range:
85–98

========================
OUTPUT RULES
============

Return ONLY valid JSON.

{
"atsScore": 92,
"template": "${template}",
"name": "",
"contact": "",
"role": "",
"summary": "",
"education": [],
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

* No markdown
* No explanation
* Response must start with {
* Response must end with }
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