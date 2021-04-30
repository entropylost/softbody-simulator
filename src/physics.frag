precision highp float;

uniform sampler2D isActive;
uniform sampler2D posVel;
uniform sampler2D orthoConnections;
uniform sampler2D diagConnections;

layout (location = 0) out int o_isActive;
layout (location = 1) out ivec4 o_posVel;
layout (location = 2) out uvec4 o_orthoConnections;
layout (location = 3) out uvec4 o_diagConnections;

void main () {
    // o_isActive =
}
