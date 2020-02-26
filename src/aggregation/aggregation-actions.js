const { concatNetworks, aggregateNetwork } = require('./aggregation-network.js');
const { expandNetwork } = require('./../chunks-meta');
const { map, deepConcat } = require('./../objects-utils.js');

const concatActions = (actions, summaryActions) => ({
  ...summaryActions,
  ...Object.entries(actions)
    .reduce((acc, [key, value]) => {
      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(value);

      return acc;
    }, summaryActions)
});

const aggregateActions = (actions, buildData, mergeRequests, aggregation) => map(
  actions,
  (action) => {
    const concatedActions = action.reduce((summary, actionChunk) => ({
      stats: deepConcat(actionChunk.stats, summary.stats),
      network: concatNetworks(
        actionChunk.network,
        summary.network,
        mergeRequests
      )
    }), {
      stats: {},
      network: {}
    });

    return ({
      stats: aggregation(concatedActions.stats),
      network: expandNetwork(aggregateNetwork(aggregation, concatedActions.network), buildData),
    })
  });

module.exports = {
  concatActions,
  aggregateActions
};
