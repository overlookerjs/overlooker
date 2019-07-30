const { objPercent, objSub, objMap } = require('./../objects-utils.js');

const getComparator = (comparator) => (firstStats, secondStats) => (
  objMap(
    secondStats,
    (innerSection, sectionKey) => objMap(
      innerSection,
      (aggregation, aggregationKey) => (
        comparator(
          aggregation,
          firstStats[sectionKey][aggregationKey]
        )
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
