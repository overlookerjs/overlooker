const { map } = require('./../objects-utils.js');
const { compareNetworks } = require('./compare-network.js');
const { compareStats, compareStatsPercent } = require('./compare-stats.js');

const compareActions = ({ actions: firstActions }, { actions: secondActions }, onlyStats) => map(
  firstActions,
  (action, actionName) => secondActions[actionName] ? ({
    stats: compareStats(action.stats, secondActions[actionName].stats),
    network: onlyStats ? null : compareNetworks(action.network, secondActions[actionName].network)
  }) : null
);

const compareActionsPercent = ({ actions: firstActions }, { actions: secondActions }) => map(
  firstActions,
  (action, actionName) => secondActions[actionName] ? ({
    stats: compareStatsPercent(action.stats, secondActions[actionName].stats)
  }) : null
);

module.exports = {
  compareActions,
  compareActionsPercent
};
