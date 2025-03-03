// 필요한 클래스 로드
const fs = require('node:fs'); // file system 모듈: /commands 디렉토리를 읽어 커맨드 파일 확인
const path = require('node:path'); // path utility 모듈: 파일과 디렉토리에 접근할 수 있는 경로 구축 도움
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

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

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// 클라이언트 토큰으로 디스코드 로그인
client.login(process.env.TOKEN);