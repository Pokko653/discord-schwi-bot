class ChatHistoryService {
    constructor() {
        this.chatHistories = new Map();
        this.maxHistory = 50; 
    }
    
    /**
     * @description Add chat history to guild's chat histories
     * @param {String} guildId Guild to add history
     * @param {String} role Who sends this chat
     * @param {Parts[]} content Chat contents
     */
    addHistory(guildId, role, content) {
        if (!this.chatHistories.has(guildId)) this.chatHistories.set(guildId, new Array());

        const histories = this.chatHistories.get(guildId);
        const history = { role: role, parts: content };

        histories.push(history);
        if (histories.length > this.maxHistory) {
            histories.shift();
        }
    }

    /**
     * @description Get chat history of a guild. If no history is in that guild, return empty array
     * @param {String} guildId Guild to get history
     */
    getHistory(guildId) {
        return this.chatHistories.get(guildId) ?? [];
    }

    /**
     * @description Clear chat history of a guild
     * @param {String} guildId Guild to clear history
     */
    clearHistory(guildId) {
        this.chatHistories.set(guildId, new Array());
    }
}
    
module.exports = new ChatHistoryService();