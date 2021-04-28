'use strict';

const { mod, m } = require('./settings.js');
const root = mod('root', (css, use, $) => {
    css(require('./styles.scss'));
    return {
        view() {
            return $._(
                $.h1('Hello World!'),
                $.canvas$simulation({
                    height: 200,
                    width: 200,
                })
            );
        },
        oncreate() {
            console.log('Initialized');
        },
    };
});
m.mount(document.body, root.component);
