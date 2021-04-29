precision mediump float;

varying vec2 v_texcoord;
uniform sampler2D u_texture;
uniform vec2 gravity_center;
uniform float off_gravity;
uniform float restore_colors;
uniform float dt;

vec2 n2rand() {
    return vec2(fract(sin(dot(v_texcoord.xy, vec2(12.9898, 78.233))) * 43758.5453),
        fract(sin(dot(v_texcoord.xy * 1.61803, vec2(12.9898, 78.233))) * 43758.5453));
}
void main() {
    vec4 particle = texture2D(u_texture, v_texcoord);
    vec2 r, d, a, x, v;
    x = particle.xy;
    v = particle.zw;
    r = x - gravity_center;
    d = x - v_texcoord;
    // physics emulation
    a = (1.0 - off_gravity) * ( -normalize(r) * dt * clamp(3. / dot(r, r), 0., 2.) + 0.03 * (n2rand() - 0.5) );
    x += (1.0 - restore_colors) * (v - 0.5) * dt;
    x += restore_colors * -d;
    v += a;
    // mirror edge
    v -= 2.0 * (v - 0.5) * step(0.0, abs(x - 0.5) - 0.5);
    x = abs(abs(abs(x) - 1.0) - 1.0);
    gl_FragColor = vec4(x, v);
}
