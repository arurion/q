Vue.component('input-number', {
    props: {
        value: {
            type: Number,
            default: 0
        }
    },
    data: function () {
        return {
            innerMin: !isNaN(this.$attrs.min) ? Number(this.$attrs.min) : Number.NEGATIVE_INFINITY,
            innerMax: !isNaN(this.$attrs.max) ? Number(this.$attrs.max) : Number.POSITIVE_INFINITY,
            innerStep: !isNaN(this.$attrs.step) ? Number(this.$attrs.step) : 1,
            isInvalid: false
        };
    },
    computed: {
        innerValue: {
            get: function () {
                return this.value;
            },
            set: function (value) {
                if (value === '' || isNaN(value)) {
                    // this.isInvalid = true;
                    return;
                } else {
                    this.isInvalid = false;
                }
                //value = Number(Number(value).toFixed(this.digits));
                value = value < this.innerMin ? this.innerMin : value;
                value = value > this.innerMax ? this.innerMax : value;
                this.$emit('input', Number(value));
            }
        },
        digits: function () {
            const digits = -Math.floor(Math.log10(Math.abs(this.innerStep)));
            return digits < 0 ? 0 : digits;
        }
    },
    methods: {
        handleInput: function (event) {
            this.innerValue = event.target.value;
        },
        handleKeydown: function (event) {
            switch (event.key) {
                case 'PageUp':
                    event.preventDefault();
                    this.innerValue = this.innerValue + this.innerStep * 10;
                    break;
                case 'PageDown':
                    event.preventDefault();
                    this.innerValue = this.innerValue - this.innerStep * 10;
                    break;
            }
        },
        handleWheel: function (event) {
        },
        handleFocusin: function (event) {
            // this.isInvalid = false;
        },
        handleFocusout: function (event) {
            // if (this.innerValue === '' || isNaN(this.innerValue) || this.innerValue < this.innerMin || this.innerValue > this.innerMax) {
            //     this.isInvalid = true;
            // }
        }
    },
    template: '<input ref="input" default-value="50" v-bind="$attrs" :value="innerValue" :class="{ invalid: isInvalid }" type="number" @input="handleInput" @keydown="handleKeydown" @wheel="handleWheel" @focusin="handleFocusin" @focusout="handleFocusout">'
});

Vue.component('input-number-labeled', {
    props: {
        value: {
            type: Number,
            default: 0
        },
        text: {
            type: String,
            default: ''
        },
        inputWidth: {
            type: String,
            default: '60px'
        }
    },
    methods: {
        handleInput: function (value) {
            this.$emit('input', value);
        }
    },
    template: '\
        <label>\
            <div class="label">{{ text }}<slot></slot></div>\
            <input-number v-bind="$attrs" :value="value" :style="{ width: inputWidth }" @input="handleInput"></input-number>\
        </label>'
});

Vue.component('select-labeled', {
    model: {
        prop: 'value',
        event: 'change'
    },
    props: {
        value: {
            type: null,
            default: ''
        },
        text: {
            type: String,
            default: ''
        },
        options: {
            type: Array,
            default: function () {
                return [];
            }
        },
        inputWidth: {
            type: String,
            default: null
        }
    },
    methods: {
        handleChange: function (event) {
            this.$emit('change', event.target.value);
        }
    },
    template: '\
        <label>\
            <div class="label">{{ text }}<slot></slot></div>\
            <select v-bind="$attrs" :value="value" :style="{ width: inputWidth }" @change="handleChange">\
                <option value="" disabled>-</option>\
                <option v-for="item in options" :value="item.value" :selected="item.selected">{{ item.text }}</option>\
            </select>\
        </label>'
});

Vue.component('checkbox-labeled', {
    model: {
        prop: 'checked',
        event: 'change'
    },
    props: {
        checked: {
            type: Boolean,
            default: false
        },
        text: {
            type: String,
            default: ''
        }
    },
    methods: {
        handleChange: function (event) {
            this.$emit('change', event.target.checked);
        }
    },
    template: '\
        <label style="justify-content: start;">\
            <input v-bind="$attrs" :checked="checked" type="checkbox" style="display: block;margin: auto 3px;" @change="handleChange">\
            <div style="display: block;margin: auto 3px;">{{ text }}<slot></slot></div>\
        </label>'
});
