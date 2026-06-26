const groq = require("../config/groqConfig");

const analyzeWithGroq = async (resumeText, jobDescription) => {
    try {
    const prompt = `
You are an ATS skill extraction, normalization, and semantic relevance engine.

TASKS:
1. Extract every technical skill, tool, language, framework, database, platform, library, infrastructure tool, DevOps tool, or cloud technology mentioned in the Resume into "resumeSkillsRaw".

2. Extract every technical skill, tool, language, framework, database, platform, library, infrastructure tool, DevOps tool, or cloud technology mentioned in the Job Description into "requiredSkillsRaw".

3. Normalize each extracted skill into canonical form.

NORMALIZATION RULES:

ALIAS NORMALIZATION:
Merge aliases of the same technology:
- React.js / ReactJS / React JS → React
- Node / NodeJS / Node.js → Node.js
- Express / ExpressJS / Express.js → Express.js
- Postgres / PostgreSQL → PostgreSQL
- JS → JavaScript
- TS → TypeScript

STACK EXPANSION:
Expand technology stacks into components:
- MERN → MongoDB, Express.js, React, Node.js
- MEAN → MongoDB, Express.js, Angular, Node.js
- LAMP → Linux, Apache, MySQL, PHP

GENERIC SKILLS MUST REMAIN GENERIC:
Do NOT convert generic skill categories into specific tools.
Examples:
- SQL → SQL
- NoSQL → NoSQL
- Cloud Platforms → Cloud Platforms
- CI/CD tools → CI/CD tools
- REST APIs → REST APIs

IMPORTANT:
Never infer a specific technology from a generic term.
Example:
- SQL MUST NOT become PostgreSQL/MySQL
- Cloud Platforms MUST NOT become AWS
- NoSQL MUST NOT become MongoDB

DISTINCT TECHNOLOGIES:
Keep distinct technologies separate:
- MySQL ≠ PostgreSQL
- MongoDB ≠ Cassandra
- AWS ≠ Azure ≠ GCP
- Docker ≠ Kubernetes

UNKNOWN SKILLS:
Unknown skills should remain in clean canonical casing:
- docker → Docker
- graphql → GraphQL
- fastapi → FastAPI

4. NORMALIZED ARRAY RULES
- All arrays must contain UNIQUE values only
- No duplicates
- Same technology must map to identical canonical strings
- Preserve generic skills exactly if generic wording is used

5. SEMANTIC RELATED SKILLS
For each required skill with NO exact match in resumeSkillsNormalized, check if resume contains semantically related skills.

Functional categories:

Relational Databases:
MySQL, PostgreSQL, SQL Server, Oracle DB, SQLite

NoSQL Databases:
MongoDB, Cassandra, DynamoDB, Redis, CouchDB

Cloud Providers:
AWS, Azure, GCP, DigitalOcean

CI/CD Tools:
Jenkins, GitHub Actions, GitLab CI, CircleCI, Travis CI

Frontend Frameworks:
React, Angular, Vue, Svelte, Next.js

Backend Frameworks:
Express.js, Django, Flask, Spring Boot, FastAPI, Laravel

Containerization:
Docker, Kubernetes, OpenShift

Messaging:
Kafka, RabbitMQ, ActiveMQ

Caching:
Redis, Memcached

Semantic examples:
- Required NoSQL + Resume MongoDB → related
- Required Cloud Platforms + Resume AWS → related
- Required CI/CD tools + Resume GitHub Actions → related
- Required Docker + Resume Kubernetes → weak related

For each related skill return:

{
  "required": "<required skill>",
  "resumeEquivalent": "<resume skill>",
  "category": "<category>",
  "weight": <number>
}

WEIGHT RULES:
- 1.0 = exact equivalent (rare)
- 0.75 = strong semantic equivalent
- 0.5 = moderate category match
- 0.25 = weak transferable relevance

IMPORTANT:
- relatedSkills are NOT exact matches
- Do NOT insert related skills into normalized arrays
- Always return relatedSkills array, even if empty

6. SKILL IMPORTANCE CLASSIFICATION

For every skill in requiredSkillsNormalized, classify its importance based on Job Description wording.

REQUIRED (weight = 1.0)
- mandatory skills
- required
- must have
- essential
- strong understanding

PREFERRED (weight = 0.5)
- preferred
- desirable
- plus
- advantage
- familiarity with

BONUS (weight = 0.25)
- optional extra technologies
- nice to have

Return:

requiredSkillsDetailed = [
  {
    "skill": "Node.js",
    "importance": "required",
    "weight": 1.0
  }
]

RULES:
- Every skill in requiredSkillsNormalized must appear exactly once
- skill must exactly match a value from requiredSkillsNormalized
- weight must be only 1, 0.5, or 0.25

7. PROJECT RELEVANCE SCORE
Evaluate projects, internships, and work experience alignment with JD.

Scoring:
0-5 = mostly unrelated
6-10 = partially relevant
11-15 = relevant
16-20 = highly relevant


8. QUALITATIVE ANALYSIS
Generate:
- strengths (2-5 concise points)
- weaknesses (2-5 concise points)
- suggestions (2-5 actionable improvements)

HARD CONSTRAINT:
resumeEquivalent MUST be an exact value taken from resumeSkillsNormalized.
Never invent a technology not present in resumeSkillsNormalized.
If no resume skill fits, do not create a relatedSkills entry.

STRICT EXTRACTION RULE:
Do NOT invent, infer, summarize, generalize, or derive new skills.

Examples:
- MySQL must remain MySQL (do not add SQL unless SQL explicitly appears)
- MongoDB must remain MongoDB (do not add NoSQL unless NoSQL explicitly appears)
- Git must remain Git (do not add CI/CD tools)
- React + Node.js must NOT become Full Stack Development

Only include skills explicitly written in Resume or JD,
except alias normalization and stack expansion.

OUTPUT RULES:
- Return ONLY valid JSON
- No markdown
- No explanations
- No text outside JSON
- Response must start with { and end with }

Return EXACT JSON shape:

{
  "resumeSkillsRaw": [],
  "resumeSkillsNormalized": [],
  "requiredSkillsRaw": [],
  "requiredSkillsNormalized": [],

  "requiredSkillsDetailed": [
    {
      "skill": "",
      "importance": "",
      "weight": 1
    }
  ],

  "relatedSkills": [],
  "projectRelevanceScore": 0,
  "strengths": [],
  "weaknesses": [],
  "suggestions": []
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1
        });

        let response = completion.choices[0].message.content;

        response = response
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let parsed;

try {
    parsed = JSON.parse(response);
} catch (err) {
    const firstBrace = response.indexOf("{");
    const lastBrace = response.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON found in Groq response");
    }

    const jsonString = response.slice(
        firstBrace,
        lastBrace + 1
    );

    parsed = JSON.parse(jsonString);
}
        parsed.requiredSkillsDetailed =
    parsed.requiredSkillsDetailed || [];

        // Safety fallback
        parsed.projectRelevanceScore = Math.max(
            0,
            Math.min(20, parsed.projectRelevanceScore || 0)
        );

        return parsed;

    } catch (error) {
        throw new Error("Groq parsing failed: " + error.message);
    }
};

module.exports = analyzeWithGroq;