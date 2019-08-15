const { getNetworkSummary, normalizeNetworkSummary } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { objConcat, objMap } = require('./../objects-utils.js');
const { objAggregation } = require('./aggregation-utils.js');

const aggregateProfiles = (profiles, buildData, mergeRequests) => {
  const { stats, network, actions } = profiles.reduce((summary, profile) => ({
    stats: objMap(profile.stats, (innerObj, key) => objConcat(innerObj, summary.stats[key])),
    network: getNetworkSummary(profile.network, summary.network, mergeRequests),
    actions: objMap(profile.actions, (action, name) => ({
      stats: objMap(action.stats, (innerObj, key) => objConcat(
        innerObj,
        summary.actions[name] ? summary.actions[name].stats[key] : {}
      )),
      network: getNetworkSummary(
        action.network,
        summary.actions[name] ? summary.actions[name].network : {},
        mergeRequests
      )
    }))
  }), {
    stats: {},
    network: {},
    actions: {}
  });

  return {
    stats: objMap(stats, (innerObj) => objAggregation(innerObj)),
    network: expandNetwork(normalizeNetworkSummary(network), buildData),
    actions: objMap(actions, (action) => ({
      stats: objMap(action.stats, (innerObj) => objAggregation(innerObj)),
      network: expandNetwork(normalizeNetworkSummary(action.network), buildData),
    }))
  };
};

module.exports = {
  aggregateProfiles
};
