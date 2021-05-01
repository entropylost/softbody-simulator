ivec2 idFromInt(int id) {
    return ivec2(id & (DATA_TEXTURE_WIDTH - 1), id >> DATA_TEXTURE_WIDTH_POWER);
}
ivec2 idFromUint(uint id) {
    return ivec2(id & (DATA_TEXTURE_WIDTH_U - 1u), id >> DATA_TEXTURE_WIDTH_POWER_U);
}
