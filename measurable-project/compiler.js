const webpack = require('webpack');
const config = require('./webpack.config.js');

const compiler = webpack(config);
const compile = () => new Promise((resolve, reject) => compiler.run((err, stats) => {
  if (err || stats.hasErrors()) {
    reject(err);
  } else {
    resolve();
  }
}));

module.exports = compile;
