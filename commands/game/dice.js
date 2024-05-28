const { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dice')
        .setNameLocalization('ko', '주사위')
		.setDescription('Roll a dice, default: 1d6')
        .setDescriptionLocalization('ko', '주사위를 굴려준다. 기본값: 1d6')
        .addIntegerOption(option =>
            option
            .setName('number')
            .setNameLocalization('ko', '수')
            .setDescription('number of dice(1 ~ 65535), default: 1')
            .setDescriptionLocalization('ko', '던질 주사위의 수(1 ~ 65535), 기본값: 1')
            .setMinValue(1)
            .setMaxValue(65535)
            .setRequired(false)
		)
        .addIntegerOption(option => 
            option
            .setName('faces')
            .setNameLocalization('ko', '면')
            .setDescription('number of face(1 ~ 2⁵³-1), default: 6')
            .setDescriptionLocalization('ko', '면의 수(1 ~ 2⁵³-1), 기본값: 6')
            .setMinValue(1)
            .setMaxValue(Number.MAX_SAFE_INTEGER)
            .setRequired(false)
        ),
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
        try {
            const faces = interaction.options.getInteger('faces') ?? 6;
            const n = interaction.options.getInteger('number') ?? 1;

            let res = '';
            if (n === 1) {
                res += `\`${Math.ceil(Math.random() * faces)}\``;
            } else {
                const rndArr = Array.from({ length: n }, () => Math.ceil(Math.random() * faces));
                const sum = rndArr.reduce(( acc, x ) => acc + x, 0);

                const displayArr = (rndArr.length > 100)? JSON.stringify(rndArr.slice(0, 100)).replace(/,/g, ', ').replace(']', ', ...]'): JSON.stringify(rndArr);
                const displaySum = (sum > Number.MAX_SAFE_INTEGER)? sum.toExponential(): sum;
                res += `\`${displayArr}\` → \`${displaySum}\``;
            }

            await interaction.reply(`「성공」: \`${n}d${faces}\` → ${res}`);
        } catch (e) {
            console.log(e)
            await interaction.reply({content: '「에러」: 주사위가 책상 밑으로 굴러가버렸다... 다시 시도 부탁한다.', ephemeral: true });
        }
	},
};