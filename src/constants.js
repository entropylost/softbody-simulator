'use strict';

const DATA_TEXTURE_WIDTH = 4096;
const PRECISION = 10;
const ONE_IF = 1 << PRECISION;
const FRAME_TIME = 1000 / 60;
const BREAKING_DISTANCE = 1.1;

function toIF(x) {
    return Math.floor(x * ONE_IF);
}

function generateConstantsAndUtils(code, canvas) {
    return `#version 300 es

precision highp float;
precision highp isampler2D;
precision highp usampler2D;

const int DATA_TEXTURE_WIDTH = ${DATA_TEXTURE_WIDTH};
const int DATA_TEXTURE_WIDTH_POWER = ${Math.log2(DATA_TEXTURE_WIDTH)};
const uint DATA_TEXTURE_WIDTH_U = ${DATA_TEXTURE_WIDTH}u;
const uint DATA_TEXTURE_WIDTH_POWER_U = ${Math.log2(DATA_TEXTURE_WIDTH)}u;
const ivec2 HALF_WORLD_SIZE_IF = ivec2(${toIF(canvas.width / 2)}, ${toIF(canvas.height / 2)});
const vec2 HALF_WORLD_SIZE = vec2(${canvas.width / 2}.0, ${canvas.height / 2}.0);
const int PRECISION = ${PRECISION};
const int ONE_IF = ${1 << PRECISION};
const int SQRT2_IF = ${toIF(Math.SQRT2)};
const int FRAME_TIME_IF = ${toIF(FRAME_TIME)};
const int GRAVITY_IF = ${toIF(80)};
const int FRICTION_IF = ${toIF(0.8)};
const int ORTHO_BREAKING_DISTANCE_IF = ${toIF(BREAKING_DISTANCE)};
const int DIAG_BRAKING_DISTANCE_IF = ${toIF(BREAKING_DISTANCE * Math.SQRT2)};
const int SPRING_FACTOR_IF = ${toIF(-0.015)};

${require('./utils.glsl')}
${code}`;
}

module.exports = {
    DATA_TEXTURE_WIDTH,
    PRECISION,
    FRAME_TIME,
    generateConstantsAndUtils,
};
