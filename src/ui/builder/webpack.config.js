const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleInternalsPlugin = require('bundle-internals');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = (root = '') => ({
  mode: 'production',
  entry: ['@babel/polyfill', path.join(process.cwd(), root, 'index.js')],
  output: {
    path: path.join(process.cwd(), root, 'dist'),
    filename: '[name].[chunkhash:8].js'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(html)$/,
        use: [
          {
            loader: 'html-loader'
          }
        ]
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
          loader: 'babel-loader',
          options: {
            'presets': ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'file-loader',
          'extract-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(process.cwd(), root, 'index.html'),
      filename: 'index.html'
    }),
    new BundleInternalsPlugin({
      saveTo: 'build.json'
    })
  ]
});
