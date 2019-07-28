const { objPercent, objSub, objMap } = require('../utils.js');

const getComparator = (comparator) => (firstStats, secondStats) => (
  objMap(
    secondStats,
    (innerSection, sectionKey) => objMap(
      innerSection,
      (aggregation, aggregationKey) => aggregationKey !== 'raw' ? (
        comparator(
          aggregation,
          firstStats[sectionKey][aggregationKey]
        )
      ) : (
        undefined
      )
    )
  )
);

const compareStats = getComparator(objSub);

const compareStatsPercent = getComparator(objPercent);

module.exports = {
  compareStats,
  compareStatsPercent
};
