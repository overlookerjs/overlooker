const { profile } = require('./profiler');
const { compare, comparePages } = require('./comparing');
const { check, checkPage } = require('./checker');
const { merge } = require('./merge');
const view = require('./view');

module.exports = {
  profile,
  compare,
  comparePages,
  check,
  checkPage,
  merge,
  view
};
