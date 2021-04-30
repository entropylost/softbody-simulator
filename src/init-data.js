'use strict';

module.exports = function initData(src) {
    const len = 1500;
    console.log(src);
    console.log(convertBase64ToBinary(src));
    return {
        isActive: new Uint8Array(len),
        posVel: new Int32Array(len * 4),
        orthoConnections: new Uint32Array(len * 4),
        diagConnections: new Uint32Array(len * 4),
    };
};
