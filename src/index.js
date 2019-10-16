const { profile } = require('./profiler');
const { compare, comparePages } = require('./comparing');
const { check, checkPage } = require('./checker');
const { merge } = require('./merge');

module.exports = {
  profile,
  compare,
  comparePages,
  check,
  checkPage,
  merge
};
