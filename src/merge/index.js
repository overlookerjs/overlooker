const { aggregateProfiles } = require('./../aggregation');
const { deepMap, map } = require('./../objects-utils');
const jStat = require('jstat');

const strategies = {
  mean: (a) => jStat.mean(a),
  median: (a) => jStat.median(a)
};

const getAggregateMerger = (mergeStrategy) => (stats) => deepMap(stats, (obj) => map(obj, mergeStrategy));

const merge = (data, pages, mergeStrategyName = 'mean') => (
  aggregateProfiles(
    Object.entries(data)
      .filter(([pageName]) => !pages || pages.includes(pageName))
      .map(([, pageData]) => pageData),
    null,
    null,
    getAggregateMerger(strategies[mergeStrategyName])
  )
);

module.exports = {
  merge
};
