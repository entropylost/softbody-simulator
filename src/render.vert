uniform usampler2D type;
uniform sampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

in float unused;
flat out uint toKeep;

void main() {
    ivec2 idPos = idFromInt(gl_VertexID);
    vec2 pos = texelFetch(posVel, idPos, 0).xy;
    toKeep = texelFetch(type, idPos, 0).x;
    gl_Position = vec4(pos / HALF_WORLD_SIZE, 0.0, 1.0);
    gl_PointSize = 1.0;
}
