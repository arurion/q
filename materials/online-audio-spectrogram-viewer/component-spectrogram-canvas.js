Vue.component('spectrogram-canvas', {
    props: {
        isActive: {
            type: Boolean,
            default: false,
            required: true
        },
        analyserNode: {
            type: AnalyserNode,
            default: null,
            required: true
        },
        colorMap: {
            type: Array,
            default: function () {
                return Array(256).fill(null).map(function () { return [0, 0, 0]; });
            },
            validator: function (array) {
                try {
                    if (array.length !== 256) {
                        return false;
                    } else {
                        return array.every(function (color) {
                            return color.length === 3 && color.every(function (value) {
                                return value >= 0 && value <= 255 && Math.floor(value) === value
                            });
                        });
                    }
                } catch (e) {
                    return false;
                }
            }
        },
        frameSkip: {
            type: Number,
            default: 1
        },
        width: {
            type: Number,
            default: 640
        },
        height: {
            type: Number,
            default: 480
        },
        offset: {
            type: Number,
            default: 0
        },
    },
    data: function () {
        return {
            canvas: null,
            canvasOff: null,
            renderCtx: null,
            renderCtxOff: null,
            observer: null,
            clientWidth: this.width,
            clientHeight: this.height,
            frameCount: 0,
            timestamps: Array(this.width)
        };
    },
    computed: {
        fftSizeOptimized: function () {
            if (this.isOptimizingFftSize) {
                return this.fftSize;
            } else {
                return this.fftSize;
            }
        }
    },
    watch: {
        isActive: function (newValue, oldValue) {
            if (newValue && !oldValue) {
                this.startMainLoop();
            }
        },
        width: 'clear',
        height: 'clear'
    },
    mounted: function () {
        this.canvas = this.$refs.canvas;
        this.canvasOff = this.$refs.offscreenCanvas;
        this.renderCtx = this.$refs.canvas.getContext('2d', { alpha: false });
        this.renderCtxOff = this.$refs.offscreenCanvas.getContext('2d', { alpha: false });
        this.$nextTick(function () {
            this.clear();
        });
        const vm = this;
        // this.observer = new MutationObserver(function () {
        // });
        // this.observer.observe(this.canvas, { attriblutes: true, attributeFilter: ['style'] });
        window.addEventListener('resize', function (event) {
            vm.clientWidth = vm.canvas.clientWidth;
            vm.clientHeight = vm.canvas.clientHeight;
        });
        vm.clientWidth = vm.canvas.clientWidth;
        vm.clientHeight = vm.canvas.clientHeight;
    },
    methods: {
        startMainLoop: function () {
            requestAnimationFrame(this.mainLoop);
        },
        mainLoop: function (timestamp) {
            this.feed(timestamp);

            if (this.isActive) {
                requestAnimationFrame(this.mainLoop);
            } else {
                this.frameCount = 0;
            }
        },
        clear: function () {
            this.renderCtxOff.fillStyle = 'rgb(' + this.colorMap[0].join(',') + ')';
            this.renderCtxOff.fillRect(0, 0, this.width, this.height);

            this.renderCtx.fillStyle = 'rgb(' + this.colorMap[0].join(',') + ')';
            this.renderCtx.fillRect(0, 0, this.width, this.height);

            this.timestamps = Array(this.width);

            this.dispatchPaintEvent();
        },
        redraw: function () {
            if (this.renderCtx && this.renderCtxOff) {
                this.renderCtx.drawImage(this.canvasOff, 0, 0);
                this.dispatchPaintEvent();
            }
        },
        feed: function (timestamp) {
            this.frameCount++;
            if (this.frameCount < this.frameSkip) {
                return;
            } else {
                this.frameCount = this.frameCount % this.frameSkip;
            }

            this.timestamps.shift();
            this.timestamps.push(timestamp);

            this.renderCtxOff.drawImage(this.canvasOff, -1, 0);

            const fftData = new Uint8Array(this.analyserNode.frequencyBinCount);
            this.analyserNode.getByteFrequencyData(fftData);

            const imageData = this.renderCtxOff.createImageData(1, this.height);
            const pixelData = imageData.data;

            for (let i = 0; i < pixelData.length; i += 4) {
                const pos = Math.floor((pixelData.length - i) / 4) - 1 + this.offset;

                let color;
                if (pos >= 0 && pos < fftData.length) {
                    color = this.colorMap[fftData[pos]];
                } else {
                    color = this.colorMap[0];
                }

                pixelData[i + 0] = color[0];
                pixelData[i + 1] = color[1];
                pixelData[i + 2] = color[2];
                pixelData[i + 3] = 255;
            }

            this.renderCtxOff.putImageData(imageData, this.width - 1, 0);

            this.renderCtx.drawImage(this.canvasOff, 0, 0);

            this.dispatchPaintEvent();
        },
        handleMouseEvent: function (event) {
            this.$emit(event.type, this.createPoint(event));
            if (!this.isActive) {
                this.renderCtx.drawImage(this.canvasOff, 0, 0);
                this.dispatchPaintEvent();
            }
        },
        handleTouchEvent: function (event) {
            // this.$emit(event.type, event.touches);
            // if (!this.isActive) {
            //     this.renderCtx.drawImage(this.canvasOff, 0, 0);
            //     this.$emit('paint', this.renderCtx)
            // }
        },
        createPoint(event) {
            const x = event.offsetX * this.width / this.clientWidth;
            const y = event.offsetY * this.height / this.clientHeight;
            return { x: Math.round(x), y: Math.round(y) };
        },
        dispatchPaintEvent() {
            this.$emit('paint', this.renderCtx, this.timestamps);
        }
    },
    template: '<div style="display: flex;">\
            <canvas ref="canvas" :width="width" :height="height" style="max-width: 100%;" @mousedown="handleMouseEvent" @mousemove="handleMouseEvent" @mouseup="handleMouseEvent" @mouseleave="handleMouseEvent" @touchstart="handleTouchEvent" @touchmove="handleTouchEvent" @touchend="handleTouchEvent"></canvas>\
            <canvas ref="offscreenCanvas" :width="width" :height="height" style="display: none;"></canvas>\
        </div>'
});