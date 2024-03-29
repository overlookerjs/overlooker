const jStat = require('jstat');
const { map, deepMapUntilArray } = require('./../objects-utils.js');

const calcMDE = (stdev, n) => (
  2 * stdev / Math.sqrt(n) * (jStat.studentt.inv(1 - 0.2, n - 2) + jStat.studentt.inv(1 - 0.025, n - 2))
);

const aggregate = (array) => {
  const mean = jStat.mean(array);
  const standardDeviation = jStat.stdev(array);
  const mde = calcMDE(standardDeviation, array.length);
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
    mean
  }
};

const objAggregation = (obj) => map(obj, aggregate);

const objDeepAggregation = (obj) => deepMapUntilArray(obj, aggregate);

const concatWithWeight = (weightType) => (weight, data, target) => {
  return data ? [
    ...target,
    {
      data,
      weight,
      weightType
    }
  ] : null
}

module.exports = {
  objAggregation,
  objDeepAggregation,
  aggregate,
  concatWithWeight
};
