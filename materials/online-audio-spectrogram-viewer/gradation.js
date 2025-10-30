Vue.component('gradation-row', {
    filters: {
        capitalize: function (value) {
            if (!value) {
                return '';
            }
            value = value.toString();
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
    },
    props: {
        name: {
            type: String
        },
        colorMap: {
            type: Array
        },
        width: {
            type: Number,
            default: 256
        },
        height: {
            type: Number,
            default: 40
        }
    },
    watch: {
        colorMap: {
            handler: function (colorMap) {
                this.$nextTick(function () {
                    const context = this.$refs.canvas.getContext('2d');
                    const width = this.$refs.canvas.width;
                    const height = this.$refs.canvas.height;
                    const step = width / colorMap.length;

                    colorMap.forEach(function (color, i) {
                        context.fillStyle = 'rgb(' + color.join(',') + ')';
                        context.fillRect(i * step, 0, step, height);
                    });
                });
            },
            immediate: true
        }
    },
    template: '<tr><td>{{ name | capitalize }}</td><td style="padding: 0px 0;"><canvas ref="canvas" :width="width" :height="height" style="display: block;"></canvas></td></tr>'
});

const gradation = new Vue({
    el: '#gradation',
    data: {
        colorMaps: colorMaps
    }
});