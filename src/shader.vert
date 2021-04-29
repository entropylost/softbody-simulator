#version 300 es

precision highp float;

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
uniform uvec2 u_resolution;

in vec2 a_position;
// in uvec2 a_velocity;

// all shaders have a main function
void main() {
    // convert the position from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / vec2(u_resolution);

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace, 0, 1);
    gl_PointSize = 5.0;
}
