'use strict';

const { PRECISION } = require('./constants');

const BASE64_MARKER = ';base64,';

function convertBase64ToBinary(dataURI) {
    const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    const base64 = dataURI.substring(base64Index);
    const raw = window.atob(base64);
    const rawLength = raw.length;
    const array = new Uint8Array(new ArrayBuffer(rawLength));

    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array.buffer;
}

module.exports = function initData(b64src) {
    console.log('Loading map');
    const src = convertBase64ToBinary(b64src);
    const [width, height] = Array.from(new Uint32Array(src, 0, 2));
    console.log(`Width of map: ${width}`);
    console.log(`Height of map: ${height}`);
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
                    idMap.set(JSON.stringify([x, y]), id);
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
                    res.posVel.set([(x - width / 2) << PRECISION, (height / 2 - y) << PRECISION, 0, 0], i4);
                    {
                        const orthoConnections = [];
                        if (get(x - 1, y)) {
                            orthoConnections.push(idMap.get(JSON.stringify([x - 1, y])));
                        }
                        if (get(x + 1, y)) {
                            orthoConnections.push(idMap.get(JSON.stringify([x + 1, y])));
                        }
                        if (get(x, y - 1)) {
                            orthoConnections.push(idMap.get(JSON.stringify([x, y - 1])));
                        }
                        if (get(x, y + 1)) {
                            orthoConnections.push(idMap.get(JSON.stringify([x, y + 1])));
                        }
                        res.orthoConnections.set(orthoConnections, i4);
                    }
                    {
                        const diagConnections = [];
                        if (get(x - 1, y - 1)) {
                            diagConnections.push(idMap.get(JSON.stringify([x - 1, y - 1])));
                        }
                        if (get(x + 1, y - 1)) {
                            diagConnections.push(idMap.get(JSON.stringify([x + 1, y - 1])));
                        }
                        if (get(x - 1, y + 1)) {
                            diagConnections.push(idMap.get(JSON.stringify([x - 1, y + 1])));
                        }
                        if (get(x + 1, y + 1)) {
                            diagConnections.push(idMap.get(JSON.stringify([x + 1, y + 1])));
                        }
                        res.diagConnections.set(diagConnections, i4);
                    }
                    id++;
                }
            }
        }
    }
    console.log('Finished loading map:');
    console.log(res);
    return { sources: res, width, height };
};
