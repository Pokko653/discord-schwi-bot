const { Events, EmbedBuilder } = require('discord.js');
const Settings = require('../bot_setting.json');

// 모든 메시지에 반응: MessageCreate
module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute (msg) {
        if (!Settings[msg.guildId].EmojiLarge) return null;

		const channel = msg.channel;
        const contents = msg.content.trim();

        const matchRes = contents.match(/^<:([a-zA-Z0-9_]+):([0-9]+)>(?!.)/); // 일반 이모지
        const matchGifRes = contents.match(/^<a:([a-zA-Z0-9_]+):([0-9]+)>(?!.)/); // GIF 이모지
        if (matchRes || matchGifRes) {
            const emojiURL = matchRes? `https://cdn.discordapp.com/emojis/${matchRes[2]}.png`: `https://cdn.discordapp.com/emojis/${matchGifRes[2]}.gif`;
            const embed = new EmbedBuilder()
                .setColor(msg.member.roles.color?.hexColor ?? '#000000')
                .setAuthor({ name: msg.author.displayName, iconURL: msg.author.avatarURL()})
                .setImage(emojiURL);

            await msg.delete();
            channel.send({ content: '', embeds: [embed] });
        }
	},
};
