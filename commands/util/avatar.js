const { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('사용자의 프로필 사진을 가지고 온다.')
        .addUserOption(option => 
            option.setName('user')
            .setDescription('프로필 사진을 가져올 사용자')
            .setRequired(true)
		),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const target = interaction.options.getUser('user');
		const embed = new EmbedBuilder()
			.setColor(0x009B59B6)
			.setAuthor({ name: target.username, iconURL: target.avatarURL()})
			.setImage(target.displayAvatarURL({ format: 'png', size: 1024}))
			.setFooter({ text: 'SchwiBot', iconURL: interaction.client.user.avatarURL()});

        await interaction.reply({ content: `「정보」: ${target.username}의 프로필 사진 정보이다.`, embeds: [embed]});
	},
};