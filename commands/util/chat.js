const { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } = require('discord.js');
const { getConfig, setConfig } = require('../../services/configAccessService.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chat')
		.setDescription('Configure chatting feature on this server')
        .setNameLocalization('ko', '대화')
        .setDescriptionLocalization('ko', '채팅 기능 설정을 할 수 있다.')
        .addSubcommand(subcommand => 
			subcommand
            .setName('channel')
            .setNameLocalization('ko', '채널')
            .setDescription('Select default chatting channel to respond .')
            .setDescriptionLocalization('ko', '기본 채팅 채널을 선택한다.')
            .addChannelOption(option =>
                option
                .setName('channel')
                .setNameLocalization('ko', '채널')
                .setDescription('Channel to use as defualt response channel. Default: This channel ')
                .setDescriptionLocalization('ko', '기본 채팅 채널. 기본값: 이 명령어를 실행한 채널')
                .addChannelTypes(ChannelType.GuildText)
            )
		),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
        const guildId = interaction.guildId;
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'channel') {
            const channel = interaction.options.getChannel('channel') ?? interaction.channel;
            setConfig(guildId, process.env.CHAT_CHANNEL_ID, channel.id);

            await interaction.reply(`「성공」: 이제 ${channel.name} 채널을 기본 채팅 채널로 사용한다.`)
        }
	},
};