const { objMap } = require('../objects-utils.js');
const { compareNetworks } = require('./compare-network.js');
const { compareStats, compareStatsPercent } = require('./compare-stats.js');

const compare = (first, second) => Object.entries(first)
  .filter(([pageName]) => second[pageName])
  .reduce((acc, [pageName, firstValue]) => ({
    ...acc,
    [pageName]: {
      absolute: {
        stats: compareStats(firstValue.stats, second[pageName].stats),
        network: compareNetworks(firstValue.network, second[pageName].network),
        actions: objMap(firstValue.actions, (action, actionName) => second[pageName].actions[actionName] ? ({
          stats: compareStats(action.stats, second[pageName].actions[actionName].stats),
          network: compareNetworks(action.network, second[pageName].actions[actionName].network)
        }) : null)
      },
      percent: {
        stats: compareStatsPercent(firstValue.stats, second[pageName].stats),
        actions: objMap(firstValue.actions, (action, actionName) => second[pageName].actions[actionName] ? ({
          stats: compareStatsPercent(action.stats, second[pageName].actions[actionName].stats)
        }) : null)
      }
    }
  }), {});

module.exports = {
  compare
};
