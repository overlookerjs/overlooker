const webpack = require('webpack');
const config = require('./webpack.config');

const compile = (root) => new Promise((resolve, reject) => {
  const compiler = webpack(config(root));

  compiler.run((err, stats) => {
    if (err || stats.hasErrors()) {
      console.error(stats.toString());
      reject(err);
    } else {
      resolve();
    }
  })
});

module.exports = compile;
