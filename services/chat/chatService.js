const { GoogleGenAI, Type } = require("@google/genai");
const chatHistoryService = require("./chatHistoryService");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
const searchGoogleDeclaration = {
    name: "searchGoogle",
    description: "Tool: Google Search \n" +
        "This tool allows the chatbot to retrieve up-to-date information from the web. It must be used in the following cases: \n" +
        "1. Recent Events & News – The LLM does not have real-time knowledge. If a user asks about current events, trends, or anything that may have changed after 2024-06, use this tool. \n" + 
        "2. Live Data & Updates – If a user requests real-time information, such as sports scores, weather, stock prices, or product availability, the chatbot must perform a search. \n" +
        "3. Company & Business Information – For questions about specific businesses, services, or local places that may have changed, search instead of relying on outdated knowledge. \n" +
        "4. Technical or Niche Information – If a user asks about software updates, research papers, or any evolving field, the chatbot should retrieve the latest details. \n" + 
        "5. Verification & Accuracy – If an answer could be outdated or if the chatbot is unsure, it should default to searching rather than guessing. \n" +
        "⚠ Important: The chatbot should always use the tool for these cases, rather than relying on its internal knowledge.)",
    parameters: {
        type: Type.OBJECT,
        properties: {
            question: {
                type: Type.STRING,
                description: 'Question to ask. It must be sentence.'
            }
        },
        required: ['question']
    }
}

const generationConfig = {
    systemInstruction: process.env.LLM_INST,
    temperature: 0.75,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
    tools: [{
        functionDeclarations: [searchGoogleDeclaration]
    }]
};

const generationConfigWithGoogleSearch = {
    systemInstruction: process.env.LLM_INST,
    temperature: 0.75,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
    tools: [{
        googleSearch: {},
    }]
};

const tools = {
    // to-do
};

async function chat(guildId, message, attachment = null) {
    const chatSession = ai.chats.create({
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
    const response = await chatSession.sendMessage({ message: messageParts });

    if (response.functionCalls && response.functionCalls.length > 0) {
        if (response.functionCalls.some((call) => call.name === "searchGoogle")) {
            // Google Search is needed: Use another chatbot instance that can search google

            // To pop function call part, delete recent chat pair
            chatHistoryService.removeHistoryPair(guildId); 

            const chatSessionWithGoogleSearch = ai.chats.create({
                model: "gemini-2.0-flash",
                config: generationConfigWithGoogleSearch,
                history: chatHistoryService.getHistory(guildId)
            });

            const finalResponse = await chatSessionWithGoogleSearch.sendMessage({ message: messageParts });

            // Add history
            chatHistoryService.addHistory(guildId, "user", messageParts);
            chatHistoryService.addHistory(guildId, "model", [{ text: finalResponse.text }]);

            return finalResponse.text;
        } else {
            const functionCalls = response.functionCalls;
            const functionResults = await Promise.all(functionCalls.map(async (call) => ({ functionResponse: { name: call.name, response: await tools[call.name](call.args) } })));

            // Add function call and result as history
            chatHistoryService.addHistory(guildId, "user", messageParts);
            chatHistoryService.addHistory(guildId, "model", [{ text: response.text }].concat(functionCalls.map(call => ({ functionCall: call }))));

            const chatSessionWithFunctionCall = ai.chats.create({
                model: "gemini-2.0-flash",
                config: generationConfig,
                history: chatHistoryService.getHistory(guildId)
            });

            const finalResponse = await chatSessionWithFunctionCall.sendMessage({ message: functionResults });

            // Add history
            chatHistoryService.addHistory(guildId, "user", functionResults);
            chatHistoryService.addHistory(guildId, "model", [{ text: finalResponse.text }]);

            return finalResponse.text;
        }
    } else {
        // Add history
        chatHistoryService.addHistory(guildId, "user", messageParts);
        chatHistoryService.addHistory(guildId, "model", [{ text: response.text }]);

        return response.text;
    }
}

module.exports = { chat };
