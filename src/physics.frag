uniform usampler2D isActive;
uniform sampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

layout(location = 0) out uint o_isActive;
layout(location = 1) out vec4 o_posVel;
layout(location = 2) out uvec4 o_orthoConnections;
layout(location = 3) out uvec4 o_diagConnections;


uint connectionForce(inout vec2 force, inout vec2 otherVelocitySum, inout float otherVelocityCount, float connectionLength, vec4 thisPosVel, uint connection) {
    ivec2 connectionPos = idFromUint(connection);
    if (texelFetch(isActive, connectionPos, 0).x == 0u) {
        return 1u;
    }
    vec4 otherPosVel = texelFetch(posVel, connectionPos, 0);
    vec4 delta = otherPosVel - thisPosVel;
    {
        float length = length(delta.xy);
        vec2 direction = delta.xy / length;
        float forceMag = length - connectionLength;
        forceMag = forceMag * SPRING_FACTOR;
        force += forceMag * direction;
    }
    otherVelocitySum += otherPosVel.zw;
    otherVelocityCount++;
    return 1u;
}

void main() {
    ivec2 idPos = ivec2(gl_FragCoord.xy - vec2(0.5));

    uint isActive = texelFetch(isActive, idPos, 0).x;
    vec4 posVel = texelFetch(posVel, idPos, 0);
    uvec4 orthoConnections = texelFetch(orthoConnections, idPos, 0);
    uvec4 diagConnections = texelFetch(diagConnections, idPos, 0);

    vec2 force = vec2(0, -GRAVITY);
    vec2 otherVelocitySum = vec2(0);
    float otherVelocityCount = 0.0;
    isActive &= connectionForce(force, otherVelocitySum, otherVelocityCount, 2.0, posVel, orthoConnections.x);
    isActive &= connectionForce(force, otherVelocitySum, otherVelocityCount, 2.0, posVel, orthoConnections.y);
    isActive &= connectionForce(force, otherVelocitySum, otherVelocityCount, 2.0, posVel, orthoConnections.z);
    isActive &= connectionForce(force, otherVelocitySum, otherVelocityCount, 2.0, posVel, orthoConnections.w);
    isActive &= connectionForce(force, otherVelocitySum, otherVelocityCount, 2.82842712, posVel, orthoConnections.x);
    isActive &= connectionForce(force, otherVelocitySum, otherVelocityCount, 2.82842712, posVel, orthoConnections.y);
    isActive &= connectionForce(force, otherVelocitySum, otherVelocityCount, 2.82842712, posVel, orthoConnections.z);
    isActive &= connectionForce(force, otherVelocitySum, otherVelocityCount, 2.82842712, posVel, orthoConnections.w);


    vec2 otherVelocityAverage = otherVelocitySum / otherVelocityCount;

    posVel.zw = posVel.zw * (1.0 - SPRING_FRICTION * otherVelocityCount) + otherVelocityAverage * SPRING_FRICTION * otherVelocityCount;

    posVel.zw += force * FRAME_TIME;
    posVel.xy += posVel.zw * FRAME_TIME;
    if (abs(posVel.x) > HALF_WORLD_SIZE.x) {
        posVel.z = -posVel.z * COLLIDE_FRICTION;
    }
    if (abs(posVel.y) > HALF_WORLD_SIZE.y) {
        posVel.w = -posVel.w * COLLIDE_FRICTION;
    }

    o_isActive = isActive;
    o_posVel = posVel;
    o_orthoConnections = orthoConnections;
    o_diagConnections = diagConnections;
}
