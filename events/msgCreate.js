const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json')
const chatService = require("../services/chatService")

// 모든 메시지에 반응: MessageCreate
module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute (message) {
        // Ignore bot's message
        if (message.author.bot) return null;

        const guild = message.guild;
        const channel = message.channel;
        const contents = message.content.trim();

        // Enlarge emoji
        const matchRes = contents.match(/^<:([a-zA-Z0-9_]+):([0-9]+)>(?!.)/); // 일반 이모지
        const matchGifRes = contents.match(/^<a:([a-zA-Z0-9_]+):([0-9]+)>(?!.)/); // GIF 이모지
        if (config[message.guildId].emojiLarge && (matchRes || matchGifRes)) {
            const emojiURL = matchRes? `https://cdn.discordapp.com/emojis/${matchRes[2]}.png`: `https://cdn.discordapp.com/emojis/${matchGifRes[2]}.gif`;
            const embed = new EmbedBuilder()
                .setColor(message.member.roles.color?.hexColor ?? '#000000')
                .setAuthor({ name: message.member.displayName, iconURL: message.member.displayAvatarURL()})
                .setImage(emojiURL);

            await message.delete();
            channel.send({ content: '', embeds: [embed] });
        } 
        // Respond chat with LLM
        else if (config[guild.id].chatChannelId === channel.id || contents.startsWith(`<@${process.env.CLIENT_ID}>`)) {
            // Ignore any image or attachments without any text message 
            if (contents.length === 0) return null;

            // Cut any mention or emojis
            const trimmedContents = contents
                .replace(/<:([a-zA-Z0-9_]+):([0-9]+)>/g, "")
                .replace(/<a:([a-zA-Z0-9_]+):([0-9]+)>/g, "")
                .replace(/<@[0-9]+>/g, "");

            await channel.send(await chatService.chat(`${message.member.displayName}: ${trimmedContents}`));
        }
	},
};
