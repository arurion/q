Vue.component('frequency-cursor-options', {
    inject: ['m'],
    props: {
        options: {
            type: Object,
            default: function () {
                return {
                    isVisibleNoteName: true,
                    isVisibleTrainSpeed: false,
                    inputGearTeeth: 14,
                    outputGearTeeth: 99,
                    wheelDiameter: 820
                };
            }
        }
    },
    data: function () {
        return {
            isVisibleNoteName: this.options.isVisibleNoteName,
            isVisibleTrainSpeed: this.options.isVisibleTrainSpeed,
            inputGearTeeth: this.options.inputGearTeeth,
            outputGearTeeth: this.options.outputGearTeeth,
            wheelDiameter: this.options.wheelDiameter
        };
    },
    computed: {
        gearRatio: function () {
            if (this.inputGearTeeth !== 0) {
                return this.outputGearTeeth / this.inputGearTeeth;
            } else {
                return NaN;
            }
        },
        gearRatioText: function () {
            return this.gearRatio ? this.gearRatio.toFixed(2) : '-';
        },
        factor: function () {
            return this.wheelDiameter / this.outputGearTeeth / 1000 * Math.PI * 3600 / 1000;
        },
        styleDriveTrain: function () {
            return {
                display: this.isVisibleTrainSpeed ? 'flex' : 'none'
            };
        }
    },
    watch: {
        factor: {
            handler: 'handleValueChange',
            immediate: true
        },
        isVisibleNoteName: 'handleValueChange',
        isVisibleTrainSpeed: 'handleValueChange'
    },
    methods: {
        handleValueChange: function () {
            // console.log({
            //     isVisibleNoteName: this.isVisibleNoteName,
            //     isVisibleTrainSpeed: this.isVisibleTrainSpeed,
            //     factor: this.factor
            // });
            this.$emit('change', {
                isVisibleNoteName: this.isVisibleNoteName,
                isVisibleTrainSpeed: this.isVisibleTrainSpeed,
                inputGearTeeth: this.inputGearTeeth,
                outputGearTeeth: this.outputGearTeeth,
                wheelDiameter: this.wheelDiameter,
                speedPerFrequency: this.factor
            });
        }
    },
    template: `
        <div style="display: flex;flex-wrap: wrap;width: 100%;">
            <checkbox-labeled v-model="isVisibleNoteName" class="flex-item width-half">
                {{ m.showNoteName }}
            </checkbox-labeled>
            <checkbox-labeled style="display: none" v-model="isVisibleTrainSpeed" class="flex-item width-half">
                {{ m.showTrainSpeed }}
            </checkbox-labeled>
            <input-number-labeled v-model.number="outputGearTeeth" :style="styleDriveTrain" class="flex-item width-half" min="1" step="1">
                {{ m.outputGearTeeth }}
            </input-number-labeled>
            <input-number-labeled v-model.number="wheelDiameter" :style="styleDriveTrain" class="flex-item width-half" min="1" step="1">
                {{ m.wheelDiameter }}
            </input-number-labeled>
            <input-number-labeled v-model.number="inputGearTeeth" :style="styleDriveTrain" class="flex-item width-half" min="1" step="1">
                {{ m.inputGearTeeth }}
            </input-number-labeled>
            <label :style="styleDriveTrain" class="flex-item width-half">
                <div class="label">{{ m.gearRatio }}</div>
                <div>{{ gearRatioText }}</div>
            </label>
        </div>`
});