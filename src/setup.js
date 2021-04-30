'use strict';

const twgl = require('twgl.js');
const DATA_TEXTURE_WIDTH = 1024;

function generateConstants(code, canvas) {
    return `#version 300 es
const int DATA_TEXTURE_WIDTH = ${DATA_TEXTURE_WIDTH};
const ivec2 WORLD_SIZE = ivec2(${canvas.width}, ${canvas.height});
const int PRECISION = 10;
${code}`;
}

function particleTexturesAndFrameBuffer(gl, sources) {
    const sizes = {
        isActive: 1,
        posVel: 4,
        orthoConnections: 4,
        diagConnections: 4,
    };
    const specification = Object.entries({
        isActive: {
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
    }).reduce((a, [k, v]) => {
        const oldSource = sources[k];
        const size = sizes[k];
        const height = Math.ceil(oldSource.length / (DATA_TEXTURE_WIDTH * size));
        const buffer = new ArrayBuffer(DATA_TEXTURE_WIDTH * height * size * oldSource.BYTES_PER_ELEMENT);
        const src = new oldSource.constructor(buffer);
        src.set(oldSource);
        a[k] = {
            min: gl.NEAREST,
            max: gl.NEAREST,
            width: DATA_TEXTURE_WIDTH,
            height,
            src,
            ...v,
        };
        return a;
    }, {});

    const height = specification.isActive.height;

    Object.values(specification).forEach((a) => {
        if (a.height !== height) {
            throw new Error('Heights are not consistent');
        }
    });

    const textures = twgl.createTextures(gl, specification);
    const framebuffer = twgl.createFramebufferInfo(
        gl,
        [
            { attachment: textures.isActive },
            { attachment: textures.posVel },
            { attachment: textures.orthoConnections },
            { attachment: textures.diagConnections },
        ],
        DATA_TEXTURE_WIDTH,
        height
    );
    return {
        textures,
        framebuffer,
        size: [DATA_TEXTURE_WIDTH, height],
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
        isActive: new Uint8Array(len),
        posVel: new Int32Array(len * 4),
        orthoConnections: new Uint32Array(len * 4),
        diagConnections: new Uint32Array(len * 4),
    };

    console.log(sources);

    const physicsProgram = twgl.createProgramInfo(gl, [
        generateConstants(require('./physics.vert'), canvas),
        generateConstants(require('./physics.frag'), canvas),
    ]);
    const renderProgram = twgl.createProgramInfo(gl, [
        generateConstants(require('./render.vert'), canvas),
        generateConstants(require('./render.frag'), canvas),
    ]);

    let txfbRead = particleTexturesAndFrameBuffer(gl, sources);
    let txfbWrite = particleTexturesAndFrameBuffer(gl, sources);

    const dataTextureSize = txfbRead.size;

    console.log(txfbRead);

    const physicsBufferInfo = twgl.createBufferInfoFromArrays(gl, {
        position: { numComponents: 2, data: [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1] },
    });

    const renderBufferInfo = twgl.createBufferInfoFromArrays(gl, {
        unused: { numComponents: 1, data: new Array(dataTextureSize[0] * dataTextureSize[1]).fill(0) },
    });

    return function update() {
        // Resolve Collisions First

        // Perform Softbody update and Physics
        /*
        twgl.bindFramebufferInfo(gl, txfbWrite.framebuffer);

        gl.useProgram(physicsProgram.program);

        twgl.setUniformsAndBindTextures(physicsProgram, txfbRead.textures);
        twgl.setBuffersAndAttributes(gl, physicsProgram, physicsBufferInfo);
        twgl.drawBufferInfo(gl, physicsBufferInfo);

        {
            const temp = txfbWrite;
            txfbWrite = txfbRead;
            txfbRead = temp;
        }
        */
        // Perform Rendering

        twgl.bindFramebufferInfo(gl);

        gl.useProgram(renderProgram.program);

        twgl.setUniformsAndBindTextures(renderProgram, txfbRead.textures);
        twgl.setBuffersAndAttributes(gl, renderProgram, renderBufferInfo);
        twgl.drawBufferInfo(gl, renderBufferInfo, gl.POINTS);
    };
};
