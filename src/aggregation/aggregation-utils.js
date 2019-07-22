const { objMap } = require('./../utils.js');

const percentile = (arr, percentile) => (
  arr
    .slice()
    .sort((a, b) => a - b)
    [Math.floor(arr.length * percentile)]
);

const avg = (arr) => arr.reduce((acc, item) => acc + item) / arr.length;

const max = (arr) => arr.reduce((res, item) => res > item ? res : item);

const min = (arr) => arr.reduce((res, item) => res < item ? res : item);

const standardDeviation = (array, mean) => Math.sqrt(array.reduce((acc, item) => acc + Math.pow(item - mean, 2), 0) / array.length);

const objAggregation = (obj) => objMap(obj, (array) => {
  const mean = avg(array);

  return {
    raw: array,
    q1: percentile(array, 0.25),
    q3: percentile(array, 0.75),
    percentile98: percentile(array, 0.98),
    percentile02: percentile(array, 0.02),
    max: max(array),
    min: min(array),
    median: percentile(array, 0.5),
    count: array.length,
    standardDeviation: standardDeviation(array, mean),
    mean
  }
});

module.exports = {
  standardDeviation,
  percentile,
  avg,
  max,
  min,
  objAggregation
};
