const { aggregateProfiles } = require('./../aggregation');
const { objDeepMap } = require('./../objects-utils');
const { avg, median } = require('./../math-utils');

const strategies = {
  avg,
  median
};

const getAggregateMerger = (mergeStrategy) => (stats) => objDeepMap(stats, (array) => mergeStrategy(array));

const merge = (data, pages, mergeStrategyName = 'avg') => (
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
