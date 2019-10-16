const percentile = (arr, percentile) => (
  arr[Math.floor(arr.length * percentile)]
);

const avg = (arr) => arr.reduce((acc, item) => acc + item) / arr.length;

const median = (arr) => percentile(arr, 0.5);

const standardDeviation = (array, mean) => Math.sqrt(array.reduce((acc, item) => acc + Math.pow(item - mean, 2), 0) / array.length);

module.exports = {
  percentile,
  avg,
  median,
  standardDeviation
};
