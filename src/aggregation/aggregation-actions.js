const { getNetworkSummary, normalizeNetworkSummary } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { objConcat, objMap, objDeepConcat } = require('./../objects-utils.js');
const { objDeepAggregation } = require('./aggregation-utils.js');

const getActionsSummary = (actions, summaryActions, mergeRequests) => (
  objMap(actions, (action, name) => ({
    stats: objDeepConcat(action.stats, summaryActions.stats),
    network: getNetworkSummary(
      action.network,
      summaryActions[name] ? summaryActions[name].network : {},
      mergeRequests
    )
  }))
);

const normalizeActionsSummary = (actions, buildData) => objMap(actions, (action) => ({
  stats: objDeepAggregation(action.stats),
  network: expandNetwork(normalizeNetworkSummary(action.network), buildData),
}));

module.exports = {
  getActionsSummary,
  normalizeActionsSummary
};
