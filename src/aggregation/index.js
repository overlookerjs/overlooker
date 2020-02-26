const { concatNetworks, aggregateNetwork } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { deepConcat } = require('./../objects-utils.js');
const { objDeepAggregation } = require('./aggregation-utils.js');
const { concatActions, aggregateActions } = require('./aggregation-actions.js');

const aggregateProfiles = (profiles,
                           buildData,
                           mergeRequests,
                           aggregation = objDeepAggregation) => {
  const { stats, network, actions } = profiles.reduce((summary, profile) => ({
    stats: deepConcat(profile.stats, summary.stats),
    network: concatNetworks(profile.network, summary.network, mergeRequests),
    actions: concatActions(profile.actions, summary.actions, mergeRequests)
  }), {
    stats: {},
    network: {},
    actions: {}
  });

  return {
    stats: aggregation(stats),
    network: expandNetwork(aggregateNetwork(aggregation, network), buildData),
    actions: aggregateActions(actions, buildData, mergeRequests, aggregation)
  };
};

module.exports = {
  aggregateProfiles
};
