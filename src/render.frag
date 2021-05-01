flat in uint toKeep;

out vec4 o_color;

void main() {
    if (toKeep == 0u) {
        discard;
    }
    o_color = vec4(1.0, 1.0, 1.0, 1.0);
}
