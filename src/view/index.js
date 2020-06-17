const { deepMap, flat, map, raiseFields, toArray } = require('./../objects-utils.js');

const truncateAggregation = (data, aggregateName, mapper = (value) => value) => (
  data.hasOwnProperty(aggregateName) ? (
    mapper(data[aggregateName])
  ) : (
    map(data, (value) => truncateAggregation(value, aggregateName, mapper))
  )
);

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
      case 'score':
        newValue = (value).toFixed(3);
        break;
      case 's':
      default:
        if (value / 1000 > 1000) {
          newValue = (value / 1000 / 1000).toFixed(2) + 's';
        } else {
          newValue = (value / 1000).toFixed(0) + 'ms';
        }
    }

    if (digit) {
      newValue = (isPositive ? '+' : '') + newValue;
    }

    return newValue;
  }
};

const addMeaningToObj = (obj, meaning, digit) => deepMap(
  obj,
  (value, key, path) => {
    const meaningIsObject = meaning instanceof Object;
    const joinedPath = meaningIsObject ? path.join('.') : '';
    const meaningKey = meaningIsObject ? (
      Object.keys(meaning)
        .find((key) => joinedPath.includes(key)) || '*'
    ) : null;

    return addMeaning(value, key, meaningKey ? meaning[meaningKey] : meaning, digit);
  }
);

const makeStatsReadable = ({
                             timings,
                             userCentric,
                             custom,
                             elementsTimings,
                             layersPaints,
                             evaluation,
                             resources,
                             coverage
                           }) => ({
  timings: addMeaningToObj(timings),
  userCentric: addMeaningToObj(userCentric, {'cumulativeLayoutShift': 'score'}),
  custom: addMeaningToObj(custom),
  elementsTimings: addMeaningToObj(elementsTimings, { '*': 's', 'visiblePercent': '%' }),
  layersPaints: addMeaningToObj(layersPaints),
  evaluation: addMeaningToObj(evaluation),
  resources: addMeaningToObj(resources, 'kb'),
  coverage: addMeaningToObj(coverage, { '*': 'kb', 'percent': '%' })
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

const flatStats = (stats, rise = ['resources', 'coverage', 'evaluation']) => map(
  rise ? raiseFields(stats, rise) : stats,
  (value) => typeof value === 'object' ? flat(value) : { value }
);

const inverseTotal = (stats) => deepMap(stats.total, (obj, key) => map(obj, (value, fieldName) => ({
  total: stats[key],
  external: stats.external[key][fieldName],
  internal: stats.internal[key][fieldName],
})));

const excludeNetwork = ({ network, actions, ...profile }) => ({
  ...profile,
  actions: map(actions, ({ network, ...action }) => action)
});

const makeRequestStatsReadable = (requestStats) => {
  const {
      size,
      transfer,
      evaluation,
      timings,
      coverage
  } = requestStats;

  return {
    size: typeof size === 'object' ? addMeaningToObj(size, 'kb') : addMeaning(size, null, 'kb'),
    transfer: typeof transfer === 'object' ? addMeaningToObj(transfer, 'kb') : addMeaning(transfer, null, 'kb'),
    evaluation: typeof evaluation === 'object' ? addMeaningToObj(evaluation, 's') : addMeaning(evaluation, null, 's'),
    timings: addMeaningToObj(timings),
    coverage: addMeaningToObj(coverage, { '*': 'kb', 'percent': '%' })
  };
};

const makeRequestReadable = (request) => {
  const {
    stats,
    ...rest
  } = request;

  return {
    stats: makeRequesStatsReadable(stats),
    ...rest
  };
};

const makeNetworkReadable = (network) => network.map(makeRequestReadable);

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
  makeNetworkReadable,
  makeRequestReadable,
  makeRequestStatsReadable,
  serializeProfiles
};
