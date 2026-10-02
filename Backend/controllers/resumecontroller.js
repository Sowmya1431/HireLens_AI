const { getBucket } = require("../config/gridfs");
const { Readable } = require("stream");
const Resume = require("../models/resume");
const extractPDFText = require("../utils/pdfparser");


const uploadResume = async (req, res) => {
    try {
        console.log("Resume upload request received");

        if (!req.file) {
            console.warn("Upload rejected: No file provided");
            return res.status(400).json({
                message: "No resume file uploaded. Please select a PDF or DOCX file."
            });
        }

        console.log(`Processing uploaded file: ${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})`);

        // Extract text before storing
        const resumeText = await extractPDFText(req.file);
        console.log(`Text extracted successfully (${resumeText.length} characters)`);

        const bucket = getBucket();
        if (!bucket) {
            console.error("GridFS bucket is not available");
            return res.status(500).json({
                message: "Database file storage is not ready. Please try again in a moment."
            });
        }

        const readable = Readable.from(req.file.buffer);

        const uploadStream = bucket.openUploadStream(
            Date.now() + "-" + req.file.originalname
        );

        readable.pipe(uploadStream);

        uploadStream.on("finish", async () => {
            try {
                const resume = await Resume.create({
                    userId: req.user.id,
                    fileId: uploadStream.id,
                    filename: uploadStream.filename,
                    contentType: req.file.mimetype,
                    parsedText: resumeText
                });

                console.log(`Resume stored successfully for user ${req.user.id}, resumeId: ${resume._id}`);

                res.status(201).json({
                    message: "Resume uploaded successfully",
                    resumeId: resume._id,
                    filename: resume.filename
                });
            } catch (dbErr) {
                console.error("Error creating Resume record in MongoDB:", dbErr);
                if (!res.headersSent) {
                    res.status(500).json({
                        message: "Failed to save resume record: " + dbErr.message
                    });
                }
            }
        });

        uploadStream.on("error", (err) => {
            console.error("GridFS stream error:", err);
            if (!res.headersSent) {
                res.status(500).json({
                    message: "Failed to store file: " + err.message
                });
            }
        });

    } catch (error) {
        console.error("Resume upload failed:", error);
        res.status(500).json({
            message: error.message || "Failed to parse and upload resume"
        });
    }
};

module.exports = { uploadResume };


