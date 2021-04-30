precision highp float;

uniform sampler2D isActive;
uniform sampler2D posVel;
uniform sampler2D orthoConnections;
uniform sampler2D diagConnections;

in float unused;

void main () {
    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    gl_PointSize = 3.0;
}
