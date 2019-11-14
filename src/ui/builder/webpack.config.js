const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleInternalsPlugin = require('bundle-internals');
const ReactToHtmlPlugin = require('react-to-html-webpack-plugin');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

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
          "file-loader",
          "extract-loader",
          {
            loader: 'html-loader',
            options: {
              attrs: ["img:src", "link:href"]
            }
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
            "presets": ["@babel/preset-env", "@babel/preset-react"]
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
    new ReactToHtmlPlugin('index.html', 'index.js', {
      static: true,
      template: ejs.compile(fs.readFileSync(path.join(process.cwd(), root, 'index.ejs'), 'utf-8'))
    }),
    new BundleInternalsPlugin({
      saveTo: path.join(process.cwd(), root, 'build.json')
    })
  ]
});
