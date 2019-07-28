const { objPercent, objSub, objMap } = require('../utils.js');

const compareStats = (firstStats, secondStats) => (
  objMap(secondStats, (innerObj, key) => objSub(innerObj, firstStats[key]))
);

const compareStatsPercent = (firstStats, secondStats) => (
  objMap(secondStats, (innerObj, key) => objPercent(innerObj, firstStats[key]))
);

module.exports = {
  compareStats,
  compareStatsPercent
};
