const mongoose = require("mongoose");


const resumeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        filename: {
            type: String,
            required: true
        },

        contentType: {
            type: String
        },

        uploadDate: {
            type: Date,
            default: Date.now
        },

        atsScore: {
            type: Number,
            default: null
        },

        status: {
            type: String,
            enum: ["uploaded", "analyzed"],
            default: "uploaded"
        },
        parsedText: {
    type: String
}
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Resume", resumeSchema);