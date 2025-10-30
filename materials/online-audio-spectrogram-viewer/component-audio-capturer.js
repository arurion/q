Vue.component('audio-capturer', {
    inject: ['m'],
    props: {
        constraints: {
            type: Object,
            default: function () {
                return {
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                    }
                };
            }
        },
        startText: {
            type: String,
            default: 'Capture'
        },
        stopText: {
            type: String,
            default: 'Stop'
        }
    },
    data: function () {
        return {
            mediaDevices: null,
            captureStream: null,
            isGettingUserMedia: false,
            isCapturing: false
        };
    },
    computed: {
        display: function () {
            return this.mediaDevices ? 'inline' : 'none';
        },
        text: function () {
            return this.isCapturing ? this.stopText : this.startText;
        }
    },
    watch: {
    },
    created: function () {
        try {
            this.mediaDevices = navigator.mediaDevices;
        } catch (e) {
            this.mediaDevices = null;
        }
    },
    methods: {
        handleCaptureButtonClick: function () {
            if (this.mediaDevices) {
                if (!this.isCapturing) {
                    this.start();
                } else {
                    this.stop();
                }
            }
        },
        start: function () {
            if (this.mediaDevices) {
                this.isGettingUserMedia = true;
                const vm = this;
                this.mediaDevices.getUserMedia(this.constraints).then(function (stream) {
                    vm.captureStream = stream;
                    vm.isGettingUserMedia = false;
                    vm.isCapturing = true;
                    vm.$emit('start', vm.captureStream);
                }).catch(function (error) {
                    vm.isGettingUserMedia = false;
                    vm.captureStream = null;
                    vm.isCapturing = false;
                    console.error(error.message);
                });
            }
        },
        stop: function () {
            if (this.captureStream) {
                this.captureStream.getVideoTracks().forEach(t => t.stop());
                this.captureStream.getAudioTracks().forEach(t => t.stop());
                this.isCapturing = false;
                this.$emit('stop', this.captureStream);
                this.captureStream = null;
            }
        }
    },
    template: '<button :style="{ display: display }" :disabled="isGettingUserMedia" @click="handleCaptureButtonClick">{{ text }}</button>'
});