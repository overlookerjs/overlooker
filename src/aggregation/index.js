const { getNetworkSummary, normalizeNetworkSummary } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { objDeepConcat } = require('./../objects-utils.js');
const { objDeepAggregation } = require('./aggregation-utils.js');
const { getActionsSummary, normalizeActionsSummary } = require('./aggregation-actions.js');

const aggregateProfiles = (profiles, buildData, mergeRequests) => {
  const { stats, network, actions } = profiles.reduce((summary, profile) => ({
    stats: objDeepConcat(profile.stats, summary.stats),
    network: getNetworkSummary(profile.network, summary.network, mergeRequests),
    actions: getActionsSummary(profile.actions, summary.actions, mergeRequests)
  }), {
    stats: {},
    network: {},
    actions: {}
  });

  return {
    stats: objDeepAggregation(stats),
    network: expandNetwork(normalizeNetworkSummary(network), buildData),
    actions: normalizeActionsSummary(actions, buildData)
  };
};

module.exports = {
  aggregateProfiles
};
