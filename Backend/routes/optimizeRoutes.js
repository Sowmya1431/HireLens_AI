const express = require("express");
const upload = require("../middleware/uploadmiddleware");
const protect = require("../middleware/authMiddleware");
const { optimizeResume } = require("../controllers/optimizeController");

const router = express.Router();

router.post("/rewrite", protect, upload.single("resume"), optimizeResume);

module.exports = router;