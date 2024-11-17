// Client instance 접근 시: interaction.client로 접근 가능
// 외부 파일 접근 시: require()로 접근 가능

const { SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');

module.exports = {
    // data(property): 디스코드 상에 보여질 메타데이터, execute(method): 커멘드 실행 시 이벤트 핸들러로부터 실행될 함수를 담은 메서드 
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Show ping of the bot')
		.setNameLocalization('ko', '핑')
		.setDescriptionLocalization('ko', '봇의 핑을 보여준다.'),

	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		// const locales = {
		// 	ko: `${interaction.user.username}님, 안녕하세요!`
		// }
		// await interaction.reply(locales[interaction.locale] ?? `Pong to ${interaction.user.username}!`);
		
		const sent = await interaction.reply({ content: '「대기」: 측정 중...', fetchReply: true });

		let pingList = [(sent.createdTimestamp - interaction.createdTimestamp), NaN, NaN, NaN, NaN], prevTime = sent.createdTimestamp;
		for (let i=1; i<5; i++) {
			let sentRepeat = await interaction.editReply(`「대기」: 측정 중...\n\`\`\`prolog\n${pingList.map((x) => isNaN(x)? `---ms`: `${x}ms`).join(' | ')}\`\`\``);
			pingList[i] = sentRepeat.editedTimestamp - prevTime;
			prevTime = sentRepeat.editedTimestamp;
		}
	
		await interaction.editReply(`「정보」: 평균 왕복 지연 시간: ${Math.round(pingList.reduce((acc, cur) => acc + cur, 0) / 5)}ms\n\`\`\`prolog\n${pingList.map((x) => isNaN(x)? `----ms`: `${x}ms`).join(' | ')}\`\`\``);
	},
};