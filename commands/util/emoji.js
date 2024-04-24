const { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const Settings = require('../../bot_setting.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('emoji')
		.setDescription('Configure emoji settings on this server')
        .setNameLocalization('ko', '이모지')
        .setDescriptionLocalization('ko', '이모지 관련 기능을 이용할 수 있다.')
        .addSubcommand(subcommand => 
			subcommand
            .setName('send')
            .setNameLocalization('ko', '전송')
            .setDescription('Send the emoji to server in specific size')
            .setDescriptionLocalization('ko', '이모지를 지정한 크기로 보낸다.')
            .addStringOption(option =>
                option
                .setName('emoji')
                .setNameLocalization('ko', '이모지')
                .setDescription('Emoji be sent')
                .setDescriptionLocalization('ko', '보낼 이모지')
                .setRequired(true)
            )
            .addIntegerOption(option => 
                option
                .setName('size')
                .setNameLocalization('ko', '크기')
                .setDescription('Emoji size (1 ~ 5)')
                .setDescriptionLocalization('ko', '이모지의 크기 (1 ~ 5)')
                .setMaxValue(5)
                .setMinValue(1)
                .setRequired(false)
            )
		)
        .addSubcommand(subcommand => 
			subcommand
            .setName('enlarge')
            .setNameLocalization('ko', '확대')
            .setDescription('Toggle whether the bot enlarge emoji when sending emoji')
            .setDescriptionLocalization('ko', '이모지를 확대 기능을 켜거나 끈다.')
            .addBooleanOption(option =>
                option
                .setName('boolean')
                .setNameLocalization('ko', '설정값')
                .setDescription('Boolean expressing whether the bot enlarges emoji')
                .setDescriptionLocalization('ko', '확대 여부를 나타내는 불린 값')
            )
        ),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'send') {
            const target = interaction.options.getString('emoji');
            const size = interaction.options.getInteger('size');

            const matchRes = target.match(/^<:([a-zA-Z0-9_]+):([0-9]+)>(?!.)/); // 일반 이모지 탐색
            const matchGifRes = target.match(/^<a:([a-zA-Z0-9_]+):([0-9]+)>(?!.)/); // GIF 이모지 탐색

            if (matchRes) {
                const emojiURL = `https://cdn.discordapp.com/emojis/${matchRes[2]}.png`;

                // when size declared: 1 = 64*64, 2 = 128*128, 3 = 256*256, 4 = 512*512, 5 = 1024*1024
                if (size) {
                    const canvas = Canvas.createCanvas(Math.pow(2, size+5), Math.pow(2, size+5));
                    const ctx = canvas.getContext('2d');

                    const emojiImg = await Canvas.loadImage(emojiURL);
                    ctx.drawImage(emojiImg, 0, 0, canvas.width, canvas.height);

                    const attach = new AttachmentBuilder(await canvas.encode('png'), { name: `${matchRes[1]}_resized.png`});
                    const embed = new EmbedBuilder()
                        .setColor(interaction.member.roles.color?.hexColor ?? '#000000')
                        .setAuthor({ name: interaction.member.displayName, iconURL: interaction.user.avatarURL()})
                        .setImage(`attachment://${matchRes[1]}_resized.png`);

                    await interaction.reply({ content: '', embeds: [embed], files: [attach]});
                } else {
                    const embed = new EmbedBuilder()
                        .setColor(interaction.member.roles.color?.hexColor ?? '#000000')
                        .setAuthor({ name: interaction.member.displayName, iconURL: interaction.user.avatarURL()})
                        .setImage(emojiURL);

                    await interaction.reply({ content: '', embeds: [embed] });
                }
                
            } else if (matchGifRes) {
                const emojiURL = `https://cdn.discordapp.com/emojis/${matchGifRes[2]}.gif`;
                const embed = new EmbedBuilder()
                    .setColor(interaction.member.roles.color?.hexColor ?? '#000000')
                    .setAuthor({ name: interaction.member.displayName, iconURL: interaction.member.avatarURL()})
                    .setImage(emojiURL);

                await interaction.reply({ content: '', embeds: [embed] });                
            } else {
                await interaction.reply({ content: '「에러」: 이모지가 아님.', ephemeral: true });
            }
        } else if (subcommand === 'enlarge') {
            const bool = interaction.options.getBoolean('boolean') ?? !Settings[interaction.guildId].EmojiLarge;
            Settings[interaction.guildId].EmojiLarge = bool;

            await interaction.reply(`「정보」: 이제 이모티콘을 크게 ${bool? '한다.': '하지 않는다.'}`);
        }
	},
};