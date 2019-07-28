const { objMap } = require('./../utils.js');

const percentile = (arr, percentile) => (
  arr[Math.floor(arr.length * percentile)]
);

const avg = (arr) => arr.reduce((acc, item) => acc + item) / arr.length;

const standardDeviation = (array, mean) => Math.sqrt(array.reduce((acc, item) => acc + Math.pow(item - mean, 2), 0) / array.length);

const objAggregation = (obj) => objMap(obj, (array) => {
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
    median: percentile(sortedArray, 0.5),
    count: array.length,
    standardDeviation: standardDeviation(array, mean),
    mean
  }
});

module.exports = {
  objAggregation
};
