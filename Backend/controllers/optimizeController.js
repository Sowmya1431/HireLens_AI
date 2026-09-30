const extractPDFText = require("../utils/pdfparser");
const optimizeWithGroq = require("../services/optimizeWithGroq");

const optimizeResume = async (req, res) => {
  try {
    console.log("Optimize route hit");

    if (!req.file) {
      return res.status(400).json({
        error: "No resume file uploaded"
      });
    }

    const resumeText = await extractPDFText(req.file);
    console.log("Resume text extracted successfully");

    const { jobDescription, template } = req.body;

    if (!jobDescription || !template) {
      return res.status(400).json({
        error: "Job description or template missing"
      });
    }

    console.log("Calling Groq...");

    const result = await optimizeWithGroq(
      resumeText,
      jobDescription,
      template
    );

    console.log("Groq success");

    return res.status(200).json(result);

  } catch (err) {
    console.error("OPTIMIZE ERROR:", err);

    return res.status(500).json({
      error: err.message || "Internal Server Error"
    });
  }
};

module.exports = { optimizeResume };