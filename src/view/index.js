const { deepMap, flat, map, raiseFields } = require('./../objects-utils.js');

const truncateAggregation = (data, aggregateName, mapper = (value) => value) => data[aggregateName] != null ? (
  mapper(data[aggregateName])
) : (
  map(data, (value) => truncateAggregation(value, aggregateName, mapper))
);

const addMeaning = (obj, meaning) => deepMap(obj, (value, key) => {
  if (typeof value === 'number' && key !== 'count') {
    switch (meaning) {
      case 'kb':
        return (value / 1024).toFixed(2) + 'KB';
      case '%':
        return (value * 100).toFixed(2) + '%';
      case 's':
      default:
        return (value / 1000 / 1000 / 60).toFixed(2) + 's';
    }
  }
});

const makeStatsReadable = ({
                             timings,
                             userCentric,
                             custom,
                             evaluation,
                             resources,
                             coverage
                           }) => ({
  timings: addMeaning(timings),
  userCentric: addMeaning(userCentric),
  custom: addMeaning(custom),
  evaluation: addMeaning(evaluation),
  resources: addMeaning(resources, 'kb'),
  coverage: addMeaning(coverage, 'kb'),
});

const flatStats = (stats) => map(raiseFields(stats, ['resources', 'coverage']), (value) => flat(value));

const inverseTotal = (stats) => deepMap(stats.total, (obj, key) => map(obj, (value, fieldName) => ({
  total: stats[key],
  external: stats.external[key][fieldName],
  internal: stats.internal[key][fieldName],
})));

module.exports = {
  makeStatsReadable,
  truncateAggregation,
  flatStats,
  inverseTotal
};
