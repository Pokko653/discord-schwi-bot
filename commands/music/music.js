const { SlashCommandBuilder } = require('@discordjs/builders');
const { VoiceConnectionStatus, AudioPlayerStatus, joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');

// Requirement for queue system
const MusicPlayer = require('./musicPlayer');

// Manage connection and MusicPlayer by guildID
let connections = new Map(); // <guildId, connection>
let musicPlayers = new Map(); // <guildId, MusicPlayer>

let musicPlayer = new MusicPlayer();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('music')
		.setDescription('음악 재생 기능을 이용할 수 있다.')
        .addSubcommand(subcommand => 
			subcommand
            .setName('list')
            .setDescription('현재 큐에 남아있는 음악을 보여준다.')
		)
		.addSubcommand(subcommand => 
			subcommand
            .setName('play')
            .setDescription('큐에 음악을 넣고 재생한다.')
            .addStringOption(option =>
                option
                .setName('url')
                .setDescription('음악을 재생할 YouTube URL')
                .setRequired(true)
            )
		)
        .addSubcommand(subcommand => 
			subcommand
            .setName('skip')
            .setDescription('큐에 음악을 넣고 재생한다.')
            .addStringOption(option =>
                option
                .setName('url')
                .setDescription('음악을 재생할 YouTube URL')
                .setRequired(true)
            )
		)
		.addSubcommand(subcommand =>
			subcommand
            .setName('quit')
            .setDescription('큐에 있는 모든 음악을 삭제하고 채널에서 나간다.')
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		if (subcommand === 'play') {
            // console.log(interaction.member.voice);
			const channel = interaction.member.voice.channel;
            if (!channel) {
                await interaction.reply('Join voice channel first!');
                return;
            }

            try {
                // Since retrieving audio from YouTube takes long time, it need to defer reply
                await interaction.deferReply();

                // Create Voice Connection to join voice channel
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator
                });
                connection.on('stateChange', (oldState, newState) => {
                    console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
                });

                connection.subscribe(musicPlayer.player);

                // Retrieve Audio URL
                const targetURL = interaction.options.getString('url');
                await musicPlayer.enqueue(targetURL);
                await musicPlayer.playMusic();

                await interaction.editReply('Now playing.');
            } catch (error) {
                console.error(error);
            }
        
        } else if (subcommand === 'list') {
            
        } else if (subcommand === 'skip') {

		} else if (subcommand === 'quit') {
            const connection = getVoiceConnection(interaction.guildId);
            if (!connection) {
                await interaction.reply({content: 'Bot is not in any voice channel!', ephemeral: true});
                return;
            }

            musicPlayer.clear();
            connection.destroy();
			await interaction.reply('Quited from the channel.');
		}
	},
};