// controllers/atsController.js
const Resume = require("../models/Resume");
const Analysis = require("../models/Analysis");
const getResumeQualityScore = require("../utils/resumeQuality");
const analyzeWithGroq = require("../services/groqService");

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

    const resumeText = latestResume.parsedText;
    const resumeQualityScore = getResumeQualityScore(resumeText);
    const result = await analyzeWithGroq(resumeText, jobDescription);

    const projectRelevanceScore = result.projectRelevanceScore || 0;
    const relatedSkills = result.relatedSkills || [];
    const requiredSkillsDetailed = result.requiredSkillsDetailed || [];

    const matchedSkills = result.requiredSkillsNormalized.filter(skill =>
      result.resumeSkillsNormalized.includes(skill)
    );
    const missingSkills = result.requiredSkillsNormalized.filter(skill =>
      !result.resumeSkillsNormalized.includes(skill)
    );

    let exactScore = 0;
    requiredSkillsDetailed.forEach(skillObj => {
      if (matchedSkills.includes(skillObj.skill)) exactScore += skillObj.weight;
    });

    const relatedScore = relatedSkills.reduce(
      (sum, item) => sum + (item.weight || 0), 0
    );
    const totalPossibleWeight = requiredSkillsDetailed.reduce(
      (sum, skill) => sum + (skill.weight || 0), 0
    );

    const skillScore = totalPossibleWeight === 0
      ? 0
      : Math.round(((exactScore + relatedScore) / totalPossibleWeight) * 60);

    const rawScore = skillScore + resumeQualityScore + projectRelevanceScore;
    const atsScore = Math.max(0, Math.min(100, rawScore));

    await Analysis.create({
      userId: req.user.id,
      resumeId: latestResume._id,
      jobDescription,
      resumeSkillsRaw: result.resumeSkillsRaw,
      resumeSkillsNormalized: result.resumeSkillsNormalized,
      requiredSkillsRaw: result.requiredSkillsRaw,
      requiredSkillsNormalized: result.requiredSkillsNormalized,
      requiredSkillsDetailed,
      relatedSkills,
      skillScore,
      resumeQualityScore,
      projectRelevanceScore,
      atsScore,
      matchedSkills,
      missingSkills,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      suggestions: result.suggestions,
    });

    res.status(200).json({
      atsScore, skillScore, resumeQualityScore, projectRelevanceScore,
      resumeSkillsRaw: result.resumeSkillsRaw,
      resumeSkillsNormalized: result.resumeSkillsNormalized,
      requiredSkillsRaw: result.requiredSkillsRaw,
      requiredSkillsNormalized: result.requiredSkillsNormalized,
      requiredSkillsDetailed, relatedSkills,
      matchedSkills, missingSkills,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      suggestions: result.suggestions,
    });
  } catch (error) {
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
        "matchedSkills missingSkills strengths weaknesses createdAt"
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

    // 2. Averages
    const avg = (key) =>
      Math.round(analyses.reduce((s, a) => s + (a[key] ?? 0), 0) / analyses.length);

    const avgScores = {
      ats:     avg("atsScore"),
      skill:   avg("skillScore"),
      resume:  avg("resumeQualityScore"),
      project: avg("projectRelevanceScore"),
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

    res.status(200).json({
      total: analyses.length,
      scoreTrend,
      avgScores,
      topMissing,
      topMatched,
      recurringWeaknesses,
      recurringStrengths,
      improvement,
      // raw array still available if frontend needs it
      analyses,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { analyzeResume, getAnalysisHistory };