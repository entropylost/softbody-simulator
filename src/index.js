'use strict';

const { FRAME_TIME } = require('./constants');

const { mod, m } = require('./settings.js');
const root = mod('root', (css, use, $) => {
    css(require('./styles.scss'));
    return {
        view() {
            return $._(
                $.canvas$simulation({
                    height: 1 << 9,
                    width: 1 << 9,
                })
            );
        },
        oncreate(vnode) {
            const canvas = vnode.instance.children[0].dom;
            const update = require('./setup')(canvas);

            const startTime = performance.now();
            let lastFrameTime = 0;
            requestAnimationFrame(function run() {
                const currentTime = performance.now() - startTime;
                const frameCount = Math.floor((currentTime - lastFrameTime) / FRAME_TIME);
                for (let i = 0; i < frameCount; i++) {
                    console.log('Updating');
                    update();
                }
                lastFrameTime = Math.floor(currentTime / FRAME_TIME) * FRAME_TIME;
                requestAnimationFrame(run);
            });
        },
    };
});
m.mount(document.body, root.component);
