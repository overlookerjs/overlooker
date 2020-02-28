const { profile } = require('./profiler');
const { compare, comparePages } = require('./comparison');
const { check, checkPages } = require('./checker');
const { merge } = require('./merge');
const { impactAnalysis } = require('./impact-analysis');
const view = require('./view');

module.exports = {
  profile,
  compare,
  comparePages,
  check,
  checkPages,
  merge,
  impactAnalysis,
  view
};
