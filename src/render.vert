uniform usampler2D isActive;
uniform isampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

in float unused;
flat out uint toKeep;

void main() {
    ivec2 idPos = idFromInt(gl_VertexID);
    ivec2 pos = texelFetch(posVel, idPos, 0).xy;
    toKeep = texelFetch(isActive, idPos, 0).x;
    gl_Position = vec4(vec2(pos >> PRECISION) / HALF_WORLD_SIZE, 0.0, 1.0);
    gl_PointSize = 1.0;
}
