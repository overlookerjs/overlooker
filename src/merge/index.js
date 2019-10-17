const { aggregateProfiles } = require('./../aggregation');
const { objDeepMap, objMap } = require('./../objects-utils');
const { avg, median } = require('./../math-utils');

const strategies = {
  avg,
  median
};

const getAggregateMerger = (mergeStrategy) => (stats) => objDeepMap(stats, (obj) => objMap(obj, mergeStrategy));

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
