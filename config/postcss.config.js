'use strict';

module.exports = {
    ident: 'postcss',
    syntax: 'postcss-scss',
    plugins: {
        'postcss-lab-function': {
            preserve: true,
        },
        'postcss-short': {},
    },
};
