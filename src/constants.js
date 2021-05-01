'use strict';

const DATA_TEXTURE_WIDTH = 4096;
const PRECISION = 10;
const FRAME_TIME = 1000 / 60;

function generateConstantsAndUtils(code, canvas) {
    return `#version 300 es

precision highp float;
precision highp isampler2D;
precision highp usampler2D;

const int DATA_TEXTURE_WIDTH = ${DATA_TEXTURE_WIDTH};
const int DATA_TEXTURE_WIDTH_POWER = ${Math.log2(DATA_TEXTURE_WIDTH)};
const ivec2 HALF_WORLD_SIZE_I = ivec2(${(canvas.width / 2) << PRECISION}, ${(canvas.height / 2) << PRECISION});
const vec2 HALF_WORLD_SIZE = vec2(${canvas.width / 2}.0, ${canvas.height / 2}.0);
const int PRECISION = ${PRECISION};
const int FRAME_TIME = ${Math.floor(FRAME_TIME * (1 << PRECISION))};
const int GRAVITY = ${80 << PRECISION};
const int FRICTION = ${Math.floor(0.8 * (1 << PRECISION))};

${require('./utils.glsl')}
${code}`;
}

module.exports = {
    DATA_TEXTURE_WIDTH,
    PRECISION,
    FRAME_TIME,
    generateConstantsAndUtils,
};
