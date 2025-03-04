const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const chatHistoryService = require("./chatHistoryService");

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
  
async function chat(guildId, message, attachment = null) {
    const chatSession = model.startChat({
        generationConfig,
        history: chatHistoryService.getHistory(guildId)
    });

    const messageParts = (attachment != null)? [
        { 
            inlineData: {
                data: Buffer.from(await fetch(attachment.url).then((response) => response.arrayBuffer())).toString("base64"),
                mimeType: attachment.contentType,
            }
        },
        { 
            text: message 
        },
    ]: [{ text: message }];

    // Get result
    const result =  await chatSession.sendMessage(messageParts);

    // Add history
    chatHistoryService.addHistory(guildId, "user", messageParts);
    chatHistoryService.addHistory(guildId, "model", [{ text: result.response.text() }])

    return result.response.text();
}

module.exports = { chat };
