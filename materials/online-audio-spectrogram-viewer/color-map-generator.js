function ColorMapGenerator(length) {
    this._length = length >= 0 ? Math.floor(length) : 256;
}

ColorMapGenerator.prototype.generate = function (colorStops, exponent) {
    const length = this._length;
    
    if (isNaN(exponent)) {
        exponent = 1;
    }

    const colors = [];

    for (let i = 0; i < length; i++) {
        let rate = i / (length - 1);
        rate = Math.pow(rate, exponent);
        
        let color = [0, 0, 0];

        if (colorStops.length < 2) {
            continue;
        } else if (rate < colorStops[0][3]) {
            color = colorStops[0].slice(0, 3);
        } else if (rate >= colorStops[colorStops.length - 1][3]) {
            color = colorStops[colorStops.length - 1].slice(0, 3);
        } else {
            for (let i = 0; i < colorStops.length - 1; i++) {
                const current = colorStops[i];
                const next = colorStops[i + 1];
                if (rate >= current[3] && rate < next[3]) {
                    const coef = (rate - current[3]) / (next[3] - current[3]);
                    color[0] = current[0] * (1 - coef) + next[0] * coef;
                    color[1] = current[1] * (1 - coef) + next[1] * coef;
                    color[2] = current[2] * (1 - coef) + next[2] * coef;
                    break;
                }
            }
        }

        colors[i] = color.map(function (value) { return Math.round(value); });
    }

    return colors;
};

ColorMapGenerator.prototype.generatePurple = function () {
    const length = this._length;

    const colorStops = [
        [
            { pos: 0, value: 0, type: null },
            { pos: 4 / 30, value: 0, type: 'linear' },
            { pos: 0.7, value: 1, type: 'quadratic' },
            { pos: 1, value: 1, type: 'linear' },
        ],
        [
            { pos: 0, value: 0, type: null },
            { pos: 0.6, value: 0, type: 'linear' },
            { pos: 0.9, value: 1, type: 'quadratic' },
            { pos: 1, value: 1, type: 'linear' },
        ],
        [
            { pos: 0, value: 0, type: null },
            { pos: 0.3, value: 0.5, type: 'quadratic' },
            { pos: 0.6, value: 0, type: 'quadratic' },
            { pos: 7 / 9, value: 0, type: 'linear' },
            { pos: 1, value: 1, type: 'linear' },
        ]
    ];

    const colors = [];
    for (let i = 0; i < length; i++) {
        const color = [];
        const pos = i / (length - 1);
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < colorStops[j].length - 1; k++) {
                if (pos < colorStops[j][0].pos) {
                    color[j] = colorStops[j][0].value;
                } else if (pos >= colorStops[j][colorStops[j].length - 1].value) {
                    color[j] = colorStops[j][colorStops[j].length - 1].value;
                } else {
                    const current = colorStops[j][k];
                    const next = colorStops[j][k + 1];

                    if (pos >= current.pos && pos < next.pos) {
                        if (next.type === 'linear') {
                            const coef = (pos - current.pos) / (next.pos - current.pos);
                            color[j] = current.value * (1 - coef) + next.value * coef;
                            break;
                        } else if (next.type === 'quadratic') {
                            let coef;
                            if (current.value > next.value) {
                                coef = Math.pow((pos - current.pos) / (next.pos - current.pos), 2);
                            } else {
                                coef = 1 - Math.pow(1 - (pos - current.pos) / (next.pos - current.pos), 2);
                            }
                            color[j] = current.value * (1 - coef) + next.value * coef;
                            break;
                        }
                    }
                }
            }
            color[j] = Math.round(color[j] * 255);
        }
        colors[i] = color;
    }

    return colors;
};


ColorMapGenerator.prototype.generateHue = function () {
    const length = this._length;

    const colorStops = [
        [35, 66, 89, 111],
        [12, 38, 64, 91],
        [-11, 11, 34, 65]
    ];

    const colors = [];
    for (let i = 0; i < length; i++) {
        const color = [];
        const pos = i / (length - 1) * 100;
        for (let j = 0; j < 3; j++) {
            const colorStop = colorStops[j];
            if (pos < colorStop[0]) {
                color[j] = 0;
            } else if (pos < colorStop[1]) {
                color[j] = (pos - colorStop[0]) / (colorStop[1] - colorStop[0]);
            } else if (pos < colorStop[2]) {
                color[j] = 1;
            } else if (pos < colorStop[3]) {
                color[j] = 1 - (pos - colorStop[2]) / (colorStop[3] - colorStop[2]);
            } else {
                color[j] = 0;
            }

            color[j] = Math.round(color[j] * 255);
        }
        colors[i] = color;
    }

    return colors;
};
