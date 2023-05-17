const path = require('path');

const BABEL_CONFIG = {
    presets: [
        'es2015',
        'react',
        'stage-3'
    ].map(name => require.resolve(`babel-preset-${name}`))
};

module.exports = {
    entry: './client/dash.jsx',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            { test: /\.jsx?$/, use: [{ loader: 'babel-loader', options: BABEL_CONFIG }], exclude: /node_modules/ },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
            { test: /\.glsl$/, use: 'raw-loader' }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            'mapbox-gl$': path.resolve('./node_modules/mapbox-gl/dist/mapbox-gl.js')
        }
    },
    // devtool: "cheap-eval-source-map",
    devtool: 'source-map'
//   externals: ["react"]
};
