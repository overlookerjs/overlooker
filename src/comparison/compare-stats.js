const { inverseSub, inversePercent, deepCompare } = require('./../objects-utils.js');

const getComparator = (comparator) => (firstStats, secondStats) => deepCompare(comparator, firstStats, secondStats);

const compareStats = getComparator(inverseSub);

const compareStatsPercent = getComparator(inversePercent);

module.exports = {
  compareStats,
  compareStatsPercent
};
