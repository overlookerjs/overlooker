const { compareNetworks } = require('./compare-network.js');
const { compareStats, compareStatsPercent } = require('./compare-stats.js');

const compare = (first, second) => Object.entries(first)
  .filter(([pageName]) => second[pageName])
  .reduce((acc, [pageName, firstValue]) => ({
    ...acc,
    [pageName]: {
      absolute: {
        stats: compareStats(firstValue.stats, second[pageName].stats),
        network: compareNetworks(firstValue.network, second[pageName].network)
      },
      percent: {
        stats: compareStatsPercent(firstValue.stats, second[pageName].stats)
      }
    }
  }), {});

module.exports = {
  compare
};
