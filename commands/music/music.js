const { ChannelType, ChatInputCommandInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { VoiceConnectionStatus, joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

// Requirement for queue system
const MusicPlayer = require('./musicPlayer');

// Manage connection and MusicPlayer by guildID
let musicPlayers = new Map(); // <guildId(String), MusicPlayer>

module.exports = {
	data: new SlashCommandBuilder()
		.setName('music')
        .setNameLocalization('ko', '음악')
		.setDescription('Control music bot')
        .setDescriptionLocalization('ko', '음악 재생 모듈을 이용할 수 있다.')
        .addSubcommand(subcommand => 
			subcommand
            .setName('join')
            .setNameLocalization('ko', '접속')
            .setDescription('Join the voice channel. Default: Channel where the user is')
            .setDescriptionLocalization('ko', '슈비가 지정된 음성 채널에 접속한다. 기본값: 사용자의 현재 음성 채널')
            .addChannelOption(option => 
                option
                .setName('channel')
                .setNameLocalization('ko', '채널')
                .setDescription('Voice channel the bot will join')
                .setDescriptionLocalization('ko', '봇이 접속할 음성 채널')
                .addChannelTypes(ChannelType.GuildVoice)
            )
		)
        .addSubcommand(subcommand => 
			subcommand
            .setName('list')
            .setNameLocalization('ko', '목록')
            .setDescription('Display the current queue')
            .setDescriptionLocalization('ko', '현재 대기열을 보여준다.')
		)
		.addSubcommand(subcommand => 
			subcommand
            .setName('play')
            .setNameLocalization('ko', '재생')
            .setDescription('Enqueue the music with YouTube URL and play it')
            .setDescriptionLocalization('ko', '대기열에 음악을 넣고 재생한다.')
            .addStringOption(option =>
                option
                .setName('url')
                .setDescription('YouTube URL that will be played')
                .setDescriptionLocalization('ko', '음악을 재생할 YouTube URL')
                .setRequired(true)
            )
		)
        .addSubcommand(subcommand => 
			subcommand
            .setName('skip')
            .setNameLocalization('ko', '스킵')
            .setDescription('Delete music from the queue. Default: Currently playing music')
            .setDescriptionLocalization('ko', '대기열에 있는 음악을 제거한다. 기본값: 현재 재생중인 음악')
            .addNumberOption(option => 
                option
                .setName('index')
                .setNameLocalization('ko', '번호')
                .setDescription('Index that will be deleted')
                .setDescriptionLocalization('ko', '삭제할 음악의 번호')
            )
		)
        .addSubcommand(subcommand => 
            subcommand
            .setName('loop')
            .setNameLocalization('ko', '반복')
            .setDescription('Toggle the loop option')
            .setDescriptionLocalization('ko', '음악을 반복한다.')
            .addBooleanOption(option =>
                option
                .setName('boolean')
                .setNameLocalization('ko', '설정값')
                .setDescription('Boolean value expressing whether loop is on')
                .setDescriptionLocalization('ko', '반복 여부를 나타내는 불리언 값')
            )
        )
		.addSubcommand(subcommand =>
			subcommand
            .setName('quit')
            .setNameLocalization('ko', '종료')
            .setDescription('Clear the queue and leave the channel')
            .setDescriptionLocalization('ko', '대기열를 모두 비우고 채널 접속을 끊는다.')
		),

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
        const guildID = interaction.guildId;
        
        // Initial setting
        if (!musicPlayers.has(guildID)) {
            console.log('New musicplayer pair was created');
            musicPlayers.set(guildID, new MusicPlayer());
        }

        /**
         * @type {MusicPlayer}
         */
        let musicPlayer = musicPlayers.get(guildID);
        musicPlayer.setCommandChannel(interaction.channel) // For auto play message, MusicPlayer saves chatting channel ID that command appear

        if (subcommand === 'join') {
            const channel = interaction.options.getChannel('channel') ?? interaction.member.voice.channel;
            if (!channel) {
                await interaction.reply({ content: '「에러」: 음성 채널을 지정하거나 음성 채널에 접속하여야 한다.', ephemeral: true });
                return;
            }

            try {
                const connection = this.generateConnection(channel);
                connection.subscribe(musicPlayer.player);

                await interaction.reply(`「성공」: ${channel.name}에 접속했다.`);
            } catch (error) {
                console.error(error);
            }

        } else if (subcommand === 'list') {
            if (musicPlayer.isEmpty()) {
                await interaction.reply({ content: '「에러」: 큐가 비어있다.', ephemeral: true });
                return;
            }

            let message = '「정보」: 현재 큐에 있는 노래들이다.\n';
            for (let i in musicPlayer.array) {
                message += `#${Number(i)+1}: \`${musicPlayer.array[i].videoDetail.title} (${musicPlayer.array[i].videoDetail.durationRaw})\` by \`${musicPlayer.array[i].requestBy.username}\``;
                message += (i === "0" && musicPlayer.isLooping)? ' [반복중]\n': '\n';
            }

            await interaction.reply({ content: message.trim(), ephemeral: true });

        } else if (subcommand === 'play') {
            // Since retrieving audio from YouTube takes long time, it need to defer reply
            await interaction.deferReply();

            try {
                // Construct connection
                const channel = interaction.member.voice.channel; // 음성 채널에 없을 때는 VoiceState를 불러올 수 없으므로, guildID도 같이 전달하도록 함.
                const connection = this.generateConnection(channel, guildID);
                if (!connection) {
                    await interaction.editReply({ content: '「에러」: 먼저 음성 채널에 접속하여야 하거나, \'/music join\'을 이용해 봇을 접속시켜야 한다.', ephemeral: true });
                    return;
                }

                connection.subscribe(musicPlayer.player);

                // Enqueue music
                const targetURL = interaction.options.getString('url');
                const isSuccess = await musicPlayer.enqueue(targetURL, interaction.member.user);
                if(!isSuccess) throw Error('Enqueue failed.');

                const enqueued = musicPlayer.lastItem();
                await interaction.editReply(`「성공」: 큐의 ${musicPlayer.count()}번 항목에 \`${enqueued.videoDetail.title} (${enqueued.videoDetail.durationRaw})\`(을)를 추가했다.`);

                if (!musicPlayer.isPlaying) {
                    await musicPlayer.playMusic();
                }
            } catch (error) {
                console.error(error);
                await interaction.editReply({content: '「에러」: URL이 잘못됨.', ephemeral: true });
            }
        } else if (subcommand === 'skip') {
            const idx = interaction.options.getNumber('index') ?? 1;

            try {
                const removed = musicPlayer.remove(idx-1);
                await interaction.reply(`「성공」: \`${removed.videoDetail.title} (${removed.videoDetail.durationRaw})\`를 삭제했다.`);
            } catch (error) {
                await interaction.reply({content: '「에러」: 없는 인덱스.', ephemeral: true });
            }

        } else if (subcommand === 'loop') {
            const bool = interaction.options.getBoolean('boolean') ?? !musicPlayer.isLooping;
            musicPlayer.setIsLooping(bool);

            await interaction.reply(`「정보」: 이제 반복 설정이 \`${bool}\`(으)로 변경되었다.`);
            
		} else if (subcommand === 'quit') {
            const connection = getVoiceConnection(interaction.guildId);
            if (!connection) {
                await interaction.reply({content: '「에러」: 아무 채널에도 있지 않다.', ephemeral: true });
                return;
            }

            musicPlayer.clear();
            connection.destroy();
			await interaction.reply('「정보」: 모든 음악을 큐에서 삭제하고 채널을 나갔다.');
		}
	},
    generateConnection(channel, guildID) {
        let connection = getVoiceConnection(guildID);
        
        if (!connection && !!channel) {
            connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator
            });

            connection.on('stateChange', (oldState, newState) => {
                console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
            });

            connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                try {
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                    // Seems to be reconnecting to a new channel - ignore disconnect
                } catch (error) {
                    // Seems to be a real disconnect which SHOULDN'T be recovered from - destroy connection
                    connection.destroy();
                }
            });
        } 

        return connection;
    }
};