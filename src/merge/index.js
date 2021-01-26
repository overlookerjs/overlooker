const { aggregateProfiles } = require('./../aggregation');
const { deepMapUntilArray } = require('./../objects-utils');
const jStat = require('jstat');

const strategies = {
  mean: (a) => jStat.mean(a),
  median: (a) => jStat.median(a)
};

const getAggregateMerger = (mergeStrategy) => (stats) => deepMapUntilArray(stats, mergeStrategy);

const merge = (data, pages, mergeStrategyName = 'mean') => (
  aggregateProfiles(
    Object.entries(data)
      .filter(([pageName]) => !pages || pages.includes(pageName))
      .map(([, pageData]) => ({ ...pageData, screenshots: null })),
    null,
    null,
    getAggregateMerger(strategies[mergeStrategyName])
  )
);

module.exports = {
  merge
};
