'use strict';

const twgl = require('twgl.js');

module.exports = (canvas) => {
    const gl = twgl.getContext(canvas, {
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: true,
        antialias: false,
    });
    if (gl === null) {
        throw new Error('Unable to get high-performance webgl2 context');
    }

    const mousepos = [0.5, 0.5];

    const programInit = twgl.createProgramInfo(gl, [require('./init.vert'), require('./init.frag')]);
    const programPhysics = twgl.createProgramInfo(gl, [require('./physics.vert'), require('./physics.frag')]);
    const programDraw = twgl.createProgramInfo(gl, [require('./draw.vert'), require('./draw.frag')]);

    const n = 256;
    const m = 256;
    let fb1 = twgl.createFramebufferInfo(gl, undefined, n, m);
    let fb2 = twgl.createFramebufferInfo(gl, undefined, n, m);
    const positionObject = { position: { data: [1, 1, 1, -1, -1, -1, -1, 1], numComponents: 2 } };
    const positionBuffer = twgl.createBufferInfoFromArrays(gl, positionObject);

    const pointData = [];
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            pointData.push(i / (n - 1));
            pointData.push(j / (m - 1));
        }
    }
    const pointsObject = { v_texcoord: { data: pointData, numComponents: 2 } };
    const pointsBuffer = twgl.createBufferInfoFromArrays(gl, pointsObject);

    // particle initialization
    gl.useProgram(programInit.program);
    twgl.setBuffersAndAttributes(gl, programInit, positionBuffer);
    twgl.bindFramebufferInfo(gl, fb1);
    twgl.drawBufferInfo(gl, positionBuffer, gl.TRIANGLE_FAN);

    let dt;
    let prevTime;
    let temp;
    let offGravity = 0;
    let restoreColors = 0;

    function draw(time) {
        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        dt = prevTime ? time - prevTime : 0;
        prevTime = time;

        // particle physics
        gl.useProgram(programPhysics.program);
        twgl.setBuffersAndAttributes(gl, programPhysics, positionBuffer);
        twgl.setUniforms(programPhysics, {
            u_texture: fb1.attachments[0],
            gravity_center: mousepos,
            off_gravity: offGravity,
            restore_colors: restoreColors,
            dt: 2.5 * dt,
        });
        twgl.bindFramebufferInfo(gl, fb2);
        twgl.drawBufferInfo(gl, positionBuffer, gl.TRIANGLE_FAN);

        // drawing particles
        gl.useProgram(programDraw.program);
        twgl.setBuffersAndAttributes(gl, programDraw, pointsBuffer);
        twgl.setUniforms(programDraw, { u_texture: fb2.attachments[0] });
        twgl.bindFramebufferInfo(gl, null);
        twgl.drawBufferInfo(gl, pointsBuffer, gl.POINTS);

        // ping-pong buffers
        temp = fb1;
        fb1 = fb2;
        fb2 = temp;
    }

    (function animate(now) {
        draw(now / 1000);
        requestAnimationFrame(animate);
    })(0);

    function setMousePos(e) {
        mousepos[0] = e.clientX / gl.canvas.clientWidth;
        mousepos[1] = 1 - e.clientY / gl.canvas.clientHeight;
    }

    canvas.addEventListener('mousemove', setMousePos);

    canvas.addEventListener('mouseleave', () => {
        mousepos[0] = 0.5;
        mousepos[1] = 0.5;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            offGravity = 1;
        } else {
            restoreColors = 1;
        }
    });

    window.addEventListener('mouseup', () => {
        offGravity = 0;
        restoreColors = 0;
    });

    function handleTouch(e) {
        e.preventDefault();
        setMousePos(e.touches[0]);
    }

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
};
