// 필요한 클래스 로드
const fs = require('node:fs'); // file system 모듈: /commands 디렉토리를 읽어 커맨드 파일 확인
const path = require('node:path'); // path utility 모듈: 파일과 디렉토리에 접근할 수 있는 경로 구축 도움
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

// 새로운 클라이언트 인스턴스 생성
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
	GatewayIntentBits.MessageContent
]});

// client에 commands 속성을 추가 -> 커맨드를 다른 파일에서 쉽게 접근 가능
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// 클라이언트가 준비되면 실행 (처음 한 번)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// 클라이언트 토큰으로 디스코드 로그인
client.login(token);

// 모든 메시지에 반응
// client.on(Events.MessageCreate, async msg => {
// 	console.log(msg.content);
// });

// 슬래시(/) 커맨드는 interaction임 -> interaction이 생성되었을 때 반응하는 이벤트 리스너 생성
client.on(Events.InteractionCreate, async interaction => {
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
});