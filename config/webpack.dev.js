'use strict';

const paths = require('./paths');

const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    // Set the mode to development or production
    mode: 'development',
    // Control how source maps are generated
    devtool: 'inline-source-map',
    // Spin up a server for quick development
    devServer: {
        historyApiFallback: true,
        contentBase: paths.public,
        open: true,
        compress: true,
        port: 8080,
        stats: {
            colors: true,
            hash: false,
            version: false,
            timings: false,
            assets: false,
            chunks: false,
            modules: false,
        },
        clientLogLevel: 'silent',
    },

    plugins: [
        // Only update what has changed on hot reload
        new webpack.HotModuleReplacementPlugin(),
    ],
});
