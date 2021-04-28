'use strict';

const paths = require('./paths');
const path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackBar = require('webpackbar');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const plugins = [
    // Removes/cleans build folders and unused assets when rebuilding
    new CleanWebpackPlugin(),
    // Generates an HTML file from a template
    new HtmlWebpackPlugin({
        title: 'webpack-starter',
        favicon: path.resolve(__dirname, '../favicon.svg'),
        template: paths.src + '/template.html', // template file
        filename: 'index.html', // output file
    }),
    new WebpackBar(),
];

if (process.env.WEBPACK_ANALYZE_SIZE) {
    plugins.push(
        new BundleAnalyzerPlugin({
            logLevel: 'silent',
            openAnalyzer: false,
        })
    );
}

module.exports = {
    // Where webpack looks to start building the bundle
    entry: [paths.src + '/index.js'],
    stats: 'errors-only',
    // Where webpack outputs the assets and bundles
    output: {
        path: paths.build,
        filename: '[name].bundle.js',
        publicPath: '/',
    },
    // Customize the webpack build process
    plugins,
    // Determine how modules within the project are treated
    module: {
        rules: [
            // Styles: Inject CSS into the head with source maps
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                compileType: 'module',
                                mode: (a) => (/\.module\.\w+$/i.test(a) ? 'local' : 'global'),
                                auto: /.*/i,
                                exportGlobals: true,
                                namedExport: false,
                                exportLocalsConvention: 'asIs',
                                exportOnlyLocals: false,
                                localIdentName:
                                    process.env.NODE_ENV === 'production' ? '[hash:base64]' : '[path][name]__[local]',
                            },
                            importLoaders: 2,
                            esModule: false,
                        },
                    },
                    'sass-loader',
                    {
                        loader: 'postcss-loader',
                        options: { postcssOptions: { config: path.resolve(__dirname, 'postcss.config.js') } },
                    },
                ],
            },
            { test: /\.(?:ico|gif|png|jpg|jpeg)$/i, type: 'asset/resource' },
            { test: /\.(woff(2)?|eot|ttf|otf|svg|)$/, type: 'asset/inline' },
        ],
    },
};
