const { VoiceConnectionStatus, AudioPlayerStatus, joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioResource } = require('@discordjs/voice');
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
            this.playing = (newState === 'playing');
        });

        this.player.on(AudioPlayerStatus.Idle, () => {
            this.dequeue();
            if (!this.isEmpty()) this.playMusic();
        });
    }

    /**
     * @returns {Boolean} true if the queue is empty
     */
    isEmpty() {
        return !this.array.length;
    }

    /**
     * @returns {{resource: AudioResource, title: String, duration: String, thunbnailURL: String}} playing (or about to play) track
     */
    curItem() {
        return this.array[0];
    }

    /**
     * @description Enqueue audio resource with YouTube url
     * @param {String} url YouTube url to enqueue
     */
    async enqueue(url) {
        const info = await playdl.video_info(url);
        console.log(info.video_details);
        const stream = await playdl.stream_from_info(info);

        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });

        this.array.push({
            resource: resource,
            title: info.video_details.title,
            duration: info.video_details.durationRaw,
            thunbnailURL: info.video_details.thumbnails[info.video_details.thumbnails.length-1].url
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
     * @returns {{resource: AudioResource, title: String, duration: String, thunbnailURL: String}} Deleted music info
     */
    remove(idx) {
        if (idx < 0 || idx >= this.array.length) throw Error('IndexError: ');
        return this.array.splice(idx, 1)[0];
    }

    /**
     * @description Play first music in the queue with player
     */
    async playMusic() {
        const resource = this.curItem().resource;
        this.player.play(resource);
    }

    /**
     * @description Clear all music in queue and stop the player
     */
    clear() {
        this.array = [];
        this.player.stop();
    }
}

module.exports = MusicPlayer;