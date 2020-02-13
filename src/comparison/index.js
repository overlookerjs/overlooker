const { map } = require('../objects-utils.js');
const { compareNetworks } = require('./compare-network.js');
const { compareStats, compareStatsPercent } = require('./compare-stats.js');

const getComparator = (second, onlyStats = false) => (acc, [pageName, from]) => {
  acc[pageName] = compare(from, second[pageName], onlyStats);

  return acc;
};

const compare = (firstPage, secondPage, onlyStats = false) => ({
  absolute: {
    stats: compareStats(firstPage.stats, secondPage.stats),
    network: onlyStats ? null : compareNetworks(firstPage.network, secondPage.network),
    actions: map(firstPage.actions, (action, actionName) => secondPage.actions[actionName] ? ({
      stats: compareStats(action.stats, secondPage.actions[actionName].stats),
      network: onlyStats ? null : compareNetworks(action.network, secondPage.actions[actionName].network)
    }) : null)
  },
  percent: {
    stats: compareStatsPercent(firstPage.stats, secondPage.stats),
    actions: map(firstPage.actions, (action, actionName) => secondPage.actions[actionName] ? ({
      stats: compareStatsPercent(action.stats, secondPage.actions[actionName].stats)
    }) : null)
  }
});

const comparePages = (first, second, onlyStats = false) => Object.entries(first)
  .filter(([pageName]) => second[pageName])
  .reduce(getComparator(second, onlyStats), {});

module.exports = {
  compare,
  comparePages
};
