const { ChannelType, ChatInputCommandInteraction, VoiceChannel } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { VoiceConnectionStatus, AudioPlayerStatus, joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');

// Requirement for queue system
const MusicPlayer = require('./musicPlayer');

// Manage connection and MusicPlayer by guildID
let musicPlayers = new Map(); // <guildId, MusicPlayer>

module.exports = {
	data: new SlashCommandBuilder()
		.setName('music')
		.setDescription('음악 재생 기능을 이용할 수 있다.')
        .addSubcommand(subcommand => 
			subcommand
            .setName('join')
            .setDescription('지정된 음성 채널에 접속. 기본값: 사용자의 음성 채널')
            .addChannelOption(option => 
                option
                .setName('channel')
                .setDescription('봇이 접속할 음성 채널')
                .addChannelTypes(ChannelType.GuildVoice)
            )
		)
        .addSubcommand(subcommand => 
			subcommand
            .setName('list')
            .setDescription('현재 큐 표시.')
		)
		.addSubcommand(subcommand => 
			subcommand
            .setName('play')
            .setDescription('큐에 음악을 넣고 재생.')
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
            .setDescription('큐에 있는 음악을 제거. 기본값: 현재 재생중인 음악')
            .addNumberOption(option => 
                option
                .setName('index')
                .setDescription('삭제할 음악의 인덱스')
            )
		)
		.addSubcommand(subcommand =>
			subcommand
            .setName('quit')
            .setDescription('큐를 비우고 채널을 떠남.')
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
        musicPlayer.setCommandChannel(interaction.channel)// For auto play message, MusicPlayer saves chatting channel ID that command appear

        if (subcommand === 'join') {
            const channel = interaction.options.getChannel('channel') ?? interaction.member.voice.channel;
            if (!channel) {
                await interaction.reply({ content: '「에러」: 음성 채널을 지정하거나 음성 채널에 접속하여야 한다.', ephemeral: true });
                return;
            }

            try {
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator
                });

                connection.on('stateChange', (oldState, newState) => {
                    console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
                });

                connection.subscribe(musicPlayer.player);

                await interaction.reply(`「성공」: ${channel.name}에 접속했다.`);
            } catch (error) {
                console.error(error);
            }

        } else if (subcommand === 'play') {
            try {
                // Since retrieving audio from YouTube takes long time, it need to defer reply
                await interaction.deferReply();

                let connection = getVoiceConnection(interaction.guildId);
                // Create Voice Connection to join voice channel
                if (!connection) {
                    const channel = interaction.member.voice.channel;
                    if (!channel) {
                        await interaction.editreply({ content: '「에러」: 먼저 음성 채널에 접속하여야 하거나, \'/music join\'을 이용해 봇을 접속시켜야 한다.', ephemeral: true });
                        return;
                    }

                    connection = joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: channel.guild.voiceAdapterCreator
                    });
                }

                connection.on('stateChange', (oldState, newState) => {
                    console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
                });

                connection.subscribe(musicPlayer.player);

                // Retrieve Audio URL
                const targetURL = interaction.options.getString('url');
                await musicPlayer.enqueue(targetURL, interaction.member.user);
                const enqueued = musicPlayer.lastItem();
                await interaction.editReply(`「성공」: 큐의 ${musicPlayer.count()}번 항목에 \`${enqueued.videoDetail.title} (${enqueued.videoDetail.durationRaw})\`(을)를 추가했다.`);

                if (!musicPlayer.playing) {
                    await musicPlayer.playMusic();
                }
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
                message += `#${Number(i)+1}: \`${musicPlayer.array[i].videoDetail.title} (${musicPlayer.array[i].videoDetail.durationRaw})\` by \`${musicPlayer.array[i].requestBy.username}\`\n`;
            }

            await interaction.reply({ content: message.trim(), ephemeral: true });

        } else if (subcommand === 'skip') {
            const idx = interaction.options.getNumber('index') ?? 1;

            try {
                const removed = musicPlayer.remove(idx-1);
                await interaction.reply(`「성공」: \`${removed.videoDetail.title} (${removed.videoDetail.durationRaw})\`를 삭제했다.`);
            } catch (error) {
                await interaction.reply({content: '「에러」: 없는 인덱스.', ephemeral: true });
            }
            
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
};