require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("KEY =", process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash"
        });

        const result = await model.generateContent("hello");
        console.log(result.response.text());
    } catch (err) {
        console.log(err);
    }
}

test();