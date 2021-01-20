const { aggregate } = require('./aggregation-utils.js');
const { map } = require('./../objects-utils.js');

const findNearestScreenshots = (sortedScreenshots, weight) => (
  sortedScreenshots.find((screenshot) => screenshot.weight >= weight)
);

const aggregateScreenshots = (screenshots) => {
  const sortedScreenshots = screenshots.slice().sort((a, b) => a.weight - b.weight);
  const weights = sortedScreenshots.map(({ weight }) => weight);

  const {
    standardDeviation,
    mde,
    ...points
  } = aggregate(weights);

  const selectedScreenshots = map(
    points,
    (value) => findNearestScreenshots(sortedScreenshots, value)
  );

  return selectedScreenshots;
}

module.exports = {
  aggregateScreenshots
};
