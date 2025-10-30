const vm = new Vue({
    el: '#app',
    provide: function () {
        return {
            m: m
        };
    },
    props: {
        spectrogramWidth: {
            type: Number,
            default: 640
        },
        spectrogramHeight: {
            type: Number,
            default: 480
        }
    },
    data: function () {
        return {
            m: m,
            lang: lang,
            state: store.state,
            isOpen: {
                SpectrogramOptions: true,
                frequencyCursorOptions: true,
                recordingOptions: true,
            },
            canUseWebAudio: false,
            canUseMediaRecorder: false,
            url: null,
            width: this.spectrogramWidth,
            height: this.spectrogramHeight,
            isPlaying: false,
            isCapturing: false,
            file: null,
            audioContext: null,
            mediaElementSourceNode: null,
            mediaStreamSourceNode: null,
            analyserNode: null,
            mediaStreamDestinationNode: null,
            frequencies: [],
            colorMap: Array(256).fill(null).map(function () {
                return [0, 0, 0];
            }),
            audioPlayerOptions: {
                volume: 100,
                isMuted: false,
                loop: false
            },
            spectrogramOptions: {
                frequencies: [0, 1000, 2000],
                fftSize: 8192,
                frameSkip: 1,
                minFrequency: 0,
                offset: 0,
                color: 'purple',
                maxDecibels: -40,
                minDecibels: -80,
                isClearSpectrogram: true
            },
            frequencyCursorOptions: {
                isVisibleNoteName: true,
                isVisibleTrainSpeed: false,
                inputGearTeeth: 14,
                outputGearTeeth: 99,
                wheelDiameter: 820,
                speedPerFrequency: 0
            },
            recordingOptions: {
                videoBps: 8000000,
                audioBps: 128000
            },
            pixelPerFrequency: NaN,
            point: {
                begin: null,
                end: null
            },
            font: '15px Arial, sans-serif',
            noteNames: [
                'A / ラ',
                'A# / ラ♯',
                'B / シ',
                'C / ド',
                'C# / ド♯',
                'D / レ',
                'D# / レ♯',
                'E / ミ',
                'F / ファ',
                'F# / ファ♯',
                'G / ソ',
                'G# / ソ♯',
                '-'
            ],
            videoRecorderData: {
                audioStream: null,
                videoStream: null,
                filename: 'video'
            }
        }
    },
    computed: {
        isActive: function () {
            return this.isPlaying || this.isCapturing;
        },
        isExistFrequencyMarker: function () {
            return this.frequencies.length > 0;
        },
        filename: function () {
            return this.file ? this.file.name : '';
        },
        filenameWithoutExtention: function () {
            const lastIndex = this.filename.lastIndexOf('.');
            return lastIndex === -1 ? this.filename : this.filename.substring(0, lastIndex);
        },
        filenameSpectrogram: function () {
            return this.filenameWithoutExtention ? this.filenameWithoutExtention + '-spectrogram' : 'video';
        }
    },
    watch: {
        filenameSpectrogram: function (value) {
            this.videoRecorderData.filename = value;
        }
    },
    created: function () {
        this.loadSettings();
        window.addEventListener('beforeunload', this.saveSettings.bind(this));

        if (typeof MediaRecorder !== 'undefined') {
            this.canUseMediaRecorder = true;
        }

        // Seamless loop by Web Audio API.
        try {
            //throw '"Web Audio API" is not supported.';
            this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.smoothingTimeConstant = 0;

            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.renderCtx = this.canvas.getContext('2d');

            this.canUseWebAudio = true;
        } catch (e) {
            this.canUseWebAudio = false;
        }
    },
    mounted: function () {
        if (!this.canUseWebAudio) {
            return;
        }

        try {
            //throw '"Media Stream API" is not supported.';
            this.mediaStreamDestinationNode = this.audioContext.createMediaStreamDestination();
            this.analyserNode.connect(this.mediaStreamDestinationNode);

            this.videoRecorderData.audioStream = this.mediaStreamDestinationNode.stream;
            this.videoRecorderData.videoStream = this.$refs.spectrogram.canvas.captureStream(60);
        } catch (e) {
            this.videoRecorderData.audioStream = null;
            this.videoRecorderData.videoStream = null;
        }

        this.mediaElementSourceNode = this.audioContext.createMediaElementSource(this.$refs.player.audio);
        this.mediaElementSourceNode.connect(this.analyserNode);
        this.mediaElementSourceNode.connect(this.audioContext.destination);
    },
    methods: {
        handleDragover: function (event) {
            event.stopPropagation();
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        },
        handleDrop: function (event) {
            event.stopPropagation();
            event.preventDefault();

            this.file = event.dataTransfer.files[0];
            this.$refs.spectrogram.clear();
            this.wakeupAudioContext();
        },
        handleFileSelect: function () {
            this.$refs.spectrogram.clear();
            this.wakeupAudioContext();
        },
        handlePlay: function () {
            this.isPlaying = true;
        },
        handlePause: function () {
            this.isPlaying = false;
        },
        handleCaptureStart: function (stream) {
            if (this.audioContext && this.analyserNode) {
                this.mediaStreamSourceNode = this.audioContext.createMediaStreamSource(stream);
                this.mediaStreamSourceNode.connect(this.analyserNode);
                this.isCapturing = true;
            }

            this.wakeupAudioContext();
        },
        handleCaptureStop: function (stream) {
            if (this.mediaStreamSourceNode) {
                this.mediaStreamSourceNode.disconnect();
                this.mediaStreamSourceNode = null;
                this.isCapturing = false;
            }
        },
        handleAudioPlayerOptionsChange: function (options) {
            this.audioPlayerOptions = options;
        },
        handleSpectrogramOptionsChange: function (options) {
            this.pixelPerFrequency = options.pixelPerFrequency;
            this.colorMap = options.colorMap;
            this.frequencies = options.frequencies;
            this.spectrogramOptions = options;

            const vm = this;
            this.$nextTick(function () {
                if (options.isClearSpectrogram) {
                    vm.$refs.spectrogram.clear();
                }
                vm.renderFrequencyCursors(options.cursors);
                vm.$refs.spectrogram.redraw();
            });
        },
        handleFrequencyOptionsChange: function (options) {
            this.frequencyCursorOptions = options;
        },
        handleRecordingOptionsChange: function (options) {
            this.recordingOptions = options;
        },
        handleMousedown: function (point) {
            this.point.begin = point;
        },
        handleMousemove: function (point) {
            this.point.end = point;
        },
        handleMouseup: function (point) {
            this.point.begin = null;
        },
        handleMouseleave: function () {
            this.point.begin = null;
            this.point.end = null;
        },
        handleSpectrogramPaint: function (context, timestamps) {
            this.paintTexts(context, timestamps);
        },
        paintTexts: function (context, timestamps) {
            const width = context.canvas.width;
            const height = context.canvas.height;
            const offset = this.spectrogramOptions.offset;

            // Render frequency marks to the spectrogram.
            if (this.isExistFrequencyMarker) {
                context.save();
                context.globalCompositeOperation = 'difference';
                context.drawImage(this.canvas, 0, 0);
                context.restore();
            }

            context.save();

            context.translate(0, 0.5);

            // NOTE: 'difference' + fillText is very heavy on Firefox.
            context.globalCompositeOperation = 'difference';
            context.strokeStyle = 'white';
            context.fillStyle = 'white';
            context.lineWidth = 1;

            context.font = this.font;

            context.textBaseline = 'bottom';
            context.textAlign = 'left';

            context.beginPath();

            const fftSize = this.analyserNode.fftSize;
            const sampleRate = this.analyserNode.context.sampleRate;
            const pixelPerFrequency = fftSize / sampleRate;

            const options = this.frequencyCursorOptions;
            const begin = this.point.begin;
            const end = this.point.end;
            if (end) {
                if (begin && options.isVisibleTrainSpeed && this.pixelPerFrequency > 0 && begin.x !== end.x) {
                    context.moveTo(begin.x, begin.y);
                    context.lineTo(end.x, end.y);

                    const isRightBegin = begin.x < end.x;
                    const isPositive = begin.y > end.y;

                    const frequencyBegin = (this.height - 1 - begin.y + offset) / this.pixelPerFrequency;
                    const frequencyEnd = (this.height - 1 - end.y + offset) / this.pixelPerFrequency;

                    const speedBegin = frequencyBegin * options.speedPerFrequency;
                    const speedEnd = frequencyEnd * options.speedPerFrequency;

                    let acceleration;
                    const timeBegin = timestamps[begin.x];
                    const timeEnd = timestamps[end.x];
                    if (!isNaN(timeBegin) && !isNaN(timeEnd) && timeBegin !== timeEnd) {
                        acceleration = (speedEnd - speedBegin) / (timeEnd - timeBegin) * 1000;
                    }
                    let text;

                    text = acceleration ? acceleration.toFixed(2) + 'km/h/s' : '';
                    context.textBaseline = isPositive ^ isRightBegin ? 'bottom' : 'top';
                    context.textAlign = 'left';
                    context.fillText(text, (begin.x + end.x) / 2, (begin.y + end.y) / 2);

                    text = frequencyBegin.toFixed(1) + 'Hz, ' + speedBegin.toFixed(1) + 'km/h';
                    context.textBaseline = isPositive ? 'top' : 'bottom';
                    context.textAlign = 'center';
                    context.fillText(text, begin.x, begin.y);

                    text = frequencyEnd.toFixed(1) + 'Hz, ' + speedEnd.toFixed(1) + 'km/h';
                    context.textBaseline = isPositive ? 'bottom' : 'top';
                    context.textAlign = 'center';
                    context.fillText(text, end.x, end.y);
                } else {
                    const y = end.y;
                    const frequency = (height - 1 - y + offset) / pixelPerFrequency;
                    if (y >= 0) {
                        const texts = [];
                        texts.push(frequency.toFixed(1) + 'Hz');
                        if (options.isVisibleTrainSpeed && options.speedPerFrequency > 0) {
                            const speed = frequency * options.speedPerFrequency;
                            texts.push(speed.toFixed(1) + 'km/h');
                        }
                        // texts.push((frequency * 20).toFixed(0) + 'rpm');
                        if (options.isVisibleNoteName) {
                            texts.push(this.getNoteName(frequency));
                        }

                        context.moveTo(0, y);
                        context.lineTo(width, y);
                        context.fillText(texts.join(', '), 0, y);
                    }
                }
            }

            context.stroke();

            context.restore();
        },
        renderFrequencyCursors: function (cursors) {
            if (!this.renderCtx) {
                return;
            }

            const width = this.renderCtx.canvas.width;
            const height = this.renderCtx.canvas.height;
            const offset = this.spectrogramOptions.offset;

            this.renderCtx.clearRect(0, 0, width, height);

            this.renderCtx.save();

            this.renderCtx.translate(0, 0.5);

            this.renderCtx.strokeStyle = 'white';
            this.renderCtx.lineWidth = 1;

            this.renderCtx.fillStyle = 'white';
            this.renderCtx.font = this.font;

            this.renderCtx.textBaseline = 'bottom';
            this.renderCtx.textAlign = 'left';

            this.renderCtx.beginPath();

            const vm = this;
            cursors.forEach(function (cursor) {
                const y = height - 1 - Math.floor(cursor.distance) + offset;
                vm.renderCtx.moveTo(0, y);
                vm.renderCtx.lineTo(width, y);
                vm.renderCtx.fillText(cursor.frequency + 'Hz', 0, y);
            });

            this.renderCtx.stroke();

            this.renderCtx.restore();
        },
        getNoteName: function (frequency) {
            return this.noteNames[this.getNoteNameIndex(frequency)];
        },
        getNoteNameIndex: function (frequency) {
            if (frequency <= 0) {
                return 12;
            } else if (frequency < 440) {
                while (frequency < 440) {
                    frequency *= 2;
                }
            } else if (frequency > 880) {
                {
                    while (frequency > 880) frequency /= 2;
                }
            }

            for (let i = 0; i < 12; i++) {
                const min = 440 * Math.pow(2, (2 * i - 1) / 24.0);
                const max = 440 * Math.pow(2, (2 * i + 1) / 24.0);

                if (frequency > min && frequency <= max) {
                    return i;
                }
            }

            return 0;
        },
        loadSettings: function () {
            if (localStorage) {
                const json = JSON.parse(localStorage.getItem('audioSpectrogramViewer'));
                if (json) {
                    this.isOpen = json.isOpen || this.isOpen;
                    this.audioPlayerOptions = json.audioPlayerOptions || this.audioPlayerOptions;
                    this.spectrogramOptions = json.spectrogramOptions || this.spectrogramOptions;
                    this.frequencyCursorOptions = json.frequencyCursorOptions || this.frequencyCursorOptions;
                    this.recordingOptions = json.recordingOptions || this.recordingOptions;
                    this.state.recordingOptions = this.recordingOptions;
                }
            }
        },
        saveSettings: function () {
            if (localStorage) {
                const json = {
                    isOpen: Object.assign({}, this.isOpen),
                    audioPlayerOptions: Object.assign({}, this.audioPlayerOptions),
                    frequencyCursorOptions: Object.assign({}, this.frequencyCursorOptions),
                    spectrogramOptions: Object.assign({}, this.spectrogramOptions),
                    recordingOptions: Object.assign({}, this.recordingOptions),
                };
                delete json.spectrogramOptions.colorMap;
                localStorage.setItem('audioSpectrogramViewer', JSON.stringify(json));
            }
        },
        verifyValueIntPositive: function (value, defaultValue, minValue, maxValue) {
            minValue = isNaN(minValue) ? 1 : minValue;
            maxValue = isNaN(minValue) ? Number.POSITIVE_INFINITY : maxValue;

            if (isNaN(value) || value < minValue || value > maxValue) {
                return defaultValue;
            } else {
                return Math.floor(Number(value));
            }
        },
        verifyValueSlip: function (value, defaultValue) {
            if (isNaN(value)) {
                return defaultValue;
            } else {
                return Number(value);
            }
        },
        verifyValueBoolean: function (value, defaultValue) {
            if (value === true || value === 'true') {
                return true;
            } else if (value === false || value === 'false') {
                return false;
            } else {
                return defaultValue;
            }
        },
        wakeupAudioContext: function () {
            if (this.audioContext) {
                this.audioContext.resume();
            }
        }
    }
});