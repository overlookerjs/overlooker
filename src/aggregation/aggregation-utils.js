const { avg, median, percentile, standardDeviation } = require('./../math-utils');
const { map, deepMap } = require('./../objects-utils.js');

const aggregate = (array) => {
  const mean = avg(array);
  const sortedArray = array
    .slice()
    .sort((a, b) => a - b);

  return {
    q1: percentile(sortedArray, 0.25),
    q3: percentile(sortedArray, 0.75),
    percentile98: percentile(sortedArray, 0.98),
    percentile02: percentile(sortedArray, 0.02),
    max: sortedArray[sortedArray.length - 1],
    min: sortedArray[0],
    median: median(sortedArray),
    count: array.length,
    standardDeviation: standardDeviation(array, mean),
    mean,
    raw: array
  }
};

const objAggregation = (obj) => map(obj, aggregate);

const objDeepAggregation = (obj) => deepMap(obj, objAggregation);

module.exports = {
  objAggregation,
  objDeepAggregation,
  aggregate
};
