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
    const sizes = {
        active: 1,
        posVel: 4,
        orthoConnections: 4,
        diagConnections: 4,
    };
    const specification = Object.entries({
        active: {
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
        const size = sizes[x[0]];
        const height = Math.ceil(oldSource.length / (DATA_TEXTURE_WIDTH * size));
        const buffer = new ArrayBuffer(DATA_TEXTURE_WIDTH * height * size * oldSource.BYTES_PER_ELEMENT);
        const src = new oldSource.constructor(buffer);
        src.set(oldSource);
        a[x[0]] = {
            width: DATA_TEXTURE_WIDTH,
            height,
            src,
            ...x[1],
        };
        return a;
    }, {});

    const textures = twgl.createTextures(gl, specification);
    const framebuffer = twgl.createFramebufferInfo(
        gl,
        [
            { attachment: textures.active },
            { attachment: textures.posVel },
            { attachment: textures.orthoConnections },
            { attachment: textures.diagConnections },
        ],
        DATA_TEXTURE_WIDTH,
        textures.active.length / DATA_TEXTURE_WIDTH
    );
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
        active: new Uint8Array(len),
        posVel: new Int32Array(len * 4),
        orthoConnections: new Uint32Array(len * 4),
        diagConnections: new Uint32Array(len * 4),
    };

    console.log(sources);

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
