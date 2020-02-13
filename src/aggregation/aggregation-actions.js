const { getNetworkSummary, normalizeNetworkSummary } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { map, deepConcat } = require('./../objects-utils.js');
const { objDeepAggregation } = require('./aggregation-utils.js');

const getActionsSummary = (actions, summaryActions) => ({
  ...summaryActions,
  ...Object.entries(actions).reduce((acc, [key, value]) => {
    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(value);

    return acc;
  }, summaryActions)
});

const normalizeActionsSummary = (actions, buildData, mergeRequests, aggregation) => map(actions, (action) => {
  const summarizedAction = action.reduce((summary, actionChunk) => ({
    stats: deepConcat(actionChunk.stats, summary.stats),
    network: getNetworkSummary(
      actionChunk.network,
      summary.network,
      mergeRequests
    )
  }), {
    stats: {},
    network: {}
  });

  return ({
    stats: aggregation(summarizedAction.stats),
    network: expandNetwork(normalizeNetworkSummary(summarizedAction.network), buildData),
  })
});

module.exports = {
  getActionsSummary,
  normalizeActionsSummary
};
