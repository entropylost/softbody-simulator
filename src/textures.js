'use strict';

const twgl = require('twgl.js');
const { DATA_TEXTURE_WIDTH } = require('./constants');

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
            internalFormat: gl.RGBA32F,
            format: gl.RGBA,
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

module.exports = {
    particleTexturesAndFrameBuffer,
};
