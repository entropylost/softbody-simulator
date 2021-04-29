precision mediump float;

attribute vec2 v_texcoord;
uniform sampler2D u_texture;
varying vec3 color;
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
void main () {
    vec4 particle = texture2D(u_texture, v_texcoord);
    color = hsv2rgb(vec3(0.5 * v_texcoord + 0.4, 0.9));
    gl_Position = vec4(particle.xy * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = 1.0;
}
