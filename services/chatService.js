const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, } = require("@google/generative-ai");
  
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
  
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: process.env.LLM_INST,
});
  
const generationConfig = {
    temperature: 0.75,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};
  
async function chat(message) {
    const chatSession = model.startChat({
        generationConfig,
        history: [
        ],
    });
  
    const result = await chatSession.sendMessage(message);
    return result.response.text()
}

module.exports = { chat };
