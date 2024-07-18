const { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Retrieve designated user\'s profile image')
		.setNameLocalization('ko', '아바타')
		.setDescriptionLocalization('ko', '특정 사용자의 프로필 사진을 가져온다')
        .addUserOption(option => 
            option.setName('user')
            .setDescription('The user you want to retrieve')
			.setNameLocalization('ko', '대상')
			.setDescriptionLocalization('ko', '프로필 사진을 가져올 사용자')
            .setRequired(true)
		)
		.addBooleanOption(option =>
			option.setName('guild')
			.setDescription('Whether retrieve guild avatar or not. Defualt: true')
			.setNameLocalization('ko', '서버')
			.setDescriptionLocalization('ko', 'true면 서버 프로필 사진을 갖고 온다. 기본값: true')
			.setRequired(false)
		),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const isGuild = interaction.options.getBoolean('isGuild') ?? true;
		const targetUser = interaction.options.getUser('user');
		const targetMember = await interaction.guild.members.fetch(targetUser.id);

		const profileURL = isGuild? targetMember.displayAvatarURL({ format: 'png', size: 1024}): targetUser.displayAvatarURL({ format: 'png', size: 1024});
		const embed = new EmbedBuilder()
			.setColor(0x009B59B6)
			.setAuthor({ name: targetMember.displayName, iconURL: targetMember.displayAvatarURL() })
			.setImage(profileURL)
			.setFooter({ text: 'SchwiBot', iconURL: interaction.client.user.avatarURL()});

        await interaction.reply({ content: `「정보」: \`${targetMember.displayName}\`의 프로필 사진 정보이다.`, embeds: [embed]});
	},
};