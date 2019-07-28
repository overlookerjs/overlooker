const { compareNetworks } = require('./compare-network.js');
const { compareStats, compareStatsPercent } = require('./compare-stats.js');

const compare = (first, second) => ({
  absolute: {
    stats: compareStats(first.stats, second.stats),
    network: compareNetworks(first.network, second.network)
  },
  percent: {
    stats: compareStatsPercent(first.stats, second.stats)
  }
});

module.exports = {
  compare
};
