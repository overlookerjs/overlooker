const { deepCompare } = require('./../objects-utils.js');
const { inverseSub, inversePercent } = require('./../math-utils.js');

const getComparator = (comparator) => (firstStats, secondStats) => deepCompare(comparator, firstStats, secondStats);

const compareStats = getComparator(inverseSub);

const compareStatsPercent = getComparator(inversePercent);

module.exports = {
  compareStats,
  compareStatsPercent
};
