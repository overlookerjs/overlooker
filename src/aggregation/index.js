const { getNetworkSummary, normalizeNetworkSummary } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { objConcat, objMap } = require('./../objects-utils.js');
const { objAggregation } = require('./aggregation-utils.js');
const { getActionsSummary, normalizeActionsSummary } = require('./aggregation-actions.js');

const aggregateProfiles = (profiles, buildData, mergeRequests) => {
  const { stats, network, actions } = profiles.reduce((summary, profile) => ({
    stats: objMap(profile.stats, (innerObj, key) => objConcat(innerObj, summary.stats[key])),
    network: getNetworkSummary(profile.network, summary.network, mergeRequests),
    actions: getActionsSummary(profile.actions, summary.actions, mergeRequests)
  }), {
    stats: {},
    network: {},
    actions: {}
  });

  return {
    stats: objMap(stats, (innerObj) => objAggregation(innerObj)),
    network: expandNetwork(normalizeNetworkSummary(network), buildData),
    actions: normalizeActionsSummary(actions, buildData)
  };
};

module.exports = {
  aggregateProfiles
};
