const path = require('path');
const webpack = require('webpack');

const PATHS = {
    src: path.join(__dirname, 'dist', 'index.js'),
    build: path.join(__dirname, 'build')
};

module.exports = {
    entry: PATHS.src,
    output: {
        path: PATHS.build,
        filename: "bundle.min.js",
        library: "EToken",
        libraryTarget: "var"
    },
    module: {
        preLoaders: [
            { test: /\.json/, loader: "json-loader" }
        ],
        loaders: [
            {
                test: /\.js/,
                exclude: /node_modules\/(?!(ethereumjs-tx|web3-provider-engine)\/).*/,
                loader: "babel",
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    node: {
      fs: "empty"
    },
    plugins: [
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false }),
    ]
};