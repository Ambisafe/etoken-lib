const path = require('path');

const PATHS = {
    src: path.join(__dirname, 'src', 'index.es6'),
    build: path.join(__dirname, 'build')
};

module.exports = {
    entry: {
        src: PATHS.src
    },
    output: {
        path: PATHS.build,
        filename: "bundle.js",
        library: "EToken",
        libraryTarget: "var"
    },
    module: {
        loaders: [
            { test: /\.json/, loader: "json" },
            {
                test: /\.es6/,
                exclude: /node_modules/,
                loader: "babel",
                query: {
                    presets: ['es2015']
                }
            }
        ]
    }
};