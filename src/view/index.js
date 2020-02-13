const { deepMap, flat, map, raiseFields, toArray } = require('./../objects-utils.js');

const truncateAggregation = (data, aggregateName, mapper = (value) => value) => {
  if (data.hasOwnProperty(aggregateName))
    console.log(data, aggregateName);
  return data.hasOwnProperty(aggregateName) ? (
    mapper(data[aggregateName])
  ) : (
    map(data, (value) => truncateAggregation(value, aggregateName, mapper))
  );
};

const addMeaning = (value, key, meaning, digit) => {
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
};

const addMeaningToObj = (obj, meaning, digit) => deepMap(obj, (value, key) => addMeaning(value, key, meaning, digit));

const makeStatsReadable = ({
                             timings,
                             userCentric,
                             custom,
                             evaluation,
                             resources,
                             coverage
                           }) => ({
  timings: addMeaningToObj(timings),
  userCentric: addMeaningToObj(userCentric),
  custom: addMeaningToObj(custom),
  evaluation: addMeaningToObj(evaluation),
  resources: addMeaningToObj(resources, 'kb'),
  coverage: addMeaningToObj(coverage, 'kb'),
});

const makeProfileReadable = (profile, isPercent) => ({
  stats: isPercent ? addMeaningToObj(profile.stats, '%', true) : makeStatsReadable(profile.stats),
  actions: map(profile.actions, ({ stats }) => ({
    stats: addMeaningToObj(stats, isPercent ? '%' : undefined, isPercent)
  }))
});

const makeComparisonReadable = (comparison) => ({
  absolute: makeProfileReadable(comparison.absolute),
  percent: makeProfileReadable(comparison.percent, true)
});

const flatStats = (stats) => map(raiseFields(stats, ['resources', 'coverage']), (value) => flat(value));

const inverseTotal = (stats) => deepMap(stats.total, (obj, key) => map(obj, (value, fieldName) => ({
  total: stats[key],
  external: stats.external[key][fieldName],
  internal: stats.internal[key][fieldName],
})));

const excludeNetwork = ({ network, actions, ...profile }) => ({
  ...profile,
  actions: map(actions, ({ network, ...action }) => action)
});

const serializeProfile = (profile) => toArray(profile);

const serializeProfiles = (profiles) => toArray(map(profiles, excludeNetwork));

module.exports = {
  makeStatsReadable,
  truncateAggregation,
  flatStats,
  inverseTotal,
  addMeaning,
  addMeaningToObj,
  serializeProfile,
  makeProfileReadable,
  makeComparisonReadable,
  serializeProfiles
};
