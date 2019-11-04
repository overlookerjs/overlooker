const { map } = require('../objects-utils.js');
const { compareNetworks } = require('./compare-network.js');
const { compareStats, compareStatsPercent } = require('./compare-stats.js');

const getComparator = (second) => (acc, [pageName, from]) => {
  acc[pageName] = comparePages(from, second[pageName]);

  return acc;
};

const comparePages = (firstPage, secondPage) => ({
  absolute: {
    stats: compareStats(firstPage.stats, secondPage.stats),
    network: compareNetworks(firstPage.network, secondPage.network),
    actions: map(firstPage.actions, (action, actionName) => secondPage.actions[actionName] ? ({
      stats: compareStats(action.stats, secondPage.actions[actionName].stats),
      network: compareNetworks(action.network, secondPage.actions[actionName].network)
    }) : null)
  },
  percent: {
    stats: compareStatsPercent(firstPage.stats, secondPage.stats),
    actions: map(firstPage.actions, (action, actionName) => secondPage.actions[actionName] ? ({
      stats: compareStatsPercent(action.stats, secondPage.actions[actionName].stats)
    }) : null)
  }
});

const compare = (first, second) => Object.entries(first)
  .filter(([pageName]) => second[pageName])
  .reduce(getComparator(second), {});

module.exports = {
  compare,
  comparePages
};
