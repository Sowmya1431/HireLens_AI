const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const extractPDFText = async (input) => {
    let buffer;
    let filename = "";
    let mimetype = "";

    if (Buffer.isBuffer(input)) {
        buffer = input;
    } else if (input && Buffer.isBuffer(input.buffer)) {
        buffer = input.buffer;
        filename = (input.originalname || "").toLowerCase();
        mimetype = (input.mimetype || "").toLowerCase();
    } else {
        throw new Error("No file buffer provided for parsing");
    }

    if (!buffer || buffer.length === 0) {
        throw new Error("Uploaded file is empty");
    }

    // 1. DOCX Support (by extension, mimetype, or PK zip magic header)
    const isDocx = filename.endsWith(".docx") ||
        mimetype.includes("wordprocessingml") ||
        mimetype.includes("officedocument");

    const header = buffer.slice(0, 5).toString("ascii");
    const isZip = header.startsWith("PK");

    if (isDocx || (!header.startsWith("%PDF") && isZip)) {
        try {
            const result = await mammoth.extractRawText({ buffer });
            if (result && result.value && result.value.trim()) {
                return result.value;
            }
            throw new Error("No text content could be found in the Word document");
        } catch (docxErr) {
            console.error("DOCX PARSE ERROR:", docxErr);
            throw new Error(`Word document parsing failed: ${docxErr.message}`);
        }
    }

    // 2. Plain Text Support (.txt)
    if (filename.endsWith(".txt") || mimetype.includes("text/plain")) {
        return buffer.toString("utf-8");
    }

    // 3. PDF Support via pdf-parse
    try {
        const data = await pdfParse(buffer);
        if (data && data.text && data.text.trim()) {
            return data.text;
        }

        // If pdf-parse succeeded but text is empty, it's likely a scanned image PDF
        throw new Error(
            "PDF contains no selectable text (it may be a scanned image or photo). Please upload a text-based PDF or Word document."
        );
    } catch (error) {
        console.error("REAL PDF ERROR:", error);

        // Preserve our custom message
        if (error.message.includes("scanned image")) {
            throw error;
        }

        // If file header is not PDF
        if (!header.startsWith("%PDF")) {
            throw new Error(
                "Uploaded file does not appear to be a valid PDF. Please check the file format."
            );
        }

        throw new Error(`PDF parsing failed: ${error.message || "Invalid or password-protected PDF"}`);
    }
};

module.exports = extractPDFText;



