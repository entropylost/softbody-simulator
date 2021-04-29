'use strict';

const twgl = require('twgl.js');
const DATA_TEXTURE_WIDTH = 1024;

function generateConstants(code, canvas) {
    return `
const int DATA_TEXTURE_WIDTH = ${DATA_TEXTURE_WIDTH};
const ivec2 WORLD_SIZE = ivec2(${canvas.width}, ${canvas.height});
const int PRECISION = 10;
${code}`;
}

function particleTexturesAndFrameBuffer(gl, sources) {
    const specification = Object.entries({
        deleted: {
            internalFormat: gl.R8UI,
            format: gl.RED_INTEGER,
        },
        posVel: {
            internalFormat: gl.RGBA32I,
            format: gl.RGBA_INTEGER,
        },
        orthoConnections: {
            internalFormat: gl.RGBA32UI,
            format: gl.RGBA_INTEGER,
        },
        diagConnections: {
            internalFormat: gl.RGBA32UI,
            format: gl.RGBA_INTEGER,
        },
    }).reduce((a, x) => {
        const oldSource = sources[x[0]];
        const buffer = new ArrayBuffer(
            DATA_TEXTURE_WIDTH * Math.ceil(oldSource.length / DATA_TEXTURE_WIDTH) * oldSource.BYTES_PER_ELEMENT
        );
        const src = new oldSource.constructor(buffer);
        src.set(oldSource);
        a[x[0]] = {
            width: DATA_TEXTURE_WIDTH,
            src,
            ...x[1],
        };
        return a;
    }, {});

    console.log(specification);

    const textures = twgl.createTextures(gl, specification);
    const framebuffer = twgl.createFramebufferInfo(gl, [
        { attachment: textures.deleted },
        { attachment: textures.posVel },
        { attachment: textures.orthoConnections },
        { attachment: textures.diagConnections },
    ]);
    return {
        textures,
        framebuffer,
    };
}

module.exports = (canvas) => {
    const gl = twgl.getContext(canvas, {
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: true,
        antialias: false,
    });
    if (gl === null) {
        throw new Error('Unable to get high-performance webgl2 context');
    }

    const len = 1500;

    const sources = {
        deleted: new Uint8Array(len),
        posVel: new Int32Array(len),
        orthoConnections: new Uint32Array(len),
        diagConnections: new Uint32Array(len),
    };

    const programPhysics = twgl.createProgramInfo(gl, [
        generateConstants(require('./physics.vert'), canvas),
        generateConstants(require('./physics.frag'), canvas),
    ]);
    const programDraw = twgl.createProgramInfo(gl, [
        generateConstants(require('./draw.vert'), canvas),
        generateConstants(require('./draw.frag'), canvas),
    ]);

    const txfb1 = particleTexturesAndFrameBuffer(gl, sources);
    const txfb2 = particleTexturesAndFrameBuffer(gl, sources);
    console.log(txfb1);
};
