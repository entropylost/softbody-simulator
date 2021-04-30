'use strict';

const { Base64: base64 } = require('js-base64');
const { PRECISION } = require('./constants');

module.exports = function initData(b64src) {
    const src = base64.toUint8Array(b64src).buffer;
    const [width, height] = Array.from(new Uint32Array(src, 0, 2));
    const data = new Uint8Array(src, 8);

    function get(x, y) {
        if (x <= 0 || y <= 0 || x >= width || y >= height) {
            return false;
        }
        if (data[x + y * width] === 1) {
            return true;
        } else {
            return false;
        }
    }

    let len = 0;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (get(x, y)) {
                len++;
            }
        }
    }

    len++; // Zeroth element is special.

    const res = {
        isActive: new Uint8Array(len),
        posVel: new Int32Array(len * 4),
        orthoConnections: new Uint32Array(len * 4),
        diagConnections: new Uint32Array(len * 4),
    };

    const idMap = new Map();

    {
        let id = 1;
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (get(x, y)) {
                    idMap.set([x, y], id);
                    id++;
                }
            }
        }
    }

    {
        let id = 1;
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (get(x, y)) {
                    const i4 = id * 4;
                    res.isActive[id] = 1;
                    res.posVel.set([x << PRECISION, y << PRECISION, 0, 0], i4);
                    {
                        const orthoConnections = [];
                        if (get(x - 1, y)) {
                            orthoConnections.push(idMap.get(x - 1, y));
                        }
                        if (get(x + 1, y)) {
                            orthoConnections.push(idMap.get(x + 1, y));
                        }
                        if (get(x, y - 1)) {
                            orthoConnections.push(idMap.get(x, y - 1));
                        }
                        if (get(x, y + 1)) {
                            orthoConnections.push(idMap.get(x, y + 1));
                        }
                        res.orthoConnections.set(orthoConnections, i4);
                    }
                    {
                        const diagConnections = [];
                        if (get(x - 1, y - 1)) {
                            diagConnections.push(idMap.get(x - 1, y - 1));
                        }
                        if (get(x + 1, y - 1)) {
                            diagConnections.push(idMap.get(x + 1, y - 1));
                        }
                        if (get(x - 1, y + 1)) {
                            diagConnections.push(idMap.get(x - 1, y + 1));
                        }
                        if (get(x + 1, y + 1)) {
                            diagConnections.push(idMap.get(x + 1, y + 1));
                        }
                        res.diagConnections.set(diagConnections, i4);
                    }
                    id++;
                }
            }
        }
    }

    return res;
};
