uniform usampler2D isActive;
uniform isampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

layout (location = 0) out int o_isActive;
layout (location = 1) out ivec4 o_posVel;
layout (location = 2) out uvec4 o_orthoConnections;
layout (location = 3) out uvec4 o_diagConnections;

void main () {
    // o_isActive =
}
