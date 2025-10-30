Vue.component('video-recorder', {
    inject: ['m'],
    props: {
        audioStream: {
            type: MediaStream,
            default: null
        },
        videoStream: {
            type: MediaStream,
            default: null
        },
        filename: {
            type: String,
            default: 'video'
        },
        audioBps: {
            type: Number,
            default: 128000
        },
        videoBps: {
            type: Number,
            default: 2500000
        },
        recordText: {
            type: String,
            default: 'Record'
        },
        stopText: {
            type: String,
            default: 'Stop'
        }
    },
    data: function () {
        return {
            url: null,
            canRecord: false,
            isRecording: false,
            recorder: null,
            state: store.state
        };
    },
    computed: {
        visibility: function () {
            return this.recorder ? 'visible' : 'hidden';
        },
        display: function () {
            return this.recorder ? 'inline' : 'none';
        },
        text: function () {
            return this.isRecording ? this.stopText : this.recordText;
        },
        outputStream: function () {
            let tracks = [];
            if (this.audioStream) {
                tracks = tracks.concat(this.audioStream.getAudioTracks());
            }
            if (this.videoStream) {
                tracks = tracks.concat(this.videoStream.getVideoTracks());
            }

            if (tracks.length === 0) {
                this.canRecord = false;
                return null;
            } else {
                this.canRecord = true;
            }

            const outputStream = new MediaStream();
            tracks.forEach(function (track) {
                outputStream.addTrack(track);
            });
            return outputStream;
        },
        options: function () {
            try {
                // throw new Error('"MediaRecorder" is not supported.');
                let mimeType = 'video/webm;codecs=h264';
                mimeType = MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm';
                return {
                    audioBitsPerSecond: this.state.recordingOptions.audioBps,
                    videoBitsPerSecond: this.state.recordingOptions.videoBps,
                    mimeType: mimeType
                };
            } catch (e) {
                return null;
            }
        }
    },
    watch: {
        options: 'updateRecorder',
        outputStream: 'updateRecorder'
    },
    created: function () {
    },
    methods: {
        handleRecordButtonClick: function () {
            if (this.recorder) {
                if (this.recorder.state !== 'recording') {
                    this.start();
                } else {
                    this.stop();
                }
            }
        },
        handleDownloadClick: function () {
            this.$refs.anchor.click();
        },
        start: function () {
            if (this.recorder && this.recorder.state !== 'recording') {
                this.recorder.start();
                this.url = null;
                this.isRecording = true;

                store.setBackgroundRecording();
                this.$emit('start');
            }
        },
        stop: function () {
            if (this.recorder && this.recorder.state === 'recording') {
                this.recorder.stop();

                store.setBackgroundNormal();
                this.$emit('stop');
            }
        },
        updateRecorder: function () {
            this.stop();
            const vm = this;
            try {
                // throw new Error('"MediaRecorder" is not supported.');
                const recorder = new MediaRecorder(vm.outputStream, vm.options);
                recorder.onstart = function () {
                    vm.chunks = [];
                };
                recorder.ondataavailable = function (event) {
                    vm.chunks.push(event.data);
                };
                recorder.onstop = function (event) {
                    if (vm.chunks.length > 0) {
                        const blob = new Blob(vm.chunks, { 'type': 'video/webm' });
                        if (vm.url) {
                            URL.revokeObjectURL(vm.url);
                        }
                        vm.url = URL.createObjectURL(blob);
                    } else {
                        vm.url = null;
                    }
                    vm.isRecording = false;
                };
                vm.recorder = recorder;
            } catch (error) {
                vm.recorder = null;
            }
        }
    },
    template: `<div>
        <slot></slot>
        <button style="display: none" :disabled="!canRecord" @click="handleRecordButtonClick">{{ text }}</button>
        <button style="display: none" :disabled="!url" @click="handleDownloadClick">{{ m.dlVideo }}</button>
        <a ref="anchor" :href="url" :download="filename + '.webm'"></a>
    </div>`
});