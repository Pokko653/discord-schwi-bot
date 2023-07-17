const { AudioPlayerStatus, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioResource } = require('@discordjs/voice');
const { TextBasedChannel, EmbedBuilder, User } = require('discord.js');
const playdl = require('play-dl');

class MusicPlayer {
    constructor() {
        this.array = [];
        this.playing = false;
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        });

        this.player.on('stateChange', (oldState, newState) => { // for debug
            console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
            this.playing = (newState.status === 'playing');
        });

        this.player.on(AudioPlayerStatus.Idle, () => {
            this.dequeue();
            if (!this.isEmpty()) this.playMusic();
        });

        this.channel = null;
    }

    /**
     * @returns {Boolean} true if the queue is empty
     */
    isEmpty() {
        return !this.array.length;
    }

    /**
     * @returns {Number} Length of the queue
     */
    count() {
        return this.array.length;
    }

    /**
     * @returns {{resource: AudioResource, requestBy: User, videoDetail: playdl.YouTubeVideo}} playing (or about to play) music
     */
    curItem() {
        return this.array[0];
    }

    /**
     * @returns {{resource: AudioResource, requestBy: User, videoDetail: playdl.YouTubeVideo}} Most recently uploaded music
     */
    lastItem() {
        return this.array[this.array.length-1];
    }

    /**
     * @description Enqueue audio resource with YouTube url
     * @param {String} url YouTube url to enqueue
     * @param {User} user user who requested
     */
    async enqueue(url, user) {
        const info = await playdl.video_info(url, { language: 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6' });
        const stream = await playdl.stream_from_info(info);

        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });

        this.array.push({
            resource: resource,
            requestBy: user,
            videoDetail: info.video_details
        });
    }

    /**
     * @description Dequeue the first (played) music 
     */
    dequeue() {
        this.array.shift();
    }

    /**
     * @description Delete the specific music by index
     * @param {Number} idx Index that want to delete
     * @returns {{resource: AudioResource, requestBy: User, videoDetail: playdl.YouTubeVideo}} Deleted music info
     */
    remove(idx) {
        if (idx < 0 || idx >= this.array.length) throw Error('IndexError: Invalid index');

        if (idx === 0) {
            this.player.stop();
            return this.curItem();
        } else {
            return this.array.splice(idx, 1)[0];
        }
    }

    /**
     * @description Play first music in the queue with player
     * @return {{resource: AudioResource, requestBy: User, videoDetail: playdl.YouTubeVideo}} Played music
     */
    async playMusic() {
        const target = this.curItem();

        const resource = target.resource;
        this.player.play(resource);

        const embed = new EmbedBuilder()
            .setAuthor({ name: target.videoDetail.channel.name, iconURL: target.videoDetail.channel.iconURL() })
            .setTitle(target.videoDetail.title)
            .setURL(target.videoDetail.url)
            .setThumbnail(target.videoDetail.thumbnails[target.videoDetail.thumbnails.length-1].url)
            .addFields([
                { name: '\u200b', value: `**길이**\n${target.videoDetail.durationRaw}`, inline: true },
                { name: '\u200b', value: `**신청자**\n${target.requestBy.username}`, inline: true }
            ]);

        await this.channel.send({ content: '현재 재생중인 노래랍니다~', embeds: [embed] });
    }

    /**
     * @description Clear all music in queue and stop the player
     */
    clear() {
        this.array = [];
        this.player.stop();
    }

    /**
     * @param {TextBasedChannel} channel Text channel that the last command appeared
     * @description Set the property of channel
     */
    setCommandChannel(channel) {
        this.channel = channel;
    }
}

module.exports = MusicPlayer;