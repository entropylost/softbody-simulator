'use strict';

const { mod, m } = require('./settings.js');
const root = mod('root', (css, use, $) => {
    css(require('./styles.scss'));
    return {
        view() {
            return $._(
                $.h1('Hello World!'),
                $.canvas$simulation({
                    height: 1 << 8,
                    width: 1 << 8,
                })
            );
        },
        oncreate(vnode) {
            console.log('Initialized');
            const canvas = vnode.instance.children[1].dom;
            require('./setup')(canvas);
        },
    };
});
m.mount(document.body, root.component);
