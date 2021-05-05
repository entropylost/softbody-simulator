'use strict';

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
            return 0;
        }
        return data[x + (height - y) * width];
    }

    let len = 0;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (get(x, y) !== 0) {
                len++;
            }
        }
    }
    len++; // Zeroth element is special.
    const res = {
        type: new Uint8Array(len),
        posVel: new Float32Array(len * 4),
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

    function attemptConnect(connections, x, y) {
        if (get(x, y) !== 0) {
            connections.push(idMap.get(JSON.stringify([x, y])));
        }
    }

    {
        let id = 1;
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const value = get(x, y);
                if (value !== 0) {
                    const i4 = id * 4;
                    res.type[id] = value;
                    res.posVel.set([x - width / 2, y - height / 2, 0, 0], i4);
                    {
                        const orthoConnections = [];
                        attemptConnect(orthoConnections, x - 1, y);
                        attemptConnect(orthoConnections, x + 1, y);
                        attemptConnect(orthoConnections, x, y - 1);
                        attemptConnect(orthoConnections, x, y + 1);
                        res.orthoConnections.set(orthoConnections, i4);
                    }
                    {
                        const diagConnections = [];
                        attemptConnect(diagConnections, x - 1, y - 1);
                        attemptConnect(diagConnections, x + 1, y - 1);
                        attemptConnect(diagConnections, x - 1, y + 1);
                        attemptConnect(diagConnections, x + 1, y + 1);
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
