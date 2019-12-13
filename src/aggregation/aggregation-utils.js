const jStat = require('jstat');
const { mde } = require('./../math-utils');
const { map, deepMap } = require('./../objects-utils.js');

const aggregate = (array) => {
  const mean = jStat.mean(array);
  const standardDeviation = jStat.stdev(array);
  const mde = mde(standardDeviation, array.length);
  const median = jStat.median(array);
  const [percentile02, q1, q3, percentile98] = jStat.quantiles(array, [0.02, 0.25, 0.75, 0.98]);
  const min = jStat.min(array);
  const max = jStat.max(array);

  return {
    max,
    min,
    q1,
    q3,
    percentile98,
    percentile02,
    median,
    standardDeviation,
    mde,
    mean,
    count: array.length,
    raw: array
  }
};

const objAggregation = (obj) => map(obj, aggregate);

const objDeepAggregation = (obj) => deepMap(obj, objAggregation);

module.exports = {
  objAggregation,
  objDeepAggregation,
  aggregate,
  mde
};
