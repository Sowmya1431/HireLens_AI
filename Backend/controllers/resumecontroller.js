const { getBucket } = require("../config/gridfs");
const { Readable } = require("stream");
const Resume = require("../models/Resume");
const extractPDFText = require("../utils/pdfParser");


const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded"
            });
        }

        // Extract text before storing
        const resumeText = await extractPDFText(req.file.buffer);

        const bucket = getBucket();
        const readable = Readable.from(req.file.buffer);

        const uploadStream = bucket.openUploadStream(
            Date.now() + "-" + req.file.originalname
        );

        readable.pipe(uploadStream);

        uploadStream.on("finish", async () => {
            const resume = await Resume.create({
                userId: req.user.id,
                fileId: uploadStream.id,
                filename: uploadStream.filename,
                contentType: req.file.mimetype,
                parsedText: resumeText
            });

            res.status(201).json({
                message: "Resume uploaded",
                filename: resume.filename
            });
        });
        uploadStream.on("error", (err) => {
    if (!res.headersSent) {
        res.status(500).json({
            message: err.message
        });
    }
});

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = { uploadResume };


