const { GoogleGenAI } = require("@google/genai");
const chatHistoryService = require("./chatHistoryService");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
const generationConfig = {
    systemInstruction: process.env.LLM_INST,
    temperature: 0.75,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};
  
async function chat(guildId, message, attachment = null) {
    const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        config: generationConfig,
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
        }
    ]: [{ text: message }];

    // Get result
    const response = await chat.sendMessage({ message: messageParts });

    // Add history
    chatHistoryService.addHistory(guildId, "user", messageParts);
    chatHistoryService.addHistory(guildId, "model", [{ text: response.text }]);

    return response.text;
}

module.exports = { chat };
