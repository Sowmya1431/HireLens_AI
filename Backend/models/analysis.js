const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
            required: true
        },

        jobDescription: {
            type: String,
            required: true
        },

        // RAW SKILLS FROM AI
        resumeSkillsRaw: [String],
        requiredSkillsRaw: [String],

        // NORMALIZED SKILLS
        resumeSkillsNormalized: [String],
        requiredSkillsNormalized: [String],

        // NEW: SKILL IMPORTANCE
        requiredSkillsDetailed: [
            {
                skill: String,
                importance: String,
                weight: Number
            }
        ],

        // SEMANTIC RELATED SKILLS
        relatedSkills: [
            {
                required: String,
                resumeEquivalent: String,
                category: String,
                weight: Number
            }
        ],

        // HYBRID SCORES
        skillScore: Number,
        resumeQualityScore: Number,
        projectRelevanceScore: Number,
        atsScore: Number,

        // BACKEND COMPUTED
        matchedSkills: [String],
        missingSkills: [String],

        // AI ANALYSIS
        strengths: [String],
        weaknesses: [String],
        suggestions: [String]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Analysis", analysisSchema);