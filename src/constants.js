'use strict';

const DATA_TEXTURE_WIDTH = 4096;

function generateConstantsAndUtils(code, canvas) {
    return `#version 300 es
const int DATA_TEXTURE_WIDTH = ${DATA_TEXTURE_WIDTH};
const int DATA_TEXTURE_WIDTH_POWER = ${Math.log2(DATA_TEXTURE_WIDTH)};
const ivec2 WORLD_SIZE = ivec2(${canvas.width}, ${canvas.height});
const int PRECISION = 10;

precision highp float;
precision highp isampler2D;
precision highp usampler2D;

${require('./utils.glsl')}
${code}`;
}

module.exports = {
    DATA_TEXTURE_WIDTH,
    generateConstantsAndUtils,
};
