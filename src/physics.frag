uniform usampler2D isActive;
uniform isampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

layout(location = 0) out uint o_isActive;
layout(location = 1) out ivec4 o_posVel;
layout(location = 2) out uvec4 o_orthoConnections;
layout(location = 3) out uvec4 o_diagConnections;

void main () {
    ivec2 idPos = ivec2(gl_FragCoord.xy - vec2(0.5));
    o_isActive = texelFetch(isActive, idPos, 0).x;
    ivec4 posVel = texelFetch(posVel, idPos, 0);
    posVel.x += 1 << PRECISION;
    o_posVel = posVel;
    o_orthoConnections = texelFetch(orthoConnections, idPos, 0);
    o_diagConnections = texelFetch(diagConnections, idPos, 0);
}
