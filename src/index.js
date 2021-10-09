'use strict';

const { FRAME_TIME } = require('./constants');

const { mod, m } = require('./settings.js');
const root = mod('root', (css, use, $) => {
    css(require('./styles.scss'));
    let errorDisplayed = false;

    return {
        view() {
            const children = [$.canvas$simulation()];
            if (errorDisplayed) {
                children.push(
                    $._$error(
                        'Error: Unable to acquire high-performance webgl context. Please make sure that your browser is fully to date and there are no other tabs open.'
                    )
                );
            }
            return $._(children);
        },
        oncreate(vnode) {
            const canvas = vnode.instance.children[0].dom;
            try {
                const update = require('./setup')(canvas);

                const startTime = performance.now();
                let lastFrameTime = 0;
                requestAnimationFrame(function run() {
                    const currentTime = performance.now() - startTime;
                    const frameCount = Math.floor((currentTime - lastFrameTime) / FRAME_TIME);
                    console.log(frameCount);
                    if (frameCount >= 50) {
                        console.log('Unable to keep up! Skipping frame.');
                        lastFrameTime = Math.floor(currentTime / FRAME_TIME) * FRAME_TIME;
                        requestAnimationFrame(run);
                        return;
                    }
                    for (let i = 0; i < frameCount; i++) {
                        update();
                    }
                    lastFrameTime = Math.floor(currentTime / FRAME_TIME) * FRAME_TIME;
                    requestAnimationFrame(run);
                });
            } catch (e) {
                errorDisplayed = true;
                m.redraw();
            }
        },
    };
});
m.mount(document.body, root.component);
