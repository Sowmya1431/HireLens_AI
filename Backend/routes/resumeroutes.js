const express = require("express");
const upload = require("../middleware/uploadmiddleware");
const { uploadResume } = require("../controllers/resumecontroller");
const protect = require("../middleware/authmiddleware");

const router = express.Router();

router.post(
    "/upload",
    protect,
    upload.single("resume"),
    uploadResume
);

module.exports = router;