uniform usampler2D isActive;
uniform isampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

layout(location = 0) out uint o_isActive;
layout(location = 1) out ivec4 o_posVel;
layout(location = 2) out uvec4 o_orthoConnections;
layout(location = 3) out uvec4 o_diagConnections;

ivec2 lookupPosition(ivec2 connectionPos) {
    return texelFetch(posVel, connectionPos, 0).xy;
}
uint lookupIsActive(ivec2 connectionPos) {
    return texelFetch(isActive, connectionPos, 0).x;
}

ivec2 orthoForce(inout uint isActive, ivec2 pos, uint connection) {
    ivec2 connectionPos = idFromUint(connection);
    if (lookupIsActive(connectionPos) == 0u) {
        return ivec2(0);
    }
    ivec2 otherPos = lookupPosition(connectionPos);
    ivec2 delta = otherPos - pos;
    int length = int(sqrt(float(delta.x * delta.x + delta.y * delta.y))); // Hack. Find better way to do this.
    ivec2 direction = (delta << PRECISION) / length;
    int force = length - ONE_IF;
    force = (((((force * force) >> PRECISION) * force) >> PRECISION) * SPRING_FACTOR_IF) >> PRECISION;
    return (force * direction) >> PRECISION;
}

void main() {
    ivec2 idPos = ivec2(gl_FragCoord.xy - vec2(0.5));

    uint isActive = texelFetch(isActive, idPos, 0).x;
    ivec4 posVel = texelFetch(posVel, idPos, 0);
    uvec4 orthoConnections = texelFetch(orthoConnections, idPos, 0);
    uvec4 diagConnections = texelFetch(diagConnections, idPos, 0);

    ivec2 force = ivec2(0, -GRAVITY_IF);
    force += orthoForce(isActive, posVel.xy, orthoConnections.x);
    force += orthoForce(isActive, posVel.xy, orthoConnections.y);
    force += orthoForce(isActive, posVel.xy, orthoConnections.z);
    force += orthoForce(isActive, posVel.xy, orthoConnections.w);

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
