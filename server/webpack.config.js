const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

const rootDir = path.resolve(__dirname);

module.exports = {
    entry: rootDir + "/src/main.js",
    output:{
        path: rootDir + "/public/js",
        filename: "bundle.js"
    },
    module: {
        rules:[
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            }
        ]
    },
    plugins:[
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    devtool: 'source-map',
    mode: 'development'
}

//console.log(path.resolve(__dirname));
