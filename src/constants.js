'use strict';

const DATA_TEXTURE_WIDTH = 4096;
const FRAME_TIME = 1000 / 60;
const BREAKING_DISTANCE = 1.1;

function generateConstantsAndUtils(code, canvas) {
    return `#version 300 es

precision highp float;
precision highp isampler2D;
precision highp usampler2D;

const int DATA_TEXTURE_WIDTH = ${DATA_TEXTURE_WIDTH};
const int DATA_TEXTURE_WIDTH_POWER = ${Math.log2(DATA_TEXTURE_WIDTH)};
const uint DATA_TEXTURE_WIDTH_U = ${DATA_TEXTURE_WIDTH}u;
const uint DATA_TEXTURE_WIDTH_POWER_U = ${Math.log2(DATA_TEXTURE_WIDTH)}u;
const vec2 HALF_WORLD_SIZE = vec2(${canvas.width / 2}.0, ${canvas.height / 2}.0);
const float FRAME_TIME = ${FRAME_TIME};
const float GRAVITY = ${0.0}.0;
const float COLLIDE_FRICTION = ${0.0}.0;
const float ORTHO_BREAKING_DISTANCE = ${BREAKING_DISTANCE};
const float DIAG_BRAKING_DISTANCE = ${BREAKING_DISTANCE * Math.SQRT2};
const float SPRING_CONSTANT = ${0.0004};
const float DAMPING_CONSTANT = ${0.005};

${require('./utils.glsl')}
${code}`;
}

module.exports = {
    DATA_TEXTURE_WIDTH,
    FRAME_TIME,
    generateConstantsAndUtils,
};
