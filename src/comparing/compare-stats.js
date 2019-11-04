const { percent, sub, map, deepCompare } = require('./../objects-utils.js');

const getComparator = (comparator) => (firstStats, secondStats) => deepCompare(comparator, firstStats, secondStats);

const compareStats = getComparator(sub);

const compareStatsPercent = getComparator(percent);

module.exports = {
  compareStats,
  compareStatsPercent
};
