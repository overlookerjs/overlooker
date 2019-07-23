const { getEvaluatingSummary, normalizeEvaluatingSummary } = require('./aggregation-evaluating.js');
const { getNetworkSummary, normalizeNetworkSummary } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { objConcat, objMap } = require('../utils.js');
const { objAggregation } = require('./aggregation-utils.js');

const aggregateProfiles = (profiles, buildData, mergeRequests) => {
  const { stats, network, evaluating } = profiles.reduce((summary, profile) => ({
    stats: objMap(profile.stats, (innerObj, key) => objConcat(innerObj, summary.stats[key])),
    network: getNetworkSummary(profile.network, summary.network, mergeRequests),
    evaluating: getEvaluatingSummary(profile.evaluating, summary.evaluating)
  }), {
    stats: {},
    network: {},
    evaluating: {}
  });

  return {
    stats: objMap(stats, (innerObj) => objAggregation(innerObj)),
    network: expandNetwork(normalizeNetworkSummary(network), buildData),
    evaluating: normalizeEvaluatingSummary(evaluating)
  };
};

module.exports = {
  aggregateProfiles
};
