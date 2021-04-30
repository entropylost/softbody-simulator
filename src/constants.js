'use strict';

const DATA_TEXTURE_WIDTH = 4096;
const PRECISION = 10;

function generateConstantsAndUtils(code, canvas) {
    return `#version 300 es

precision highp float;
precision highp isampler2D;
precision highp usampler2D;

const int DATA_TEXTURE_WIDTH = ${DATA_TEXTURE_WIDTH};
const int DATA_TEXTURE_WIDTH_POWER = ${Math.log2(DATA_TEXTURE_WIDTH)};
const ivec2 WORLD_SIZE_I = ivec2(${canvas.width}, ${canvas.height});
const vec2 HALF_WORLD_SIZE = vec2(${canvas.width / 2}.0, ${canvas.height / 2}.0);
const int PRECISION = ${PRECISION};

${require('./utils.glsl')}
${code}`;
}

module.exports = {
    DATA_TEXTURE_WIDTH,
    PRECISION,
    generateConstantsAndUtils,
};
