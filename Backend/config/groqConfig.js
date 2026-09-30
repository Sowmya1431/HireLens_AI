const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Check API key and log models on startup
groq.models.list()
    .then(res => {
        const ids = (res.data || []).map(m => m.id);
        console.log("=========================================");
        console.log("GROQ API KEY IS VALID!");
        console.log("AVAILABLE MODELS:", ids);
        console.log("=========================================");
    })
    .catch(err => {
        console.error("=========================================");
        console.error("GROQ API KEY ERROR:", err.message);
        console.error("=========================================");
    });

module.exports = groq;