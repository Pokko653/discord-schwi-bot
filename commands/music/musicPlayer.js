const { AudioPlayerStatus, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioResource } = require('@discordjs/voice');
const { TextBasedChannel, EmbedBuilder, User } = require('discord.js');
const playdl = require('play-dl');

class MusicPlayer {
    constructor() {
        this.array = [];
        this.isPlaying = false;
        this.isLooping = false;
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause
            }
        });

        this.player.on('stateChange', (oldState, newState) => { // for debug
            console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
            this.isPlaying = (newState.status === 'playing');
        });

        this.player.on(AudioPlayerStatus.Idle, async () => {
            if (this.isLooping) {
                let loopingMusic = this.dequeue();

                // Update AudioResource
                const stream = await playdl.stream(loopingMusic.videoDetail.url);
                loopingMusic.resource = createAudioResource(stream.stream, {
                    inputType: stream.type
                });

                this.array.splice(0, 0, loopingMusic);
            } else {
                this.dequeue();
            }

            if (!this.isEmpty()) this.playMusic();
            else this.channel.send('「완료」: 모든 음악을 재생하였다.');
        });

        this.channel = null;
    }

    /**
     * @description True if the queue is empty or false if the queue has any music
     * @returns {Boolean} true if the queue is empty
     */
    isEmpty() {
        return !this.array.length;
    }

    /**
     * @description Return the number of musics in the queue
     * @returns {Number} Length of the queue
     */
    count() {
        return this.array.length;
    }

    /**
     * @description Return the music that playing (or will be playing)
     * @returns {{resource: AudioResource, requestBy: User, videoDetail: playdl.YouTubeVideo}} playing (or about to play) music
     */
    curItem() {
        return this.array[0];
    }

    /**
     * @description Return the music that recently added
     * @returns {{resource: AudioResource, requestBy: User, videoDetail: playdl.YouTubeVideo}} Most recently uploaded music
     */
    lastItem() {
        return this.array[this.array.length-1];
    }

    /**
     * @description Enqueue audio resource with YouTube url
     * @param {String} url YouTube url to enqueue
     * @param {User} user user who requested
     * @returns True if the music is normally enqueued
     */
    async enqueue(url, user) {
        try {
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

            return true;
        } catch (error) {
            console.error(error);
            return false;
        }   
    }

    /**
     * @description Dequeue the first (played) music 
     * @returns {{resource: AudioResource, requestBy: User, videoDetail: playdl.YouTubeVideo}} Dequeued music info
     */
    dequeue() {
        return this.array.shift();
    }

    /**
     * @description Delete the specific music by index
     * @param {Number} idx Index that want to delete
     * @returns {{resource: AudioResource, requestBy: User, videoDetail: playdl.YouTubeVideo}} Deleted music info
     */
    remove(idx) {
        if (idx < 0 || idx >= this.array.length) throw RangeError('Invalid index');

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
            .setDescription(this.isLooping? '(반복중)': '\u200b')
            .setThumbnail(target.videoDetail.thumbnails[target.videoDetail.thumbnails.length-1].url)
            .addFields([
                { name: '\u200b', value: `**길이**\n${target.videoDetail.durationRaw}`, inline: true },
                { name: '\u200b', value: `**신청자**\n${target.requestBy.username}`, inline: true }
            ]);

        await this.channel.send({ content: '「정보」: 현재 재생중인 음악 정보:', embeds: [embed] });
    }

    /**
     * @description Clear all music in queue and stop the player
     */
    clear() {
        this.array = [];
        this.player.stop();
    }

    /**
     * @description Set the property of channel
     * @param {TextBasedChannel} channel Text channel that the last command appeared
     */
    setCommandChannel(channel) {
        this.channel = channel;
    }

    /**
     * @description Set the boolean of looping
     * @param {Boolean} bool Boolean that will be set to this object
     */
    setIsLooping(bool) {
        this.isLooping = bool;
    }
}

module.exports = MusicPlayer;