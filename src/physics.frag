uniform usampler2D isActive;
uniform isampler2D posVel;
uniform usampler2D orthoConnections;
uniform usampler2D diagConnections;

layout(location = 0) out uint o_isActive;
layout(location = 1) out ivec4 o_posVel;
layout(location = 2) out uvec4 o_orthoConnections;
layout(location = 3) out uvec4 o_diagConnections;

// Hack. Find better way to do this.
int len(ivec2 a) {
    return int(sqrt(float(a.x * a.x + a.y * a.y)));
}

uint orthoForce(inout ivec2 force, ivec4 thisPosVel, uint connection) {
    ivec2 connectionPos = idFromUint(connection);
    if (texelFetch(isActive, connectionPos, 0).x == 0u) {
        return 1u;
    }
    ivec4 otherPosVel = texelFetch(posVel, connectionPos, 0);
    ivec4 delta = otherPosVel - thisPosVel;
    {
        int length = len(delta.xy);
        ivec2 direction = (delta.xy << PRECISION) / length;
        int forceMag = length - ONE_IF * 2;
        forceMag = (((((forceMag * forceMag) >> PRECISION) * forceMag) >> PRECISION) * SPRING_FACTOR_IF) >> PRECISION;
        force += (forceMag * direction) >> PRECISION;
    }
    {
        int length = len(delta.zw);
        ivec2 direction = (delta.zw << PRECISION) / length;
        int forceMag = length;
        forceMag = (((((forceMag * forceMag) >> PRECISION) * forceMag) >> PRECISION) * SPRING_FRICTION_IF) >> PRECISION;
        force += (forceMag * direction) >> PRECISION;
    }
    return 1u;
}

void main() {
    ivec2 idPos = ivec2(gl_FragCoord.xy - vec2(0.5));

    uint isActive = texelFetch(isActive, idPos, 0).x;
    ivec4 posVel = texelFetch(posVel, idPos, 0);
    uvec4 orthoConnections = texelFetch(orthoConnections, idPos, 0);
    uvec4 diagConnections = texelFetch(diagConnections, idPos, 0);

    ivec2 force = ivec2(0, -GRAVITY_IF);
    isActive &= orthoForce(force, posVel, orthoConnections.x);
    isActive &= orthoForce(force, posVel, orthoConnections.y);
    isActive &= orthoForce(force, posVel, orthoConnections.z);
    isActive &= orthoForce(force, posVel, orthoConnections.w);

    posVel.zw += (force * FRAME_TIME_IF) >> PRECISION;
    posVel.xy += (posVel.zw * FRAME_TIME_IF) >> PRECISION;
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
