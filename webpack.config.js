const path = require('path');

const PATHS = {
    src: path.join(__dirname, 'dist', 'index.js'),
    build: path.join(__dirname, 'build')
};

module.exports = {
    entry: PATHS.src,
    output: {
        path: PATHS.build,
        filename: "bundle.js",
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
                exclude: /node_modules\/(?!(ethereumjs-tx|web3-provider-engine|ethereumjs-util|browserify-sha3|rlp|eth-block-tracker|eth-json-rpc-filters|json-rpc-engine)\/).*/,
                loader: "babel-loader",
                query: {
                    presets: [['@babel/preset-env', { 'targets': '> 0.25%, not dead' }]],
                    plugins: ['@babel/plugin-transform-object-assign'],
                }
            }
        ]
    },
    node: {
      fs: "empty"
    },
    plugins: []
};