// Client instance 접근 시: interaction.client로 접근 가능
// 외부 파일 접근 시: require()로 접근 가능

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // data(property): 디스코드 상에 보여질 메타데이터, execute(method): 커멘드 실행 시 이벤트 핸들러로부터 실행될 함수를 담은 메서드 
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		const locales = {
			ko: `${interaction.user.username}님, 안녕하세요!`
		}

		await interaction.reply(locales[interaction.locale] ?? `Pong to ${interaction.user.username}!`);
	},
};