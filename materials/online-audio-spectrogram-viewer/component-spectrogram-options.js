Vue.component('spectrogram-options', {
    inject: ['m'],
    props: {
        analyserNode: {
            type: AnalyserNode,
            default: null
        },
        options: {
            type: Object,
            default: function () {
                return {
                    frequencies: [0, 1000, 2000],
                    frameSkip: 1,
                    fftSize: 8192,
                    offset: 0,
                    color: 'purple',
                    maxDecibels: -40,
                    minDecibels: -80,
                    minFrequency: 0,
                    isClearSpectrogram: false
                };
            }
        }
    },
    data: function () {
        return {
            selectFftSize: [
                { text: '1024', value: '1024' },
                { text: '2048', value: '2048' },
                { text: '4096', value: '4096' },
                { text: '8192', value: '8192', selected: true },
                { text: '16384', value: '16384' },
                { text: '32768', value: '32768' },
            ],
            selectColor: [
                { text: 'Purple', value: 'purple', selected: true },
                { text: 'Red', value: 'red' },
                { text: 'Blue', value: 'blue' },
                { text: 'Audacity', value: 'audacity' },
                { text: 'Hue', value: 'hue' }
            ],
            selectFrameRate: [
                { text: '60fps', value: '1', selected: true },
                { text: '30fps', value: '2' },
                { text: '20fps', value: '3' },
                { text: '15fps', value: '4' },
                { text: '12fps', value: '5' },
                { text: '10fps', value: '6' }
            ],
            frequenciesText: this.options.frequencies.join(' '),
            fftSize: this.options.fftSize,
            frameSkip: this.options.frameSkip,
            color: this.options.color,
            gain: -this.options.maxDecibels,
            range: -this.options.minDecibels + this.options.maxDecibels,
            minFrequency: this.options.minFrequency,
            isClearSpectrogram: this.options.isClearSpectrogram,
            colorMaps: colorMaps
        };
    },
    computed: {
        frequencies: function () {
            return this.frequenciesText.split(/[, \t\r]/)
                .map(function (text) { return parseFloat(text); })
                .filter(function (value) { return value >= 0; })
                .filter(function (value, i, array) { return array.indexOf(value) === i; })
                .sort(function (a, b) { return a - b; });
        },
        cursors: function () {
            const pixelPerFrequency = this.pixelPerFrequency;
            if (pixelPerFrequency > 0) {
                return this.frequencies.map(function (frequency) {
                    return {
                        frequency: frequency,
                        distance: frequency * pixelPerFrequency
                    };
                });
            } else {
                return [];
            }
        },
        pixelPerFrequency: function () {
            if (this.analyserNode) {
                const fftSize = this.fftSize;
                // "analyserNode.context.sampleRate" is not reactive.
                const sampleRate = this.analyserNode.context.sampleRate;
                return fftSize / sampleRate;
            } else {
                return NaN;
            }
        },
        offset: function () {
            if (this.minFrequency > 0 && this.pixelPerFrequency > 0) {
                return Math.floor(this.minFrequency * this.pixelPerFrequency);
            } else {
                return 0;
            }
        }
    },
    watch: {
        frequencies: {
            handler: 'handleValueChange',
            immediate: true
        },
        frameSkip: 'handleValueChange',
        fftSize: 'handleValueChange',
        color: 'handleValueChange',
        gain: 'handleValueChange',
        range: 'handleValueChange',
        minFrequency: 'handleValueChange',
        isClearSpectrogram: 'handleValueChange'
    },
    methods: {
        handleValueChange: function () {
            const options = {
                frequencies: this.frequencies.slice(),
                frameSkip: this.frameSkip,
                fftSize: Number(this.fftSize),
                minFrequency: this.minFrequency,
                offset: this.offset,
                color: this.color,
                maxDecibels: -this.gain,
                minDecibels: -this.gain - this.range,
                colorMap: this.colorMaps[this.color],
                cursors: this.cursors,
                pixelPerFrequency: this.pixelPerFrequency,
                isClearSpectrogram: this.isClearSpectrogram
            };

            if (this.analyserNode) {
                try {
                    this.analyserNode.fftSize = options.fftSize;
                } catch (e) {
                }
                try {
                    this.analyserNode.minDecibels = options.minDecibels;
                } catch (e) {
                }
                try {
                    this.analyserNode.maxDecibels = options.maxDecibels;
                } catch (e) {
                }
            } else {
            }

            this.$emit('change', options);
        },
        verifySelectValue(array, value) {
            const isValid = array.some(function (item) { return item.value === value; });
            if (isValid) {
                return value;
            } else {
                return array.find(function (item) { return item.selected; });
            }
        }
    },
    template: `
        <div style="display: flex;flex-wrap: wrap;">
            <checkbox-labeled v-model="isClearSpectrogram" class="flex-item width-half">
                {{ m.clearSpectrogramOnChange }}
            </checkbox-labeled>
            <label class="flex-item width-half">
                <div class="label">{{ m.frequencyMarks }}</div>
                <input v-model="frequenciesText" style="flex-grow: 1;margin-left: 0.5rem;">
            </label>
            <input-number-labeled v-model.number="minFrequency" class="flex-item width-one-third" min="0" step="100">
                {{ m.minFrequency }}[Hz]
            </input-number-labeled>
            <select-labeled v-model.number="frameSkip" :options="selectFrameRate" class="flex-item width-one-third">
                {{ m.frameRate }}
            </select-labeled>
            <select-labeled v-model.number="fftSize" :options="selectFftSize" class="flex-item width-one-third">
                {{ m.fftSize }}
            </select-labeled>
            <select-labeled v-model.number="color" :options="selectColor" class="flex-item width-one-third">
                {{ m.color }}
            </select-labeled>
            <input-number-labeled v-model.number="gain" min="1" max="99" step="1" class="flex-item width-one-third">
                {{ m.gain }}[dB]
            </input-number-labeled>
            <input-number-labeled v-model.number="range" min="1" step="1" class="flex-item width-one-third">
                {{ m.range }}[dB]
            </input-number-labeled>
        </div>`
});