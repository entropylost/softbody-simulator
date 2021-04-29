precision mediump float;

varying vec2 v_position;
void main() {
    gl_FragColor = vec4(v_position, 0.0, 0.0);
}
