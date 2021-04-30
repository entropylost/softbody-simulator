'use strict';

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
            console.log('Initialized');
            const canvas = vnode.instance.children[0].dom;
            const update = require('./setup')(canvas);
            update();
        },
    };
});
m.mount(document.body, root.component);
