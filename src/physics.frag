uniform usampler2D isActive;
uniform isampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

layout(location = 0) out uint o_isActive;
layout(location = 1) out ivec4 o_posVel;
layout(location = 2) out uvec4 o_orthoConnections;
layout(location = 3) out uvec4 o_diagConnections;

ivec2 orthoForce(inout uint thisIsActive, ivec4 thisPosVel, uint connection) {
    ivec2 connectionPos = idFromUint(connection);
    if (texelFetch(isActive, connectionPos, 0).x == 0u) {
        return ivec2(0);
    }
    ivec4 otherPosVel = texelFetch(posVel, connectionPos, 0);
    ivec4 delta = otherPosVel - thisPosVel;
    int length = int(sqrt(float(delta.x * delta.x + delta.y * delta.y))); // Hack. Find better way to do this.
    ivec2 direction = (delta.xy << PRECISION) / length;
    int force = length - ONE_IF * 2;
    force = (((((force * force) >> PRECISION) * force) >> PRECISION) * SPRING_FACTOR_IF) >> PRECISION;
    // Figure out what to do with delta.zw
    return (force * direction) >> PRECISION;
}

void main() {
    ivec2 idPos = ivec2(gl_FragCoord.xy - vec2(0.5));

    uint isActive = texelFetch(isActive, idPos, 0).x;
    ivec4 posVel = texelFetch(posVel, idPos, 0);
    uvec4 orthoConnections = texelFetch(orthoConnections, idPos, 0);
    uvec4 diagConnections = texelFetch(diagConnections, idPos, 0);

    ivec2 force = ivec2(0, -GRAVITY_IF);
    force += orthoForce(isActive, posVel, orthoConnections.x);
    force += orthoForce(isActive, posVel, orthoConnections.y);
    force += orthoForce(isActive, posVel, orthoConnections.z);
    force += orthoForce(isActive, posVel, orthoConnections.w);

    posVel.zw += (force << PRECISION) / FRAME_TIME_IF;
    posVel.xy += (posVel.zw << PRECISION) / FRAME_TIME_IF;
    if (abs(posVel.x) > HALF_WORLD_SIZE_IF.x) {
        posVel.z = -posVel.z;
    }
    if (abs(posVel.y) > HALF_WORLD_SIZE_IF.y) {
        posVel.w = -posVel.w;
    }

    o_isActive = isActive;
    o_posVel = posVel;
    o_orthoConnections = orthoConnections;
    o_diagConnections = diagConnections;
}
