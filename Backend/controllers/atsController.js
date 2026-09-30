// controllers/atsController.js
const Resume = require("../models/Resume");
const Analysis = require("../models/Analysis");
const getResumeQualityScore = require("../utils/resumeQuality");
const analyzeWithGroq = require("../services/groqService");

function extractStringList(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "object" && item !== null) {
        return (item.text || item.point || item.suggestion || item.strength || item.weakness || item.description || JSON.stringify(item)).trim();
      }
      return String(item).trim();
    }).filter(Boolean);
  }
  if (typeof val === "string") {
    return val.split(/\r?\n|•|-|\d+\./).map(s => s.trim()).filter(s => s.length > 3);
  }
  return [];
}

function normalizeSkillKey(skill) {
  if (!skill || typeof skill !== "string") return "";
  let s = skill.toLowerCase().trim()
    .replace(/[._\-\/]/g, "")
    .replace(/\s+/g, "");
  
  if (s === "html5") return "html";
  if (s === "css3") return "css";
  if (s === "js") return "javascript";
  if (s === "ts") return "typescript";
  if (s === "py") return "python";
  if (s === "postgres" || s === "postgresql" || s === "postgresqldb") return "postgresql";
  if (s === "rest" || s === "restapi" || s === "restapis" || s === "restful" || s === "restfulapi" || s === "restfulapis") return "restapi";
  if (s === "react" || s === "reactjs" || s === "reactnative") return "react";
  if (s === "node" || s === "nodejs") return "nodejs";
  if (s === "express" || s === "expressjs") return "expressjs";
  if (s === "mongo" || s === "mongodb") return "mongodb";
  if (s === "aws" || s === "amazonwebservices") return "aws";
  if (s === "gcp" || s === "googlecloud" || s === "googlecloudplatform") return "gcp";
  if (s === "github" || s === "git") return "git";
  return s;
}
function skillMatches(reqSkill, candidateSkillList, fullResumeText = "") {
  const reqKey = normalizeSkillKey(reqSkill);
  if (!reqKey) return false;

  const matchedInList = candidateSkillList.some(cand => {
    const candKey = normalizeSkillKey(cand);
    if (!candKey) return false;

    // Exact canonical match
    if (candKey === reqKey) return true;

    // Substring or parent/child match
    if (candKey.includes(reqKey) || reqKey.includes(candKey)) {
      if (Math.min(candKey.length, reqKey.length) >= 3) {
        return true;
      }
    }
    return false;
  });

  if (matchedInList) return true;

  // Direct resume text scan fallback (catches skills mentioned in project/experience descriptions)
  if (fullResumeText && typeof fullResumeText === "string") {
    const textLower = fullResumeText.toLowerCase();
    const reqLower = reqSkill.toLowerCase().trim();
    if (reqLower.length >= 3 && textLower.includes(reqLower)) {
      return true;
    }
    if (reqKey === "restapi" && (textLower.includes("rest") || textLower.includes("restful"))) {
      return true;
    }
    if (reqKey === "html" && (textLower.includes("html") || textLower.includes("html5"))) {
      return true;
    }
    if (reqKey === "css" && (textLower.includes("css") || textLower.includes("css3"))) {
      return true;
    }
  }

  return false;
}

/* ─── existing: analyzeResume ─── */
const analyzeResume = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription)
      return res.status(400).json({ message: "Job description required" });

    const latestResume = await Resume
      .findOne({ userId: req.user.id })
      .sort({ createdAt: -1 });

    if (!latestResume)
      return res.status(404).json({ message: "No resume uploaded" });

    const resumeText = latestResume.parsedText || "";
    if (!resumeText.trim()) {
      return res.status(400).json({
        message: "No readable text found in resume. If your resume is a scanned image or photo, please upload a text-based PDF."
      });
    }

    const resumeQualityScore = getResumeQualityScore(resumeText);
    const result = await analyzeWithGroq(resumeText, jobDescription);

    const projectRelevanceScore = typeof result?.projectRelevanceScore === "number" ? result.projectRelevanceScore : 14;
    const relatedSkills = Array.isArray(result?.relatedSkills) ? result.relatedSkills : [];
    const requiredSkillsDetailed = Array.isArray(result?.requiredSkillsDetailed) ? result.requiredSkillsDetailed : [];
    const resumeSkillsRaw = Array.isArray(result?.resumeSkillsRaw) ? result.resumeSkillsRaw : [];
    const resumeSkillsNormalized = Array.isArray(result?.resumeSkillsNormalized) ? result.resumeSkillsNormalized : [];
    const requiredSkillsRaw = Array.isArray(result?.requiredSkillsRaw) ? result.requiredSkillsRaw : [];
    const requiredSkillsNormalized = Array.isArray(result?.requiredSkillsNormalized) ? result.requiredSkillsNormalized : [];

    // Intelligent canonical & fuzzy matching with full resume text verification
    const matchedSkills = requiredSkillsNormalized.filter(skill =>
      skillMatches(skill, resumeSkillsNormalized, resumeText)
    );
    const missingSkills = requiredSkillsNormalized.filter(skill =>
      !skillMatches(skill, resumeSkillsNormalized, resumeText)
    );

    let strengths = extractStringList(result?.strengths || result?.Strengths || result?.keyStrengths || result?.highlights);
    let weaknesses = extractStringList(result?.weaknesses || result?.Weaknesses || result?.gaps || result?.areasOfImprovement || result?.skillGaps);
    let suggestions = extractStringList(result?.suggestions || result?.Suggestions || result?.recommendations || result?.improvements || result?.tips);

    // Contextual fallback/enrichment for strengths if empty or sparse (< 2)
    if (strengths.length < 2) {
      if (matchedSkills.length > 0 && !strengths.some(s => s.toLowerCase().includes("alignment") || s.toLowerCase().includes("matched"))) {
        strengths.push(`Strong alignment with required skills: ${matchedSkills.slice(0, 6).join(", ")}`);
      }
      if (resumeQualityScore >= 10 && !strengths.some(s => s.toLowerCase().includes("structur") || s.toLowerCase().includes("section"))) {
        strengths.push("Well-structured resume with standard sections (Education, Experience, Skills, Projects) facilitating ATS parsing.");
      }
      if (projectRelevanceScore >= 8 && !strengths.some(s => s.toLowerCase().includes("project"))) {
        strengths.push("Project and internship history demonstrates solid practical relevance to key role deliverables.");
      }
      if (strengths.length === 0) {
        strengths.push("Demonstrates foundational technical competency in core software development technologies.");
      }
    }

    // Contextual fallback/enrichment for weaknesses if empty or sparse (< 2)
    if (weaknesses.length < 2) {
      if (missingSkills.length > 0 && !weaknesses.some(w => w.toLowerCase().includes("missing") || w.toLowerCase().includes("technolog"))) {
        weaknesses.push(`Missing role-specific technologies: ${missingSkills.slice(0, 6).join(", ")}`);
      }
      if (resumeQualityScore < 14 && !weaknesses.some(w => w.toLowerCase().includes("format") || w.toLowerCase().includes("depth"))) {
        weaknesses.push("Resume section depth and formatting can be enhanced to further optimize automated ATS parser accuracy.");
      }
      if (projectRelevanceScore < 14 && !weaknesses.some(w => w.toLowerCase().includes("metric") || w.toLowerCase().includes("quantif"))) {
        weaknesses.push("Project descriptions could be enriched with measurable metrics and business outcomes (e.g. latency, scale).");
      }
      if (weaknesses.length === 0) {
        weaknesses.push("Opportunity to highlight deeper hands-on experience with production systems and advanced tools.");
      }
    }

    // Contextual fallback/enrichment for suggestions if empty or sparse (< 2)
    if (suggestions.length < 2) {
      if (missingSkills.length > 0) {
        suggestions.push(`Integrate missing key technologies (e.g., ${missingSkills.slice(0, 4).join(", ")}) into your project or skills sections.`);
      }
      suggestions.push("Quantify your project achievements using measurable metrics (e.g., 'reduced API response time by 30%', 'handled 500+ daily requests').");
      suggestions.push("Tailor bullet point action verbs and phrases to closely mirror the terminology used in the job description.");
    }

    // Map weights from requiredSkillsDetailed
    const weightMap = {};
    requiredSkillsDetailed.forEach(sObj => {
      if (sObj?.skill) {
        weightMap[normalizeSkillKey(sObj.skill)] = typeof sObj.weight === "number" ? sObj.weight : 1.0;
      }
    });

    let exactScore = 0;
    let totalPossibleWeight = 0;

    requiredSkillsNormalized.forEach(reqSkill => {
      const key = normalizeSkillKey(reqSkill);
      const weight = weightMap[key] !== undefined ? weightMap[key] : 1.0;
      totalPossibleWeight += weight;

      if (skillMatches(reqSkill, resumeSkillsNormalized, resumeText)) {
        exactScore += weight;
      }
    });

    // Related skills: award credit ONLY for missing skills that have a valid semantic substitute in the candidate's resume
    let relatedScore = 0;
    relatedSkills.forEach(item => {
      if (!item?.required || !item?.resumeEquivalent) return;
      const isReqMissing = missingSkills.some(m => skillMatches(m, [item.required], resumeText));
      const hasEquivInResume = resumeSkillsNormalized.some(r => skillMatches(r, [item.resumeEquivalent], resumeText));

      if (isReqMissing && hasEquivInResume) {
        const itemWeight = Math.min(0.8, Math.max(0.2, item.weight || 0.6));
        relatedScore += itemWeight;
      }
    });

    const effectiveScore = totalPossibleWeight > 0
      ? Math.min(totalPossibleWeight, exactScore + relatedScore)
      : 0;

    const skillScore = totalPossibleWeight > 0
      ? Math.round((effectiveScore / totalPossibleWeight) * 60)
      : (matchedSkills.length > 0 ? 50 : 0);

    // Calculate raw ATS score (max 100)
    // skillScore (0-60) + resumeQualityScore (0-20) + projectRelevanceScore (0-20)
    const rawScore = (skillScore || 0) + (resumeQualityScore || 0) + (projectRelevanceScore || 0);
    const atsScore = isNaN(rawScore) ? 0 : Math.max(0, Math.min(100, Math.round(rawScore)));

    await Analysis.create({
      userId: req.user.id,
      resumeId: latestResume._id,
      jobDescription,
      resumeSkillsRaw,
      resumeSkillsNormalized,
      requiredSkillsRaw,
      requiredSkillsNormalized,
      requiredSkillsDetailed,
      relatedSkills,
      skillScore,
      resumeQualityScore,
      projectRelevanceScore,
      atsScore,
      matchedSkills,
      missingSkills,
      strengths,
      weaknesses,
      suggestions,
    });

    res.status(200).json({
      atsScore, skillScore, resumeQualityScore, projectRelevanceScore,
      resumeSkillsRaw,
      resumeSkillsNormalized,
      requiredSkillsRaw,
      requiredSkillsNormalized,
      requiredSkillsDetailed, relatedSkills,
      matchedSkills, missingSkills,
      strengths,
      weaknesses,
      suggestions,
    });
  } catch (error) {
    console.error("ATS ANALYZE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ─── NEW: getAnalysisHistory ─── */
const getAnalysisHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20; // last 20 analyses

    const analyses = await Analysis
      .find({ userId: req.user.id })
      .sort({ createdAt: 1 })          // oldest → newest (for trend charts)
      .limit(limit)
      .select(
        "atsScore skillScore resumeQualityScore projectRelevanceScore " +
        "matchedSkills missingSkills strengths weaknesses suggestions createdAt"
      )
      .lean();

    if (!analyses.length)
      return res.status(200).json({ analyses: [], total: 0 });

    /* ── Pre-aggregate on the server (lighter payload for frontend) ── */

    // 1. Score trend (already sorted chronologically)
    const scoreTrend = analyses.map((a, i) => ({
      index: i + 1,
      date: a.createdAt,
      atsScore: a.atsScore ?? 0,
      skillScore: a.skillScore ?? 0,
      resumeQualityScore: a.resumeQualityScore ?? 0,
      projectRelevanceScore: a.projectRelevanceScore ?? 0,
    }));

    // 2. Averages & Skills Analytics
    const avg = (key) =>
      Math.round(analyses.reduce((s, a) => s + (a[key] ?? 0), 0) / analyses.length);

    const totalMatchedCount = analyses.reduce((s, a) => s + (a.matchedSkills?.length || 0), 0);
    const totalMissingCount = analyses.reduce((s, a) => s + (a.missingSkills?.length || 0), 0);
    const avgMatchedSkills = Math.round(totalMatchedCount / analyses.length);
    const avgMissingSkills = Math.round(totalMissingCount / analyses.length);
    const totalSkillsEvaluated = totalMatchedCount + totalMissingCount;
    const avgSkillMatchPct = totalSkillsEvaluated > 0
      ? Math.round((totalMatchedCount / totalSkillsEvaluated) * 100)
      : 0;

    const allScores = analyses.map(a => a.atsScore ?? 0);
    const highestAtsScore = allScores.length ? Math.max(...allScores) : 0;
    const lowestAtsScore = allScores.length ? Math.min(...allScores) : 0;

    const avgScores = {
      ats:              avg("atsScore"),
      skill:            avg("skillScore"),
      resume:           avg("resumeQualityScore"),
      project:          avg("projectRelevanceScore"),
      avgMatchedSkills,
      avgMissingSkills,
      avgSkillMatchPct,
      highestAtsScore,
      lowestAtsScore,
    };

    // 3. Top missing skills
    const missingCount = {};
    analyses.forEach(a =>
      (a.missingSkills || []).forEach(sk => {
        missingCount[sk] = (missingCount[sk] || 0) + 1;
      })
    );
    const topMissing = Object.entries(missingCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({
        skill,
        count,
        pct: Math.round((count / analyses.length) * 100),
      }));

    // 4. Top matched skills
    const matchedCount = {};
    analyses.forEach(a =>
      (a.matchedSkills || []).forEach(sk => {
        matchedCount[sk] = (matchedCount[sk] || 0) + 1;
      })
    );
    const topMatched = Object.entries(matchedCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({
        skill,
        count,
        pct: Math.round((count / analyses.length) * 100),
      }));

    // 5. Recurring weaknesses
    const weaknessFreq = {};
    analyses.forEach(a =>
      (a.weaknesses || []).forEach(w => {
        const key = w.slice(0, 80);
        weaknessFreq[key] = (weaknessFreq[key] || 0) + 1;
      })
    );
    const recurringWeaknesses = Object.entries(weaknessFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    // 6. Recurring strengths
    const strengthFreq = {};
    analyses.forEach(a =>
      (a.strengths || []).forEach(s => {
        const key = s.slice(0, 80);
        strengthFreq[key] = (strengthFreq[key] || 0) + 1;
      })
    );
    const recurringStrengths = Object.entries(strengthFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text, count]) => ({ text, count }));

    // 7. Improvement: first vs last
    const first = analyses[0];
    const last  = analyses[analyses.length - 1];
    const improvement = [
      { name: "Skills",   before: first.skillScore ?? 0,           after: last.skillScore ?? 0 },
      { name: "Resume",   before: first.resumeQualityScore ?? 0,   after: last.resumeQualityScore ?? 0 },
      { name: "Projects", before: first.projectRelevanceScore ?? 0, after: last.projectRelevanceScore ?? 0 },
      { name: "Overall",  before: first.atsScore ?? 0,             after: last.atsScore ?? 0 },
    ].map(d => ({ ...d, delta: d.after - d.before }));

    // 8. Fetch latest full analysis for instant dashboard inspection
    const latestAnalysis = await Analysis.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      total: analyses.length,
      scoreTrend,
      avgScores,
      topMissing,
      topMatched,
      recurringWeaknesses,
      recurringStrengths,
      improvement,
      latestAnalysis,
      analyses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ─── NEW: getLatestAnalysis ─── */
const getLatestAnalysis = async (req, res) => {
  try {
    const latest = await Analysis.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    if (!latest) return res.status(404).json({ message: "No analysis found" });
    res.status(200).json(latest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { analyzeResume, getAnalysisHistory, getLatestAnalysis };