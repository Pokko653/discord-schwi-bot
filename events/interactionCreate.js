const { Events } = require('discord.js');

// 슬래시(/) 커맨드는 interaction임 -> interaction이 생성되었을 때 반응하는 이벤트 리스너 생성
module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute (interaction) {
		if (!interaction.isChatInputCommand()) return; // 슬래시 커맨드가 아니면 무시
        
        // Collection에서 호출한 커맨드 이름으로 module을 찾음
        const command = interaction.client.commands.get(interaction.commandName); 
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) { // interaction이 응답되거나 지연 예약된(deferred) 경우 -> followUp으로 오류 표시
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
	},
};
