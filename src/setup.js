'use strict';

const twgl = require('twgl.js');
const { generateConstantsAndUtils } = require('./constants');
const { particleTexturesAndFrameBuffer } = require('./textures');
const initData = require('./init-data');

module.exports = (canvas) => {
    const gl = twgl.getContext(canvas, {
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: true,
        antialias: false,
    });
    if (gl === null) {
        throw new Error('Unable to get high-performance webgl2 context');
    }

    const sources = initData(require('./start.png'));

    console.log(sources);

    const physicsProgram = twgl.createProgramInfo(gl, [
        generateConstantsAndUtils(require('./physics.vert'), canvas),
        generateConstantsAndUtils(require('./physics.frag'), canvas),
    ]);
    const renderProgram = twgl.createProgramInfo(gl, [
        generateConstantsAndUtils(require('./render.vert'), canvas),
        generateConstantsAndUtils(require('./render.frag'), canvas),
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
