Vue.component('playback-button', {
    props: {
        isPlaying: {
            type: Boolean,
            default: false
        },
        playText: {
            type: String,
            default: 'Play'
        },
        pauseText: {
            type: String,
            default: 'Pause'
        }
    },
    computed: {
        text: function () {
            return this.isPlaying ? this.pauseText : this.playText;
        }
    },
    methods: {
        handleClick: function () {
            this.$emit('click', !this.isPlaying);
        }
    },
    template: '<button @click="handleClick">{{ text }}</button>'
});

Vue.component('timestamp', {
    props: {
        currentTime: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            default: 0
        }
    },
    computed: {
        innerCurrentTime: function () {
            return isNaN(this.currentTime) ? 0 : this.currentTime;
        },
        innerDuration: function () {
            return !isFinite(this.duration) || this.duration < 0 ? 0 : this.duration;
        },
        text: function () {
            const dateCurrentTime = new Date(0, 0, 0, 0, 0, this.innerCurrentTime, 0);
            const dateDuration = new Date(0, 0, 0, 0, 0, this.innerDuration, 0);
            return dateCurrentTime.toTimeString().slice(0, 8) + ' / '
                + dateDuration.toTimeString().slice(0, 8);
        }
    },
    template: '<span><slot></slot>{{ text }}</span>'
});

Vue.component('position-range', {
    props: {
        value: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            default: 0
        }
    },
    data: function () {
        return {
            isSeeking: false,
            innerValue: 0
        }
    },
    computed: {
        max: function () {
            return Math.ceil(this.duration);
        },
        isDisabled: function () {
            return this.max <= 0;
        }
    },
    methods: {
        handleChange: function (event) {
            this.innerValue = Number(event.target.value);
            this.$emit('input', this.duration * this.innerValue / this.max);
            // if (!this.isSeeking) {
            //     this.$emit('input', this.duration * this.innerValue / this.max);
            // }
        },
        handleMousedown: function () {
            // this.isSeeking = true;
        },
        handleMouseup: function () {
            // this.$emit('input', this.duration * this.innerValue / this.max);
            // this.isSeeking = false;
        }
    },
    template: '<input type="range" min="0" :max="max" :value="value" :disabled="isDisabled" @input="handleChange" @mousedown="handleMousedown" @mouseup="handleMouseup">'
});

Vue.component('volume-range', {
    props: {
        value: {
            type: Number,
            default: 1
        }
    },
    data: function () {
        return {
            max: 100
        }
    },
    computed: {
    },
    methods: {
        handleInput: function (event) {
            const value = Number(event.target.value);
            this.$emit('input', value / this.max);
        }
    },
    template: '<input type="range" min="0" :max="max" :value="value * max" @input="handleInput">'
});

Vue.component('audio-player', {
    inject: ['m'],
    props: {
        audioFile: {
            type: File,
            default: null
        },
        videoRecorderData: {
            type: Object,
            default: function () {
                return {
                    audioStream: null,
                    videoStream: null,
                    filename: 'video'
                };
            }
        },
        options: {
            type: Object,
            default: function () {
                return {
                    volume: 1,
                    isMuted: false,
                    loop: false
                };
            }
        }
    },
    data: function () {
        return {
            src: null,
            file: null,
            currentTime: 0,
            duration: 0,
            loop: this.options.loop,
            volume: this.options.volume,
            filename: '\xa0',
            isPlaying: false,
            isDisabled: true,
            background: '#eee'
        };
    },
    computed: {
    },
    watch: {
        audioFile: function (value) {
            this.setSelectedFile(value);
        },
        isPlaying: function (newValue, oldValue) {
            if (newValue && !oldValue) {
                // Play
                this.startMainLoop();
                this.$emit('play');
            } else if (!newValue && oldValue) {
                // Pause
                this.$emit('pause');
            }
        },
        volume: function (value) {
            this.audio.volume = value;
            this.handleOptionsChange();
        },
        loop: 'handleOptionsChange'
    },
    mounted: function () {
        this.audio = this.$refs.audio;
        this.audio.autoplay = true;
    },
    methods: {
        startMainLoop: function () {
            requestAnimationFrame(this.mainLoop);
        },
        mainLoop: function (timestamp) {
            this.currentTime = this.audio.currentTime;

            if (this.isPlaying) {
                requestAnimationFrame(this.mainLoop);
            }
        },
        toggleAudioPlayback: function (isPlaying) {
            if (this.isPlaying) {
                try {
                    this.audio.pause();
                    this.isPlaying = false;
                } catch (e) {
                }
            } else {
                try {
                    this.audio.play();
                    this.isPlaying = true;
                } catch (e) {
                }
            }
        },
        handleFileChange: function (event) {
            this.setSelectedFile(event.target.files[0]);
            this.$emit('file-change');
        },
        handleOptionsChange: function () {
            this.$emit('options-change', {
                loop: this.loop,
                volume: this.volume,
                isMuted: false
            });
        },
        setSelectedFile(file) {
            this.isPlaying = false;

            this.src = URL.createObjectURL(file);
            this.file = file;
        },
        handlePlay: function () {
            this.isPlaying = true;
        },
        handleEnded: function () {
            if (!this.loop) {
                this.isPlaying = false;
            }
        },
        handlePositionRangeChange: function (value) {
            this.audio.currentTime = value;
        },
        handleCanplay: function () {
            this.isDisabled = false;
            this.duration = this.audio.duration;

            if (!this.isPlaying) {
                this.currentTime = 0;
            }
            if (this.file) {
                this.filename = this.file.name;
            }
        },
        handleError: function (event) {
            this.isDisabled = true;

            this.isPlaying = false;
            this.duration = 0;
            this.currentTime = 0;
            this.filename = '\xa0';
        },
        handleCaptureStart: function (stream) {
            this.$emit('capture-start', stream);
        },
        handleCaptureStop: function (stream) {
            this.$emit('capture-stop', stream);
        },
    },
    template: `<div style="display: flex;flex-wrap: wrap;">
    <audio ref="audio" :src="src" :loop="loop" @canplay="handleCanplay" @play="handlePlay" @ended="handleEnded" @error="handleError"></audio>
    <div class="flex-item width-full" style="align-items: center;">
      <div style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;font-weight: bold;" v-text="filename"></div>
      <div style="white-space: nowrap;">
        <video-recorder v-bind="videoRecorderData" :record-text="m.record" :stop-text="m.stop" @start="background = '#fcc'" @stop="background = '#eee'">
          <button @click="$refs.file.click()">{{ m.selectAudio }}</button>
        </video-recorder>
      </div>
      <input ref="file" type="file" accept="audio/*,video/*" style="display:none;" @change="handleFileChange">
    </div>
    <position-range :value="currentTime" :duration="duration" @input="handlePositionRangeChange" style="width: 100%;margin: 2px 0;"></position-range>
    <div class="flex-item width-half">
      <div>
        <playback-button :is-playing="isPlaying" :disabled="isDisabled" :play-text="m.play" :pause-text="m.pause" style="" @click="toggleAudioPlayback"></playback-button>
        <audio-capturer :start-text="m.capture" :stop-text="m.stop" @start="handleCaptureStart" @stop="handleCaptureStop"></audio-capturer>
      </div>
      <timestamp :currentTime="currentTime" :duration="duration" style="display: block;margin: auto 0;"></timestamp>
    </div>
    <div class="flex-item width-half">
      <label style="display: flex;">
        <input v-model="loop" type="checkbox" style="display: block;margin: auto 3px;">
        <div style="display: block;margin: auto 3px;">{{ m.loop }}</div>
      </label>
      <label style="display: flex;">
        <div style="display: block;margin: auto 3px;">Vol.</div>
        <volume-range v-model.number="volume" style="display: block; width:100px;"></volume-range>
      </label>
    </div>
  </div>`
});
