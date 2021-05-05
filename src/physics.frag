uniform usampler2D type;
uniform sampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

layout(location = 0) out uint o_type;
layout(location = 1) out vec4 o_posVel;
layout(location = 2) out uvec4 o_orthoConnections;
layout(location = 3) out uvec4 o_diagConnections;


uint connectionForce(inout vec2 force, const float connectionLength, vec4 thisPosVel, uint connection) {
    ivec2 connectionPos = idFromUint(connection);
    if (texelFetch(type, connectionPos, 0).x == 0u) {
        return connection;
    }
    vec4 otherPosVel = texelFetch(posVel, connectionPos, 0);
    vec4 delta = otherPosVel - thisPosVel;
    float length = length(delta.xy);
    vec2 direction = delta.xy / length;
    float lengthRatioSq = length / connectionLength;
    lengthRatioSq *= lengthRatioSq;
    float forceMag = (lengthRatioSq - 1.0 / lengthRatioSq) * SPRING_CONSTANT + dot(delta.zw, direction) * DAMPING_CONSTANT;
    force += forceMag * direction;
    return length >= BREAKING_DISTANCE * connectionLength ? 0u : connection;
}

void main() {
    ivec2 idPos = ivec2(gl_FragCoord.xy - vec2(0.5));

    uint type = texelFetch(type, idPos, 0).x;
    vec4 posVel = texelFetch(posVel, idPos, 0);
    uvec4 orthoConnections = texelFetch(orthoConnections, idPos, 0);
    uvec4 diagConnections = texelFetch(diagConnections, idPos, 0);

    vec2 force = vec2(0, -GRAVITY);
    force -= posVel.zw * AIR_FRICTION;
    orthoConnections.x &= connectionForce(force, 1.0, posVel, orthoConnections.x);
    orthoConnections.y &= connectionForce(force, 1.0, posVel, orthoConnections.y);
    orthoConnections.z &= connectionForce(force, 1.0, posVel, orthoConnections.z);
    orthoConnections.w &= connectionForce(force, 1.0, posVel, orthoConnections.w);
    diagConnections.x &= connectionForce(force, 1.41421356, posVel, diagConnections.x);
    diagConnections.y &= connectionForce(force, 1.41421356, posVel, diagConnections.y);
    diagConnections.z &= connectionForce(force, 1.41421356, posVel, diagConnections.z);
    diagConnections.w &= connectionForce(force, 1.41421356, posVel, diagConnections.w);

    if (type != 2u) { // Not Fixed
        posVel.zw += force * FRAME_TIME;
        posVel.xy += posVel.zw * FRAME_TIME;
    }
    if (abs(posVel.x) > HALF_WORLD_SIZE.x) {
        posVel.z = -posVel.z * COLLIDE_FRICTION;
    }
    if (abs(posVel.y) > HALF_WORLD_SIZE.y) {
        posVel.w = -posVel.w * COLLIDE_FRICTION;
    }

    o_type = type;
    o_posVel = posVel;
    o_orthoConnections = orthoConnections;
    o_diagConnections = diagConnections;
}
