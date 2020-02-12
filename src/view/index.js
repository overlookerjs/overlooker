const { deepMap, flat, map, raiseFields, filter, toArray } = require('./../objects-utils.js');

const truncateAggregation = (data, aggregateName, mapper = (value) => value) => data[aggregateName] != null ? (
  mapper(data[aggregateName])
) : (
  map(data, (value) => truncateAggregation(value, aggregateName, mapper))
);

const addMeaning = (obj, meaning, digit) => deepMap(obj, (value, key) => {
  if (typeof value === 'number' && key !== 'count') {
    let newValue;
    const isPositive = value > 0;

    switch (meaning) {
      case 'kb':
        newValue = (value / 1024).toFixed(2) + 'KB';
        break;
      case '%':
        newValue = (value * 100).toFixed(2) + '%';
        break;
      case 's':
      default:
        newValue = (value / 1000 / 1000).toFixed(2) + 's';
    }

    if (digit) {
      newValue = (isPositive ? '+' : '') + newValue;
    }

    return newValue;
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

const excludeNetwork = ({network, actions, ...profile}) => ({
  ...profile,
  actions: map(actions, ({network, ...action}) => action)
});

const serializeProfile = (profile) => toArray(profile);

const serializeProfiles = (profiles) => toArray(map(profiles, excludeNetwork));

module.exports = {
  makeStatsReadable,
  truncateAggregation,
  flatStats,
  inverseTotal,
  addMeaning,
  serializeProfile,
  serializeProfiles
};
