const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleInternalsPlugin = require('bundle-internals');
const path = require('path');

const root = __dirname;

module.exports = {
  mode: 'production',
  entry: path.resolve(root, 'index.js'),
  output: {
    path: path.resolve(root, 'static'),
    filename: '[name].[chunkhash:8].js'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(html)$/,
        use: ['html-loader']
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader'
          },
        ],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({  // Also generate a test.html
      filename: 'index.html',
      template: path.resolve(root, 'index.html')
    }),
    new BundleInternalsPlugin({
      saveTo: path.resolve(root, 'static/build.json')
    })
  ]
};
