'use strict';

const twgl = require('twgl.js');

module.exports = (canvas) => {
    const gl = canvas.getContext('webgl2', {
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: true,
        antialias: false,
    });
    if (gl === null) {
        throw new Error('Unable to get high-performance webgl2 context');
    }

    const programInfo = twgl.createProgramInfo(gl, [require('./shader.vert'), require('./shader.frag')]);

    console.log(programInfo);

    const arrays = {
        a_position: {
            numComponents: 2,
            data: [10, 20, 80, 20, 10, 30, 80, 30],
        },
    };

    const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    function render(time) {
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, canvas.width, canvas.height);

        const uniforms = {
            u_time: time * 0.001,
            u_resolution: [canvas.width, canvas.height],
        };

        gl.useProgram(programInfo.program);
        twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
        twgl.setUniforms(programInfo, uniforms);
        twgl.drawBufferInfo(gl, bufferInfo, gl.POINTS);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};
