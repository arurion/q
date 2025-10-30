Vue.component('accordion-container', {
    model: {
        prop: 'isOpen',
        event: 'change'
    }, props: {
        isOpen: {
            type: Boolean,
            default: true
        },
        text: {
            type: String,
            default: ''
        }
    },
    data: function () {
        return {
            innerIsOpen: this.isOpen
        };
    },
    computed: {
        triangle() {
            return this.innerIsOpen ? '▼' : '▶';
        }
    },
    watch: {},
    methods: {
        handleClick: function () {
            this.innerIsOpen = !this.innerIsOpen;
            this.$emit('change', this.innerIsOpen);
        }
    },
    template: `
        <div style="display: flex;flex-wrap: wrap;">
            <div class="flex-item width-full" style="font-weight: bold;" @click="handleClick">
                {{ triangle }} {{ text }}
            </div>
            <slot v-if="innerIsOpen"></slot>
        </div>`
});