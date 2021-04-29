'use strict';

function createShader(gl, path, source) {
    let type;
    if (path.endsWith('.vert')) {
        type = gl.VERTEX_SHADER;
    } else if (path.endsWith('.frag')) {
        type = gl.FRAGMENT_SHADER;
    } else {
        throw new Error(`Invalid type of shader: ${path} does not end with .vert or with .frag`);
    }
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Unable to create shader: ${log}`);
}

function createProgram(gl, vert, frag) {
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Unable to create program: ${log}`);
}

module.exports = (canvas) => {
    const gl = canvas.getContext('webgl2', {
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: true,
        antialias: false,
    });
    if (gl === null) {
        throw new Error('Unable to get high-performance webgl2 context');
    }

    const vert = createShader(gl, './shader.vert', require('./shader.vert'));
    const frag = createShader(gl, './shader.frag', require('./shader.frag'));

    const program = createProgram(gl, vert, frag);
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [10, 20, 80, 20, 10, 30, 10, 30, 80, 20, 80, 30];
    gl.bufferData(gl.ARRAY_BUFFER, new Uint32Array(positions), gl.STATIC_DRAW);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.enableVertexAttribArray(positionAttributeLocation);

    {
        const size = 2; // 2 components per iteration
        const type = gl.UNSIGNED_INT; // the data is 32bit floats
        const normalize = false; // don't normalize the data
        const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
        const offset = 0; // start at the beginning of the buffer
        gl.vertexAttribIPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    }

    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniform2ui(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    gl.bindVertexArray(vao);

    {
        const primitiveType = gl.POINTS;
        const offset = 0;
        const count = 6;
        gl.drawArrays(primitiveType, offset, count);
    }
};
