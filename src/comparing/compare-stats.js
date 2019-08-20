const { objPercent, objSub, objMap, objDeepCompare } = require('./../objects-utils.js');

const getComparator = (comparator) => (firstStats, secondStats) => objDeepCompare(comparator, firstStats, secondStats);

const compareStats = getComparator(objSub);

const compareStatsPercent = getComparator(objPercent);

module.exports = {
  compareStats,
  compareStatsPercent
};
