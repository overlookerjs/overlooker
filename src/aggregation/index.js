const { getNetworkSummary, normalizeNetworkSummary } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { deepConcat } = require('./../objects-utils.js');
const { objDeepAggregation } = require('./aggregation-utils.js');
const { getActionsSummary, normalizeActionsSummary } = require('./aggregation-actions.js');

const aggregateProfiles = (profiles,
                           buildData,
                           mergeRequests,
                           aggregation = objDeepAggregation) => {
  const { stats, network, actions } = profiles.reduce((summary, profile) => ({
    stats: deepConcat(profile.stats, summary.stats),
    network: getNetworkSummary(profile.network, summary.network, mergeRequests),
    actions: getActionsSummary(profile.actions, summary.actions, mergeRequests)
  }), {
    stats: {},
    network: {},
    actions: {}
  });

  return {
    stats: aggregation(stats),
    network: expandNetwork(normalizeNetworkSummary(network), buildData),
    actions: normalizeActionsSummary(actions, buildData)
  };
};

module.exports = {
  aggregateProfiles
};
