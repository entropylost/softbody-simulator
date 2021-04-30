uniform usampler2D isActive;
uniform isampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

in float unused;

void main () {
    ivec2 idVec = idFromInt(gl_VertexID);
    gl_Position = vec4(vec2(texelFetch(posVel, idVec, 0).xy), 0.0, 1.0);
    gl_PointSize = 3.0;
}
