const getResumeQualityScore = (resumeText) => {
    let score = 0;

    const text = resumeText.toLowerCase();

    // Skills section
    if (text.includes("skills")) {
        score += 5;
    }

    // Projects section
    if (text.includes("project") || text.includes("projects")) {
        score += 7;
    }

    // Education section
    if (text.includes("education")) {
        score += 4;
    }

    // Experience / Internship
    if (
        text.includes("experience") ||
        text.includes("internship")
    ) {
        score += 4;
    }

    return score; // out of 20
};

module.exports = getResumeQualityScore;