'use strict';

const { mod, m } = require('./settings.js');
const root = mod('root', (css, use, $) => {
    css(require('./styles.scss'));
    return {
        view() {
            return $._('Hello World!');
        },
    };
});
m.mount(document.body, root.component);
