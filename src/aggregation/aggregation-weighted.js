const { aggregate } = require('./aggregation-utils.js');
const { map } = require('./../objects-utils.js');

const findNearestWeighted = (sortedWeighted, weight) => (
  sortedWeighted.find((screenshot) => screenshot.weight >= weight)
);

const aggregateWeighted = (weightedObjects) => {
  const sortedWeighted = weightedObjects.slice().sort((a, b) => a.weight - b.weight);
  const weights = sortedWeighted.map(({ weight }) => weight);

  const {
    standardDeviation,
    mde,
    ...points
  } = aggregate(weights);

  const selectedWeighted = map(
    points,
    (value) => findNearestWeighted(sortedWeighted, value)
  );

  return selectedWeighted;
}

module.exports = {
  aggregateWeighted
};
