uniform usampler2D isActive;
uniform isampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

in vec2 position;

void main () {
    gl_Position = vec4(position, 0.0, 1.0);
}
