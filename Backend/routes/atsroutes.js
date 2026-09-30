// routes/atsRoutes.js
const express = require("express");
const protect = require("../middleware/authMiddleware");
const { analyzeResume, getAnalysisHistory, getLatestAnalysis } = require("../controllers/atsController");

const router = express.Router();

router.post("/analyze",  protect, analyzeResume);
router.get("/history",   protect, getAnalysisHistory);
router.get("/latest",    protect, getLatestAnalysis);

module.exports = router;