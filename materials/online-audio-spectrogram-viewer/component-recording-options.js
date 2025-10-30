Vue.component('recording-options', {
    inject: ['m'],
    props: {
        isRecording: {
            type: Boolean,
            default: false
        },
        videoBps: {
            type: Number,
            default: 8000000,
        },
        audioBps: {
            type: Number,
            default: 128000
        }
    },
    data: function () {
        return {
            innerVideoBps: this.videoBps,
            innerAudioBps: this.audioBps,
            selectAudioBps: [
                { text: '128kbps', value: 128000, selected: true },
                { text: '96kbps', value: 96000 },
                { text: '64kbps', value: 64000 }
            ],
            selectVideoBps: [
                { text: '8Mbps', value: 8000000 },
                { text: '4Mbps', value: 4000000, selected: true },
                { text: '2Mbps', value: 2000000 },
                { text: '1Mbps', value: 1000000 },
                { text: '0.5Mbps', value: 500000 }
            ]
        };
    },
    computed: {
    },
    watch: {
    },
    methods: {
        handleValueChange: function () {
            const options = {
                videoBps: this.innerVideoBps,
                audioBps: this.innerAudioBps
            };
            store.setRecordingOptions(options);
            this.$emit('change', options);
        }
    },
    template: `
        <div style="display: flex;flex-wrap: wrap;width: 100%;">
            <select-labeled v-model.number="innerVideoBps" :options="selectVideoBps" :disabled="isRecording" class="flex-item width-half" @change="handleValueChange">
                {{ m.videoQuality }}
            </select-labeled>
            <select-labeled v-model.number="innerAudioBps" :options="selectAudioBps" :disabled="isRecording" class="flex-item width-half" @change="handleValueChange">
                {{ m.audioQuality }}
            </select-labeled>
        </div>`
});