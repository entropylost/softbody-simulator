ivec2 idFromInt(int id) {
    return ivec2(id & (DATA_TEXTURE_WIDTH - 1), id >> DATA_TEXTURE_WIDTH_POWER);
}
int idFromIvec(ivec2 id) {
    return id.x + id.y * DATA_TEXTURE_WIDTH;
}
