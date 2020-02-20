const { compareNetworks } = require('./compare-network.js');
const { compareActions, compareActionsPercent } = require('./compare-actions.js');
const { compareStats, compareStatsPercent } = require('./compare-stats.js');

const compare = (firstPage, secondPage, onlyStats = false) => ({
  absolute: {
    stats: compareStats(firstPage.stats, secondPage.stats),
    network: onlyStats ? null : compareNetworks(firstPage.network, secondPage.network),
    actions: compareActions(firstPage, secondPage, onlyStats)
  },
  percent: {
    stats: compareStatsPercent(firstPage.stats, secondPage.stats),
    actions: compareActionsPercent(firstPage, secondPage)
  }
});

const getComparator = (second, onlyStats = false) => (acc, [pageName, from]) => {
  acc[pageName] = compare(from, second[pageName], onlyStats);

  return acc;
};

const comparePages = (first, second, onlyStats = false) => Object.entries(first)
  .filter(([pageName]) => second[pageName])
  .reduce(getComparator(second, onlyStats), {});

module.exports = {
  compare,
  comparePages
};
